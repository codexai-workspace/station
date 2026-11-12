"""MX Component bridge -> GX Simulator3 (official route).

Talks JSON lines on stdin/stdout so server.js can use it as a driver.
Requires: Windows, MX Component installed, pywin32 (pip install pywin32),
and a Logical Station Number set to "GX Simulator3" in the
MX Component "Communication Setup Utility".

MX Component v4 is a 32-bit COM server -> run with 32-bit Python.
MX Component v5 also offers a 64-bit ProgID.
"""
import json
import struct
import sys

try:
    import win32com.client
except ImportError as e:  # reported by --diag and by Open
    win32com = None
    IMPORT_ERROR = str(e)

PROGIDS = [
    "ActUtlType64Lib.ActUtlType64",
    "ActUtlType64.ActUtlType64",
    "ActUtlTypeLib.ActUtlType",
    "ActUtlType.ActUtlType",
]


def diag():
    info = dict(python=sys.executable, version=sys.version.split()[0], bits=struct.calcsize("P") * 8,
                pywin32=win32com is not None, progids={})
    if win32com is None:
        info["pywin32_error"] = IMPORT_ERROR
    else:
        for pid in PROGIDS:
            try:
                win32com.client.Dispatch(pid)
                info["progids"][pid] = "ok"
            except Exception as e:
                info["progids"][pid] = str(e)[:160]
    out(info)


def create():
    if win32com is None:
        raise RuntimeError("ไม่พบ pywin32: รัน  " + sys.executable + " -m pip install pywin32")
    err = None
    for pid in PROGIDS:
        try:
            return win32com.client.gencache.EnsureDispatch(pid), pid
        except Exception as e:  # try next ProgID
            err = e
    raise RuntimeError(f"Cannot create MX Component object: {err}")


def unpack(r):
    # gencache returns (ret, value) for [out] params
    if isinstance(r, tuple):
        return r[0], r[1]
    return 0, r


class VtableMx:
    """Batched access through the COM vtable (ctypes).

    Through IDispatch, pywin32 can only pass a single short for the array argument of
    ReadDeviceRandom2 / WriteDeviceRandom2, so the old path made one GetDevice2/SetDevice2
    call per device (~25-30 ms each on GX Simulator3). Calling the dual interface's vtable
    directly reads or writes any number of devices in one ~25-30 ms call.
    Offsets come from the object's own type library, so nothing is hard-coded.
    """

    def __init__(self, disp, progid):
        import ctypes
        from ctypes import POINTER, WINFUNCTYPE, HRESULT, byref, c_long, c_short, c_void_p
        self.ct = ctypes
        ti = disp._oleobj_.GetTypeInfo()
        vti = ti.GetRefTypeInfo(ti.GetRefTypeOfImplType(-1))  # dual -> vtable interface
        off = {}
        for i in range(vti.GetTypeAttr().cFuncs):
            f = vti.GetFuncDesc(i)
            off[(vti.GetNames(f.memid)[0], f.invkind)] = f.oVft
        # Our own instance of the same class, held as a raw interface pointer.
        import pywintypes
        clsid = str(pywintypes.IID(progid))
        iid = str(vti.GetTypeAttr().iid)
        self.p = c_void_p()
        ole32 = ctypes.oledll.ole32

        class GUID(ctypes.Structure):
            _fields_ = [("b", ctypes.c_byte * 16)]

        def guid(s):
            g = GUID()
            ole32.CLSIDFromString(ctypes.c_wchar_p(s), byref(g))
            return g
        ole32.CoCreateInstance(byref(guid(clsid)), None, 1 | 4, byref(guid(iid)), byref(self.p))
        vt = ctypes.cast(ctypes.cast(self.p, POINTER(c_void_p))[0], POINTER(c_void_p))
        ptr = ctypes.sizeof(c_void_p)

        def method(name, kind, *argt):
            return WINFUNCTYPE(HRESULT, c_void_p, *argt)(vt[off[(name, kind)] // ptr])
        self._put_station = method("ActLogicalStationNumber", 4, c_long)
        self._open = method("Open", 1, POINTER(c_long))
        self._close = method("Close", 1, POINTER(c_long))
        self._read = method("ReadDeviceRandom2", 1, c_void_p, c_long, POINTER(c_short), POINTER(c_long))
        self._write = method("WriteDeviceRandom2", 1, c_void_p, c_long, POINTER(c_short), POINTER(c_long))
        oa = ctypes.oledll.oleaut32
        oa.SysAllocString.restype = c_void_p
        oa.SysFreeString.argtypes = [c_void_p]
        self._alloc, self._free = oa.SysAllocString, oa.SysFreeString
        self.c_long, self.c_short, self.byref = c_long, c_short, byref

    def _rc(self, fn, *args):
        rc = self.c_long()
        fn(self.p, *args, self.byref(rc))
        return rc.value

    def open(self, station):
        self._put_station(self.p, station)
        return self._rc(self._open)

    def close(self):
        self._rc(self._close)

    def _call(self, fn, devs, buf):
        b = self._alloc(self.ct.c_wchar_p("\n".join(devs)))
        try:
            return self._rc(fn, b, len(devs), buf)
        finally:
            self._free(b)

    def get(self, devs):
        buf = (self.c_short * len(devs))()
        ret = self._call(self._read, devs, buf)
        if ret != 0:
            raise RuntimeError(f"ReadDeviceRandom2 0x{ret & 0xFFFFFFFF:08X}")
        return [int(v) for v in buf]

    def set(self, devs, values):
        buf = (self.c_short * len(devs))(*[int(v) for v in values])
        ret = self._call(self._write, devs, buf)
        if ret != 0:
            raise RuntimeError(f"WriteDeviceRandom2 0x{ret & 0xFFFFFFFF:08X}")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--diag":
        return diag()
    station = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    try:
        act, pid = create()
    except Exception as e:
        out(dict(id=0, ok=False, error=str(e)))
        return
    fast = None
    try:
        fast = VtableMx(act, pid)
        rc = fast.open(station)
        if rc != 0:
            fast.close()
            fast = None
    except Exception as e:  # fall back to one IDispatch call per device
        sys.stderr.write(f"batched MX access unavailable: {e}\n")
        fast = None
    if fast is None:
        act.ActLogicalStationNumber = station
        rc = act.Open()
    out(dict(id=0, ok=rc == 0, info=f"{pid} station {station}" + (" · batched" if fast else ""),
             error=None if rc == 0 else
             f"Open failed 0x{rc & 0xFFFFFFFF:08X} - check that GX Works3 simulation is running "
             f"(Debug > Simulation > Start Simulation) and station {station} targets GX Simulator3"))
    if rc != 0:
        return

    for line in sys.stdin:
        req = None
        try:
            req = json.loads(line.lstrip("﻿"))  # tolerate a UTF-8 BOM (e.g. PowerShell pipes)
            if fast and req["op"] == "get":
                out(dict(id=req["id"], ok=True, values=fast.get(req["devs"])))
            elif fast and req["op"] == "set":
                fast.set(req["devs"], req["values"])
                out(dict(id=req["id"], ok=True))
            elif req["op"] == "get":
                vals = []
                for d in req["devs"]:
                    ret, v = unpack(act.GetDevice2(d, 0))
                    if ret != 0:
                        raise RuntimeError(f"GetDevice2 {d} 0x{ret & 0xFFFFFFFF:08X}")
                    vals.append(int(v))
                out(dict(id=req["id"], ok=True, values=vals))
            elif req["op"] == "set":
                for d, v in zip(req["devs"], req["values"]):
                    ret = act.SetDevice2(d, int(v))
                    if isinstance(ret, tuple):
                        ret = ret[0]
                    if ret != 0:
                        raise RuntimeError(f"SetDevice2 {d} 0x{ret & 0xFFFFFFFF:08X}")
                out(dict(id=req["id"], ok=True))
        except Exception as e:
            out(dict(id=req.get("id", -1) if isinstance(req, dict) else -1, ok=False, error=str(e)))
    if fast:
        fast.close()
    else:
        act.Close()


def out(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


if __name__ == "__main__":
    main()

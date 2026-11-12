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


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--diag":
        return diag()
    station = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    try:
        act, pid = create()
    except Exception as e:
        out(dict(id=0, ok=False, error=str(e)))
        return
    act.ActLogicalStationNumber = station
    rc = act.Open()
    out(dict(id=0, ok=rc == 0, info=f"{pid} station {station}",
             error=None if rc == 0 else
             f"Open failed 0x{rc & 0xFFFFFFFF:08X} - check that GX Works3 simulation is running "
             f"(Debug > Simulation > Start Simulation) and station {station} targets GX Simulator3"))
    if rc != 0:
        return

    for line in sys.stdin:
        req = None
        try:
            req = json.loads(line.lstrip("﻿"))  # tolerate a UTF-8 BOM (e.g. PowerShell pipes)
            if req["op"] == "get":
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
    act.Close()


def out(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


if __name__ == "__main__":
    main()

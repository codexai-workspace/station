@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Induvara Digital Twin
where node >nul 2>nul
if %errorlevel%==0 (
  echo เปิด http://localhost:8000 ในเบราว์เซอร์
  echo เชื่อม GX Simulator3 / PLC จริงได้จากปุ่ม "เชื่อมต่อ GX Works3 / PLC" บนหน้าเว็บ
  echo กด Ctrl+C เพื่อหยุด
  start "" http://localhost:8000
  node bridge\server.js
  pause
  exit /b
)
echo ไม่พบ Node.js: เปิดได้แบบจำลองอย่างเดียว (เชื่อม PLC ไม่ได้)
echo ติดตั้ง Node.js LTS จาก https://nodejs.org แล้วเปิด start.bat ใหม่เพื่อใช้การเชื่อมต่อ PLC
start "" http://localhost:8000
py -3 -m http.server 8000 --bind 127.0.0.1
if errorlevel 1 pause

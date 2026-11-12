@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Mock FX5U (SLMP 127.0.0.1:5007)
echo PLC จำลองสำหรับทดสอบ: ในหน้าเว็บเลือก "PLC จริง (LAN)" IP 127.0.0.1 Port 5007
node bridge\mock-plc.js
pause

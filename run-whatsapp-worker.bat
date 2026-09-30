@echo off
title Mentra WhatsApp Worker
echo ========================================================
echo        MENTRA WHATSAPP 24/7 BACKGROUND WORKER
echo ========================================================
echo Starting WhatsApp Baileys Worker...
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0brain-worker"
node src/index.mjs
pause

@echo off
title Mentra WhatsApp Worker
echo ========================================================
echo        MENTRA WHATSAPP 24/7 BACKGROUND WORKER
echo ========================================================
echo Starting WhatsApp Baileys Worker...
cd /d "%~dp0brain-worker"
node --env-file=.env src/index.mjs
pause

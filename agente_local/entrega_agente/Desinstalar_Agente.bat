@echo off
:: ============================================================
:: Desinstalador del Agente Local - Control de Marcas
:: ============================================================
title Desinstalador Agente de Marcas

set "INSTALL_DIR=%LOCALAPPDATA%\MarcasAgent"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=AgenteMarcas.lnk"

echo.
echo  Cerrando el agente si esta en ejecucion...
taskkill /IM "Marcas.Agent.Worker.exe" /F >nul 2>&1

echo  Eliminando acceso directo de inicio automatico...
if exist "%STARTUP_DIR%\%SHORTCUT_NAME%" del /F /Q "%STARTUP_DIR%\%SHORTCUT_NAME%"

echo  Eliminando archivos del agente...
if exist "%INSTALL_DIR%" rmdir /S /Q "%INSTALL_DIR%"

echo.
echo  Agente desinstalado correctamente.
pause

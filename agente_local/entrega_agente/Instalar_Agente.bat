@echo off
:: ============================================================
:: Instalador del Agente Local - Sistema de Control de Marcas
:: RECOPE - Refinadora Costarricense de Petróleo
:: ============================================================
:: Ejecutar como Administrador para que el acceso directo de
:: inicio automático quede disponible para todos los usuarios.
:: ============================================================

title Instalador Agente de Marcas

echo.
echo  ================================================
echo   AGENTE LOCAL - SISTEMA DE CONTROL DE MARCAS
echo   RECOPE
echo  ================================================
echo.

:: Directorio de instalación (carpeta oculta del usuario)
set "INSTALL_DIR=%LOCALAPPDATA%\MarcasAgent"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "EXE_NAME=Marcas.Agent.Worker.exe"
set "SHORTCUT_NAME=AgenteMarcas.lnk"

echo  [1/4] Creando directorio de instalacion...
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo        Creado: %INSTALL_DIR%
) else (
    echo        Ya existe: %INSTALL_DIR%
)

echo.
echo  [2/4] Copiando archivos del agente...
copy /Y "%~dp0%EXE_NAME%" "%INSTALL_DIR%\%EXE_NAME%" >nul
if errorlevel 1 (
    echo        ERROR: No se pudo copiar %EXE_NAME%.
    echo        Asegurese de ejecutar desde la carpeta correcta.
    pause
    exit /b 1
)

copy /Y "%~dp0appsettings.json" "%INSTALL_DIR%\appsettings.json" >nul
echo        Archivos copiados correctamente.

echo.
echo  [3/4] Configurando inicio automatico con Windows...

:: Crear acceso directo en la carpeta Startup usando PowerShell
powershell -NoProfile -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; " ^
    "$Shortcut = $WshShell.CreateShortcut('%STARTUP_DIR%\%SHORTCUT_NAME%'); " ^
    "$Shortcut.TargetPath = '%INSTALL_DIR%\%EXE_NAME%'; " ^
    "$Shortcut.WorkingDirectory = '%INSTALL_DIR%'; " ^
    "$Shortcut.WindowStyle = 7; " ^
    "$Shortcut.Description = 'Agente Local Sistema de Marcas RECOPE'; " ^
    "$Shortcut.Save();"

if errorlevel 1 (
    echo        ADVERTENCIA: No se pudo crear el acceso directo de inicio automatico.
    echo        El agente debe iniciarse manualmente cada vez.
) else (
    echo        Inicio automatico configurado correctamente.
)

echo.
echo  [4/4] Instalacion completada.
echo.
echo  ================================================
echo   El agente se conecta automaticamente usando
echo   su usuario de Windows. No requiere configuracion
echo   adicional. El empleado debe estar registrado
echo   en el sistema con su login de Windows.
echo.
echo   API configurada: marcas-api-2381.onrender.com
echo  ================================================
echo.

set /p INICIAR="  Desea iniciar el agente ahora? (S/N): "
if /i "%INICIAR%"=="S" (
    echo.
    echo  Iniciando agente...
    start "" "%INSTALL_DIR%\%EXE_NAME%"
    echo  El agente esta corriendo en la bandeja del sistema.
    echo  Busque el icono (i) cerca del reloj en la esquina inferior derecha.
)

echo.
echo  Presione cualquier tecla para cerrar este instalador.
pause >nul

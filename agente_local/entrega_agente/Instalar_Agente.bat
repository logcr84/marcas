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

echo  [1/5] Creando directorio de instalacion...
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo        Creado: %INSTALL_DIR%
) else (
    echo        Ya existe: %INSTALL_DIR%
)

echo.
echo  [2/5] Copiando archivos del agente...
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
echo  [3/5] Obteniendo configuracion de Perfil del Usuario...
echo  Intentando obtener informacion desde Active Directory...
set "USER_DEPTO="
set "USER_PUESTO="
set "USER_NOMBRE="
set "USER_EMAIL="

for /f "tokens=1,* delims==" %%A in ('powershell -NoProfile -Command "$ErrorActionPreference='Stop'; try { $s = New-Object -ComObject 'ADSystemInfo'; $u = [ADSI]('LDAP://'+$s.UserName); Write-Output ('USER_DEPTO='+$u.Department); Write-Output ('USER_PUESTO='+$u.Title); Write-Output ('USER_NOMBRE='+$u.DisplayName); Write-Output ('USER_EMAIL='+$u.mail) } catch {}"') do (
    if "%%A"=="USER_DEPTO" set "USER_DEPTO=%%B"
    if "%%A"=="USER_PUESTO" set "USER_PUESTO=%%B"
    if "%%A"=="USER_NOMBRE" set "USER_NOMBRE=%%B"
    if "%%A"=="USER_EMAIL" set "USER_EMAIL=%%B"
)

if "%USER_NOMBRE%"=="" (
    echo  No se pudo obtener la informacion automaticamente.
    echo  Por favor, ingrese sus datos manualmente.
    set /p USER_DEPTO="  Ingrese su Departamento (ej. Recursos Humanos): "
    set /p USER_PUESTO="  Ingrese su Puesto (ej. Analista): "
    set /p USER_NOMBRE="  Ingrese su Nombre Completo: "
    set /p USER_EMAIL="  Ingrese su Email / UPN: "
) else (
    echo  Datos obtenidos exitosamente de Active Directory:
    echo    Nombre:       %USER_NOMBRE%
    echo    Email:        %USER_EMAIL%
    echo    Departamento: %USER_DEPTO%
    echo    Puesto:       %USER_PUESTO%
)

if not "%USER_DEPTO%"=="" setx USER_DEPARTAMENTO "%USER_DEPTO%" >nul
if not "%USER_PUESTO%"=="" setx USER_PUESTO "%USER_PUESTO%" >nul
if not "%USER_NOMBRE%"=="" setx USER_NOMBRE_COMPLETO "%USER_NOMBRE%" >nul
if not "%USER_EMAIL%"=="" setx USER_EMAIL "%USER_EMAIL%" >nul
echo        Perfil configurado correctamente en el sistema.

echo.
echo  [4/5] Configurando inicio automatico con Windows...

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
echo  [5/5] Instalacion completada.
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

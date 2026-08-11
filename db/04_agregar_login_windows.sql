-- ============================================================
-- Script 04: Agregar LoginWindows a UsuarioWeb
-- Permite que el agente se autentique con el usuario de Windows
-- ============================================================

-- 1. Agregar columna LoginWindows a la tabla de usuarios
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'seguridad'
      AND TABLE_NAME   = 'UsuarioWeb'
      AND COLUMN_NAME  = 'LoginWindows'
)
BEGIN
    ALTER TABLE seguridad.UsuarioWeb
        ADD LoginWindows NVARCHAR(100) NULL;

    -- Índice único para evitar duplicados (un usuario Windows = un empleado)
    CREATE UNIQUE INDEX IX_UsuarioWeb_LoginWindows
        ON seguridad.UsuarioWeb (LoginWindows)
        WHERE LoginWindows IS NOT NULL;

    PRINT 'Columna LoginWindows agregada a seguridad.UsuarioWeb.';
END
ELSE
    PRINT 'La columna LoginWindows ya existe.';
GO

-- 2. Actualizar el usuario administrador de prueba con su usuario de Windows
-- Cambie 'DOMINIO\usuario' o simplemente 'usuario' según su configuración
-- Ejemplo: si en Windows aparece C:\Users\jperez, el LoginWindows es 'jperez'
-- UPDATE seguridad.UsuarioWeb
-- SET LoginWindows = 'jperez'
-- WHERE Login = 'admin@marcas.local';
-- GO

PRINT 'Script 04 ejecutado. Recuerde asignar el LoginWindows a cada empleado.';
GO

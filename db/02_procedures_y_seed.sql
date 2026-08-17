-- ============================================================
-- Script 02: Stored Procedures, Vistas y Datos Semilla
-- Sistema de Control de Marcas
-- ============================================================

-- ============================================================
-- STORED PROCEDURE: Reporte de Marcas por Empleado (máx 6 meses)
-- ============================================================
CREATE OR ALTER PROCEDURE asistencia.sp_ReporteMarcasEmpleado
    @EmpleadoID  BIGINT,
    @FechaInicio DATE,
    @FechaFin    DATE
AS
BEGIN
    SET NOCOUNT ON;

    IF DATEDIFF(DAY, @FechaInicio, @FechaFin) > 183
        THROW 50001, 'El reporte no puede superar seis meses (183 días).', 1;

    IF @FechaFin < @FechaInicio
        THROW 50002, 'La fecha de fin no puede ser anterior a la fecha de inicio.', 1;

    SELECT
        m.MarcaID,
        e.CodigoEmpleado,
        e.Nombre + ' ' + e.PrimerApellido AS NombreEmpleado,
        m.FechaHoraServidor,
        m.FechaHoraCliente,
        tm.Codigo      AS TipoMarca,
        tm.Nombre      AS NombreTipoMarca,
        m.EstadoMarca,
        m.ObservacionTecnica,
        j.JustificacionID,
        j.EstadoJustificacion,
        j.TextoJustificacion,
        mj.Descripcion AS MotivoJustificacion
    FROM asistencia.Marca m
    JOIN rrhh.Empleado e
        ON e.EmpleadoID = m.EmpleadoID
    JOIN asistencia.TipoMarca tm
        ON tm.TipoMarcaID = m.TipoMarcaID
    LEFT JOIN asistencia.Justificacion j
        ON j.MarcaID = m.MarcaID
    LEFT JOIN asistencia.MotivoJustificacion mj
        ON mj.MotivoID = j.MotivoID
    WHERE m.EmpleadoID = @EmpleadoID
      AND m.FechaHoraServidor >= @FechaInicio
      AND m.FechaHoraServidor <  DATEADD(DAY, 1, @FechaFin)
    ORDER BY m.FechaHoraServidor DESC;
END;
GO

-- ============================================================
-- STORED PROCEDURE: Reporte General de Marcas (RRHH/Jefatura)
-- ============================================================
CREATE OR ALTER PROCEDURE asistencia.sp_ReporteGeneralMarcas
    @FechaInicio    DATE,
    @FechaFin       DATE,
    @DepartamentoID INT  = NULL,
    @EstadoMarca    VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF DATEDIFF(DAY, @FechaInicio, @FechaFin) > 183
        THROW 50001, 'El reporte no puede superar seis meses (183 días).', 1;

    SELECT
        m.MarcaID,
        e.CodigoEmpleado,
        e.Nombre + ' ' + e.PrimerApellido AS NombreEmpleado,
        d.Nombre      AS Departamento,
        p.Nombre      AS Puesto,
        m.FechaHoraServidor,
        tm.Codigo     AS TipoMarca,
        m.EstadoMarca,
        j.EstadoJustificacion
    FROM asistencia.Marca m
    JOIN rrhh.Empleado e
        ON e.EmpleadoID = m.EmpleadoID
    JOIN rrhh.Departamento d
        ON d.DepartamentoID = e.DepartamentoID
    JOIN rrhh.Puesto p
        ON p.PuestoID = e.PuestoID
    JOIN asistencia.TipoMarca tm
        ON tm.TipoMarcaID = m.TipoMarcaID
    LEFT JOIN asistencia.Justificacion j
        ON j.MarcaID = m.MarcaID
    WHERE m.FechaHoraServidor >= @FechaInicio
      AND m.FechaHoraServidor <  DATEADD(DAY, 1, @FechaFin)
      AND (@DepartamentoID IS NULL OR e.DepartamentoID = @DepartamentoID)
      AND (@EstadoMarca IS NULL OR m.EstadoMarca = @EstadoMarca)
    ORDER BY m.FechaHoraServidor DESC, e.PrimerApellido;
END;
GO

-- ============================================================
-- STORED PROCEDURE: Archivo mensual de marcas históricas
-- ============================================================
CREATE OR ALTER PROCEDURE asistencia.sp_ArchivarMarcasHistoricas
    @FechaCorte DATE  -- mueve registros anteriores a esta fecha
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Archivo de Justificaciones resueltas
        INSERT INTO historico.JustificacionHistorico
            (JustificacionID, EmpleadoID, MarcaID, MotivoID, FechaInicio, FechaFin,
             TextoJustificacion, EstadoJustificacion, FechaSolicitud,
             AprobadorEmpleadoID, FechaResolucion, ComentarioResolucion)
        SELECT
            j.JustificacionID, j.EmpleadoID, j.MarcaID, j.MotivoID,
            j.FechaInicio, j.FechaFin, j.TextoJustificacion,
            j.EstadoJustificacion, j.FechaSolicitud,
            j.AprobadorEmpleadoID, j.FechaResolucion, j.ComentarioResolucion
        FROM asistencia.Justificacion j
        JOIN asistencia.Marca m ON m.MarcaID = j.MarcaID
        WHERE m.FechaHoraServidor < @FechaCorte
          AND j.EstadoJustificacion IN ('APROBADA','RECHAZADA','ANULADA')
          AND NOT EXISTS (SELECT 1 FROM historico.JustificacionHistorico h WHERE h.JustificacionID = j.JustificacionID);

        -- Archivo de Marcas
        INSERT INTO historico.MarcaHistorico
            (MarcaID, EmpleadoID, TipoMarcaID, AgenteID, FechaHoraServidor,
             FechaHoraCliente, IdempotencyKey, EstadoMarca, ObservacionTecnica)
        SELECT
            m.MarcaID, m.EmpleadoID, m.TipoMarcaID, m.AgenteID,
            m.FechaHoraServidor, m.FechaHoraCliente, m.IdempotencyKey,
            m.EstadoMarca, m.ObservacionTecnica
        FROM asistencia.Marca m
        WHERE m.FechaHoraServidor < @FechaCorte
          AND NOT EXISTS (SELECT 1 FROM historico.MarcaHistorico h WHERE h.MarcaID = m.MarcaID)
          AND NOT EXISTS (
                SELECT 1 FROM asistencia.Justificacion j2
                WHERE j2.MarcaID = m.MarcaID
                  AND j2.EstadoJustificacion = 'PENDIENTE');

        -- Eliminación de justificaciones archivadas (de tablas activas)
        DELETE j
        FROM asistencia.Justificacion j
        WHERE EXISTS (SELECT 1 FROM historico.JustificacionHistorico h WHERE h.JustificacionID = j.JustificacionID);

        -- Eliminación de marcas archivadas (de tablas activas)
        DELETE m
        FROM asistencia.Marca m
        WHERE EXISTS (SELECT 1 FROM historico.MarcaHistorico h WHERE h.MarcaID = m.MarcaID);

        COMMIT TRANSACTION;
        PRINT 'Archivo completado exitosamente.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ============================================================
-- VISTA: Justificaciones pendientes de aprobación
-- ============================================================
CREATE OR ALTER VIEW asistencia.vw_JustificacionesPendientes
AS
SELECT
    j.JustificacionID,
    e.CodigoEmpleado,
    e.Nombre + ' ' + e.PrimerApellido AS NombreEmpleado,
    d.Nombre      AS Departamento,
    mj.Descripcion AS Motivo,
    j.FechaInicio,
    j.FechaFin,
    j.TextoJustificacion,
    j.FechaSolicitud,
    m.FechaHoraServidor AS FechaMarcaAsociada,
    tm.Nombre           AS TipoMarcaAsociada
FROM asistencia.Justificacion j
JOIN rrhh.Empleado e        ON e.EmpleadoID  = j.EmpleadoID
JOIN rrhh.Departamento d    ON d.DepartamentoID = e.DepartamentoID
JOIN asistencia.MotivoJustificacion mj ON mj.MotivoID = j.MotivoID
LEFT JOIN asistencia.Marca m  ON m.MarcaID    = j.MarcaID
LEFT JOIN asistencia.TipoMarca tm ON tm.TipoMarcaID = m.TipoMarcaID
WHERE j.EstadoJustificacion = 'PENDIENTE';
GO

-- ============================================================
-- DATOS SEMILLA: Catálogos
-- ============================================================

-- ── Tipos de Marca: 12 tipos para empleado público CR ────────────────────────
-- Base legal: Ley Marco de Empleo Público (Ley 10159) y Código de Trabajo CR
-- IMPORTANTE: El orden de inserción define el TipoMarcaID (IDENTITY 1,1).
--             El agente local referencia estos IDs por valor fijo (1-12).
--             NO cambiar el orden sin actualizar también el agente.
--
--  ID │ Código                │ Descripción
--  ───┼───────────────────────┼──────────────────────────────────────
--   1 │ ENTRADA               │ Inicio de jornada laboral
--   2 │ SALIDA_CAFE_MANANA    │ Descanso de mañana ~15-20 min (Art. 138 CT)
--   3 │ REGRESO_CAFE_MANANA   │ Regreso del descanso de mañana
--   4 │ SALIDA_ALMUERZO       │ Tiempo de comida máx. 1 h (Art. 136 CT)
--   5 │ REGRESO_ALMUERZO      │ Regreso del tiempo de comida
--   6 │ SALIDA_CAFE_TARDE     │ Descanso de tarde ~15-20 min (Art. 138 CT)
--   7 │ REGRESO_CAFE_TARDE    │ Regreso del descanso de tarde
--   8 │ SALIDA                │ Fin de jornada laboral
--   9 │ SALIDA_COMISION       │ Comisión institucional (Art. 33 Ley 10159)
--  10 │ REGRESO_COMISION      │ Regreso de comisión
--  11 │ SALIDA_MEDICA         │ Cita médica CCSS (Art. 79 CT)
--  12 │ REGRESO_MEDICA        │ Regreso de cita médica
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE Codigo = 'ENTRADA')
INSERT INTO asistencia.TipoMarca (Codigo, Nombre, OrdenDia) VALUES
    -- Jornada principal
    ('ENTRADA',              'Entrada al trabajo',              1),
    -- Café mañana (Art. 138 CT)
    ('SALIDA_CAFE_MANANA',   'Salida a café (mañana)',          2),
    ('REGRESO_CAFE_MANANA',  'Regreso de café (mañana)',        3),
    -- Almuerzo (Art. 136 CT)
    ('SALIDA_ALMUERZO',      'Salida a almuerzo',               4),
    ('REGRESO_ALMUERZO',     'Regreso de almuerzo',             5),
    -- Café tarde (Art. 138 CT)
    ('SALIDA_CAFE_TARDE',    'Salida a café (tarde)',           6),
    ('REGRESO_CAFE_TARDE',   'Regreso de café (tarde)',         7),
    -- Fin de jornada
    ('SALIDA',               'Salida del trabajo',              8),
    -- Comisión (Art. 33 Ley 10159)
    ('SALIDA_COMISION',      'Salida en comisión',              9),
    ('REGRESO_COMISION',     'Regreso de comisión',            10),
    -- Médico CCSS (Art. 79 CT)
    ('SALIDA_MEDICA',        'Salida a cita médica (CCSS)',    11),
    ('REGRESO_MEDICA',       'Regreso de cita médica',         12);
GO

-- Motivos de Justificación
IF NOT EXISTS (SELECT 1 FROM asistencia.MotivoJustificacion WHERE Codigo = 'ENFERMEDAD')
INSERT INTO asistencia.MotivoJustificacion (Codigo, Descripcion, RequiereAprobacion) VALUES
    ('ENFERMEDAD',          'Enfermedad o cita médica',           1),
    ('ASUNTO_PERSONAL',     'Asunto personal autorizado',         1),
    ('CAPACITACION',        'Capacitación o formación interna',   1),
    ('VIAJE_TRABAJO',       'Viaje por asuntos laborales',        1),
    ('PERMISO_SINDICAL',    'Permiso sindical',                   1),
    ('FALLA_SISTEMA',       'Falla del sistema de marcado',       0),
    ('ERROR_TECNICO',       'Error técnico del agente',           0),
    ('VACACIONES',          'Período de vacaciones',              0),
    ('FERIADO',             'Día feriado o no laborable',         0),
    ('OTRO',                'Otro motivo (especificar en texto)', 1);
GO

-- Roles del Portal Web
IF NOT EXISTS (SELECT 1 FROM seguridad.Rol WHERE Nombre = 'RRHH_ADMIN')
INSERT INTO seguridad.Rol (Nombre, Descripcion) VALUES
    ('RRHH_ADMIN',         'Administrador de Recursos Humanos: acceso total'),
    ('JEFATURA',           'Jefatura: reportes de su departamento y aprobación de justificaciones'),
    ('AUDITOR',            'Auditor: acceso de solo lectura a reportes e históricos'),
    ('EMPLEADO_CONSULTA',  'Empleado: consulta de sus propias marcas y justificaciones');
GO

-- Departamento y Puesto base (para el usuario administrador)
IF NOT EXISTS (SELECT 1 FROM rrhh.Departamento WHERE Nombre = 'Sistemas')
INSERT INTO rrhh.Departamento (Nombre, Estado) VALUES ('Sistemas', 'ACTIVO');
GO

IF NOT EXISTS (SELECT 1 FROM rrhh.Puesto WHERE Nombre = 'Administrador TI')
INSERT INTO rrhh.Puesto (Nombre, Estado) VALUES ('Administrador TI', 'ACTIVO');
GO

-- Empleado administrador
IF NOT EXISTS (SELECT 1 FROM rrhh.Empleado WHERE CodigoEmpleado = 'ADM-001')
INSERT INTO rrhh.Empleado
    (CodigoEmpleado, Identificacion, Nombre, PrimerApellido, SegundoApellido,
     DepartamentoID, PuestoID, FechaIngreso, Estado)
SELECT 'ADM-001', '000000000', 'Admin', 'Sistema', NULL,
       d.DepartamentoID, p.PuestoID, GETDATE(), 'ACTIVO'
FROM rrhh.Departamento d, rrhh.Puesto p
WHERE d.Nombre = 'Sistemas' AND p.Nombre = 'Administrador TI';
GO

-- Usuario Web administrador
-- Contraseña: Admin@2026! (BCrypt hash generado con cost=12)
-- NOTA: Cambiar contraseña en el primer inicio de sesión
IF NOT EXISTS (SELECT 1 FROM seguridad.UsuarioWeb WHERE Login = 'admin@marcas.local')
INSERT INTO seguridad.UsuarioWeb (EmpleadoID, Login, HashPassword, Estado)
SELECT e.EmpleadoID,
       'admin@marcas.local',
       '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@2026!
       'ACTIVO'
FROM rrhh.Empleado e WHERE e.CodigoEmpleado = 'ADM-001';
GO

-- Asignar rol RRHH_ADMIN al usuario administrador
IF NOT EXISTS (
    SELECT 1 FROM seguridad.UsuarioRol ur
    JOIN seguridad.UsuarioWeb uw ON uw.UsuarioID = ur.UsuarioID
    JOIN seguridad.Rol r ON r.RolID = ur.RolID
    WHERE uw.Login = 'admin@marcas.local' AND r.Nombre = 'RRHH_ADMIN'
)
INSERT INTO seguridad.UsuarioRol (UsuarioID, RolID)
SELECT uw.UsuarioID, r.RolID
FROM seguridad.UsuarioWeb uw, seguridad.Rol r
WHERE uw.Login = 'admin@marcas.local' AND r.Nombre = 'RRHH_ADMIN';
GO

PRINT 'Script 02 ejecutado correctamente: Procedures, Vistas y Datos semilla creados.';
GO

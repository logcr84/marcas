-- ============================================================
-- Script 02: Funciones (Stored Procedures), Vistas y Datos Semilla
-- Sistema de Control de Marcas - PostgreSQL
-- ============================================================

-- ============================================================
-- FUNCIÓN: Reporte de Marcas por Empleado (máx 6 meses)
-- ============================================================
CREATE OR REPLACE FUNCTION asistencia.fn_ReporteMarcasEmpleado(
    p_EmpleadoID  BIGINT,
    p_FechaInicio DATE,
    p_FechaFin    DATE
)
RETURNS TABLE (
    "MarcaID"              BIGINT,
    "CodigoEmpleado"       VARCHAR,
    "NombreEmpleado"       TEXT,
    "FechaHoraServidor"    TIMESTAMPTZ,
    "FechaHoraCliente"     TIMESTAMPTZ,
    "TipoMarca"            VARCHAR,
    "NombreTipoMarca"      VARCHAR,
    "EstadoMarca"          VARCHAR,
    "ObservacionTecnica"   VARCHAR,
    "JustificacionID"      BIGINT,
    "EstadoJustificacion"  VARCHAR,
    "TextoJustificacion"   VARCHAR,
    "MotivoJustificacion"  VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF (p_FechaFin - p_FechaInicio) > 183 THEN
        RAISE EXCEPTION 'El reporte no puede superar seis meses (183 días).'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_FechaFin < p_FechaInicio THEN
        RAISE EXCEPTION 'La fecha de fin no puede ser anterior a la fecha de inicio.'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN QUERY
    SELECT
        m."MarcaID",
        e."CodigoEmpleado",
        (e."Nombre" || ' ' || e."PrimerApellido")::TEXT AS "NombreEmpleado",
        m."FechaHoraServidor",
        m."FechaHoraCliente",
        tm."Codigo"      AS "TipoMarca",
        tm."Nombre"      AS "NombreTipoMarca",
        m."EstadoMarca",
        m."ObservacionTecnica",
        j."JustificacionID",
        j."EstadoJustificacion",
        j."TextoJustificacion",
        mj."Descripcion" AS "MotivoJustificacion"
    FROM asistencia."Marca" m
    JOIN rrhh."Empleado" e
        ON e."EmpleadoID" = m."EmpleadoID"
    JOIN asistencia."TipoMarca" tm
        ON tm."TipoMarcaID" = m."TipoMarcaID"
    LEFT JOIN asistencia."Justificacion" j
        ON j."MarcaID" = m."MarcaID"
    LEFT JOIN asistencia."MotivoJustificacion" mj
        ON mj."MotivoID" = j."MotivoID"
    WHERE m."EmpleadoID" = p_EmpleadoID
      AND m."FechaHoraServidor" >= p_FechaInicio::TIMESTAMPTZ
      AND m."FechaHoraServidor" <  (p_FechaFin + INTERVAL '1 day')::TIMESTAMPTZ
    ORDER BY m."FechaHoraServidor" DESC;
END;
$$;

-- ============================================================
-- FUNCIÓN: Reporte General de Marcas (RRHH/Jefatura)
-- ============================================================
CREATE OR REPLACE FUNCTION asistencia.fn_ReporteGeneralMarcas(
    p_FechaInicio    DATE,
    p_FechaFin       DATE,
    p_DepartamentoID INT  DEFAULT NULL,
    p_EstadoMarca    VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    "MarcaID"              BIGINT,
    "CodigoEmpleado"       VARCHAR,
    "NombreEmpleado"       TEXT,
    "Departamento"         VARCHAR,
    "Puesto"               VARCHAR,
    "FechaHoraServidor"    TIMESTAMPTZ,
    "TipoMarca"            VARCHAR,
    "NombreTipoMarca"      VARCHAR,
    "EstadoMarca"          VARCHAR,
    "EstadoJustificacion"  VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF (p_FechaFin - p_FechaInicio) > 183 THEN
        RAISE EXCEPTION 'El reporte no puede superar seis meses (183 días).'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN QUERY
    SELECT
        m."MarcaID",
        e."CodigoEmpleado",
        (e."Nombre" || ' ' || e."PrimerApellido")::TEXT AS "NombreEmpleado",
        d."Nombre"    AS "Departamento",
        p."Nombre"    AS "Puesto",
        m."FechaHoraServidor",
        tm."Codigo"   AS "TipoMarca",
        tm."Nombre"   AS "NombreTipoMarca",
        m."EstadoMarca",
        j."EstadoJustificacion"
    FROM asistencia."Marca" m
    JOIN rrhh."Empleado" e
        ON e."EmpleadoID" = m."EmpleadoID"
    JOIN rrhh."Departamento" d
        ON d."DepartamentoID" = e."DepartamentoID"
    JOIN rrhh."Puesto" p
        ON p."PuestoID" = e."PuestoID"
    JOIN asistencia."TipoMarca" tm
        ON tm."TipoMarcaID" = m."TipoMarcaID"
    LEFT JOIN asistencia."Justificacion" j
        ON j."MarcaID" = m."MarcaID"
    WHERE m."FechaHoraServidor" >= p_FechaInicio::TIMESTAMPTZ
      AND m."FechaHoraServidor" <  (p_FechaFin + INTERVAL '1 day')::TIMESTAMPTZ
      AND (p_DepartamentoID IS NULL OR e."DepartamentoID" = p_DepartamentoID)
      AND (p_EstadoMarca IS NULL OR m."EstadoMarca" = p_EstadoMarca)
    ORDER BY m."FechaHoraServidor" DESC, e."PrimerApellido";
END;
$$;

-- ============================================================
-- FUNCIÓN: Archivo mensual de marcas históricas
-- ============================================================
CREATE OR REPLACE FUNCTION asistencia.fn_ArchivarMarcasHistoricas(
    p_FechaCorte DATE  -- mueve registros anteriores a esta fecha
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Archivo de Justificaciones resueltas
    INSERT INTO historico."JustificacionHistorico"
        ("JustificacionID", "EmpleadoID", "MarcaID", "MotivoID", "FechaInicio", "FechaFin",
         "TextoJustificacion", "EstadoJustificacion", "FechaSolicitud",
         "AprobadorEmpleadoID", "FechaResolucion", "ComentarioResolucion")
    SELECT
        j."JustificacionID", j."EmpleadoID", j."MarcaID", j."MotivoID",
        j."FechaInicio", j."FechaFin", j."TextoJustificacion",
        j."EstadoJustificacion", j."FechaSolicitud",
        j."AprobadorEmpleadoID", j."FechaResolucion", j."ComentarioResolucion"
    FROM asistencia."Justificacion" j
    JOIN asistencia."Marca" m ON m."MarcaID" = j."MarcaID"
    WHERE m."FechaHoraServidor" < p_FechaCorte::TIMESTAMPTZ
      AND j."EstadoJustificacion" IN ('APROBADA','RECHAZADA','ANULADA')
      AND NOT EXISTS (
          SELECT 1 FROM historico."JustificacionHistorico" h
          WHERE h."JustificacionID" = j."JustificacionID"
      );

    -- Archivo de Marcas
    INSERT INTO historico."MarcaHistorico"
        ("MarcaID", "EmpleadoID", "TipoMarcaID", "AgenteID", "FechaHoraServidor",
         "FechaHoraCliente", "IdempotencyKey", "EstadoMarca", "ObservacionTecnica")
    SELECT
        m."MarcaID", m."EmpleadoID", m."TipoMarcaID", m."AgenteID",
        m."FechaHoraServidor", m."FechaHoraCliente", m."IdempotencyKey",
        m."EstadoMarca", m."ObservacionTecnica"
    FROM asistencia."Marca" m
    WHERE m."FechaHoraServidor" < p_FechaCorte::TIMESTAMPTZ
      AND NOT EXISTS (
          SELECT 1 FROM historico."MarcaHistorico" h WHERE h."MarcaID" = m."MarcaID"
      )
      AND NOT EXISTS (
          SELECT 1 FROM asistencia."Justificacion" j2
          WHERE j2."MarcaID" = m."MarcaID"
            AND j2."EstadoJustificacion" = 'PENDIENTE'
      );

    -- Eliminación de justificaciones archivadas (de tablas activas)
    DELETE FROM asistencia."Justificacion" j
    WHERE EXISTS (
        SELECT 1 FROM historico."JustificacionHistorico" h
        WHERE h."JustificacionID" = j."JustificacionID"
    );

    -- Eliminación de marcas archivadas (de tablas activas)
    DELETE FROM asistencia."Marca" m
    WHERE EXISTS (
        SELECT 1 FROM historico."MarcaHistorico" h WHERE h."MarcaID" = m."MarcaID"
    );

    RAISE NOTICE 'Archivo completado exitosamente.';
END;
$$;

-- ============================================================
-- VISTA: Justificaciones pendientes de aprobación
-- ============================================================
CREATE OR REPLACE VIEW asistencia."vw_JustificacionesPendientes" AS
SELECT
    j."JustificacionID",
    e."CodigoEmpleado",
    (e."Nombre" || ' ' || e."PrimerApellido") AS "NombreEmpleado",
    d."Nombre"           AS "Departamento",
    mj."Descripcion"     AS "Motivo",
    j."FechaInicio",
    j."FechaFin",
    j."TextoJustificacion",
    j."FechaSolicitud",
    m."FechaHoraServidor" AS "FechaMarcaAsociada",
    tm."Nombre"           AS "TipoMarcaAsociada"
FROM asistencia."Justificacion" j
JOIN rrhh."Empleado" e         ON e."EmpleadoID"     = j."EmpleadoID"
JOIN rrhh."Departamento" d     ON d."DepartamentoID" = e."DepartamentoID"
JOIN asistencia."MotivoJustificacion" mj ON mj."MotivoID" = j."MotivoID"
LEFT JOIN asistencia."Marca" m ON m."MarcaID"         = j."MarcaID"
LEFT JOIN asistencia."TipoMarca" tm ON tm."TipoMarcaID" = m."TipoMarcaID"
WHERE j."EstadoJustificacion" = 'PENDIENTE';

-- ============================================================
-- DATOS SEMILLA: Catálogos
-- ============================================================

-- Tipos de Marca (empleados públicos CR — Ley 10159 y Código de Trabajo)
INSERT INTO asistencia."TipoMarca" ("Codigo", "Nombre", "OrdenDia") VALUES
    ('ENTRADA',              'Entrada al trabajo',              1),
    ('SALIDA_CAFE_MANANA',   'Salida a café (mañana)',          2),
    ('REGRESO_CAFE_MANANA',  'Regreso de café (mañana)',        3),
    ('SALIDA_ALMUERZO',      'Salida a almuerzo',               4),
    ('REGRESO_ALMUERZO',     'Regreso de almuerzo',             5),
    ('SALIDA_CAFE_TARDE',    'Salida a café (tarde)',           6),
    ('REGRESO_CAFE_TARDE',   'Regreso de café (tarde)',         7),
    ('SALIDA',               'Salida del trabajo',              8),
    ('SALIDA_COMISION',      'Salida en comisión',              9),
    ('REGRESO_COMISION',     'Regreso de comisión',            10),
    ('SALIDA_MEDICA',        'Salida a cita médica (CCSS)',    11),
    ('REGRESO_MEDICA',       'Regreso de cita médica',         12)
ON CONFLICT ("Codigo") DO NOTHING;

-- Motivos de Justificación
INSERT INTO asistencia."MotivoJustificacion" ("Codigo", "Descripcion", "RequiereAprobacion") VALUES
    ('ENFERMEDAD',          'Enfermedad o cita médica',           TRUE),
    ('ASUNTO_PERSONAL',     'Asunto personal autorizado',         TRUE),
    ('CAPACITACION',        'Capacitación o formación interna',   TRUE),
    ('VIAJE_TRABAJO',       'Viaje por asuntos laborales',        TRUE),
    ('PERMISO_SINDICAL',    'Permiso sindical',                   TRUE),
    ('FALLA_SISTEMA',       'Falla del sistema de marcado',       FALSE),
    ('ERROR_TECNICO',       'Error técnico del agente',           FALSE),
    ('VACACIONES',          'Período de vacaciones',              FALSE),
    ('FERIADO',             'Día feriado o no laborable',         FALSE),
    ('OTRO',                'Otro motivo (especificar en texto)', TRUE)
ON CONFLICT ("Codigo") DO NOTHING;

-- Roles del Portal Web
INSERT INTO seguridad."Rol" ("Nombre", "Descripcion") VALUES
    ('RRHH_ADMIN',         'Administrador de Recursos Humanos: acceso total'),
    ('JEFATURA',           'Jefatura: reportes de su departamento y aprobación de justificaciones'),
    ('AUDITOR',            'Auditor: acceso de solo lectura a reportes e históricos'),
    ('EMPLEADO_CONSULTA',  'Empleado: consulta de sus propias marcas y justificaciones')
ON CONFLICT ("Nombre") DO NOTHING;

-- Departamento y Puesto base (para el usuario administrador)
INSERT INTO rrhh."Departamento" ("Nombre", "Estado")
VALUES ('Sistemas', 'ACTIVO')
ON CONFLICT ("Nombre") DO NOTHING;

INSERT INTO rrhh."Puesto" ("Nombre", "Estado")
VALUES ('Administrador TI', 'ACTIVO')
ON CONFLICT ("Nombre") DO NOTHING;

-- Empleado administrador
INSERT INTO rrhh."Empleado"
    ("CodigoEmpleado", "Identificacion", "Nombre", "PrimerApellido", "SegundoApellido",
     "DepartamentoID", "PuestoID", "FechaIngreso", "Estado")
SELECT 'ADM-001', '000000000', 'Admin', 'Sistema', NULL,
       d."DepartamentoID", p."PuestoID", CURRENT_DATE, 'ACTIVO'
FROM rrhh."Departamento" d, rrhh."Puesto" p
WHERE d."Nombre" = 'Sistemas' AND p."Nombre" = 'Administrador TI'
ON CONFLICT ("CodigoEmpleado") DO NOTHING;

-- Usuario Web administrador
-- Contraseña: Admin@2026! (BCrypt hash generado con cost=12)
-- NOTA: Cambiar contraseña en el primer inicio de sesión
INSERT INTO seguridad."UsuarioWeb" ("EmpleadoID", "Login", "HashPassword", "Estado")
SELECT e."EmpleadoID",
       'admin@marcas.local',
       '$2b$12$LxRbMGjndPMln2zbfan05OVaV./NqqNgIF7sNy7508Vc9sV2msQjy', -- Admin@2026!
       'ACTIVO'
FROM rrhh."Empleado" e WHERE e."CodigoEmpleado" = 'ADM-001'
ON CONFLICT ("Login") DO UPDATE 
SET "HashPassword" = '$2b$12$LxRbMGjndPMln2zbfan05OVaV./NqqNgIF7sNy7508Vc9sV2msQjy';

-- Asignar rol RRHH_ADMIN al usuario administrador
INSERT INTO seguridad."UsuarioRol" ("UsuarioID", "RolID")
SELECT uw."UsuarioID", r."RolID"
FROM seguridad."UsuarioWeb" uw, seguridad."Rol" r
WHERE uw."Login" = 'admin@marcas.local' AND r."Nombre" = 'RRHH_ADMIN'
ON CONFLICT ("UsuarioID", "RolID") DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Script 02 ejecutado correctamente: Funciones, Vistas y Datos semilla creados.';
END $$;

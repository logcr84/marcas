-- ============================================================
-- Sistema de Control de Marcas
-- Base de Datos: Marcas (PostgreSQL - Render.com)
-- Normalización: 4NF
-- Autor: Héctor Rodríguez Alfaro
-- Script: 01 - Esquemas, Tablas, Constraints e Índices
-- ============================================================

-- ============================================================
-- ESQUEMAS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS rrhh;
CREATE SCHEMA IF NOT EXISTS infra;
CREATE SCHEMA IF NOT EXISTS asistencia;
CREATE SCHEMA IF NOT EXISTS seguridad;
CREATE SCHEMA IF NOT EXISTS historico;
CREATE SCHEMA IF NOT EXISTS auditoria;

-- ============================================================
-- DOMINIO: RRHH
-- ============================================================

-- Departamentos (con jerarquía padre-hijo)
CREATE TABLE IF NOT EXISTS rrhh."Departamento" (
    "DepartamentoID"      SERIAL          NOT NULL,
    "Nombre"              VARCHAR(120)    NOT NULL,
    "DepartamentoPadreID" INT             NULL,
    "Estado"              VARCHAR(15)     NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_Departamento" PRIMARY KEY ("DepartamentoID"),
    CONSTRAINT "UQ_Departamento_Nombre" UNIQUE ("Nombre"),
    CONSTRAINT "FK_Departamento_Padre"
        FOREIGN KEY ("DepartamentoPadreID") REFERENCES rrhh."Departamento"("DepartamentoID"),
    CONSTRAINT "CK_Departamento_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO'))
);

-- Puestos
CREATE TABLE IF NOT EXISTS rrhh."Puesto" (
    "PuestoID" SERIAL       NOT NULL,
    "Nombre"   VARCHAR(120) NOT NULL,
    "Estado"   VARCHAR(15)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_Puesto" PRIMARY KEY ("PuestoID"),
    CONSTRAINT "UQ_Puesto_Nombre" UNIQUE ("Nombre"),
    CONSTRAINT "CK_Puesto_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO'))
);

-- Empleados (catálogo maestro — sin teléfonos, roles, turnos ni marcas repetidas)
CREATE TABLE IF NOT EXISTS rrhh."Empleado" (
    "EmpleadoID"      BIGSERIAL    NOT NULL,
    "CodigoEmpleado"  VARCHAR(30)  NOT NULL,
    "Identificacion"  VARCHAR(30)  NOT NULL,
    "Nombre"          VARCHAR(80)  NOT NULL,
    "PrimerApellido"  VARCHAR(80)  NOT NULL,
    "SegundoApellido" VARCHAR(80)  NULL,
    "DepartamentoID"  INT          NOT NULL,
    "PuestoID"        INT          NOT NULL,
    "FechaIngreso"    DATE         NOT NULL,
    "Estado"          VARCHAR(15)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_Empleado" PRIMARY KEY ("EmpleadoID"),
    CONSTRAINT "UQ_Empleado_Codigo" UNIQUE ("CodigoEmpleado"),
    CONSTRAINT "UQ_Empleado_Identificacion" UNIQUE ("Identificacion"),
    CONSTRAINT "FK_Empleado_Departamento"
        FOREIGN KEY ("DepartamentoID") REFERENCES rrhh."Departamento"("DepartamentoID"),
    CONSTRAINT "FK_Empleado_Puesto"
        FOREIGN KEY ("PuestoID") REFERENCES rrhh."Puesto"("PuestoID"),
    CONSTRAINT "CK_Empleado_Estado"
        CHECK ("Estado" IN ('ACTIVO','INACTIVO','SUSPENDIDO'))
);

-- ============================================================
-- DOMINIO: INFRAESTRUCTURA
-- ============================================================

-- Computadores (inventario de equipos donde se instala el agente)
CREATE TABLE IF NOT EXISTS infra."Computador" (
    "ComputadorID" BIGSERIAL   NOT NULL,
    "AssetTag"     VARCHAR(60) NOT NULL,
    "NombreHost"   VARCHAR(120) NOT NULL,
    "DireccionMAC" VARCHAR(40) NULL,
    "Estado"       VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_Computador" PRIMARY KEY ("ComputadorID"),
    CONSTRAINT "UQ_Computador_AssetTag" UNIQUE ("AssetTag"),
    CONSTRAINT "UQ_Computador_NombreHost" UNIQUE ("NombreHost"),
    CONSTRAINT "CK_Computador_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO','BAJA'))
);

-- Agentes instalados (N agentes pueden existir en un computador a lo largo del tiempo)
CREATE TABLE IF NOT EXISTS infra."AgenteInstalado" (
    "AgenteID"         BIGSERIAL    NOT NULL,
    "ComputadorID"     BIGINT       NOT NULL,
    "VersionAgente"    VARCHAR(30)  NOT NULL,
    "FechaInstalacion" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UltimoHeartbeat"  TIMESTAMPTZ  NULL,
    "Estado"           VARCHAR(15)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_AgenteInstalado" PRIMARY KEY ("AgenteID"),
    CONSTRAINT "FK_Agente_Computador"
        FOREIGN KEY ("ComputadorID") REFERENCES infra."Computador"("ComputadorID"),
    CONSTRAINT "CK_Agente_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO','ERROR'))
);

-- ============================================================
-- DOMINIO: ASISTENCIA
-- ============================================================

-- Catálogo de Tipos de Marca
CREATE TABLE IF NOT EXISTS asistencia."TipoMarca" (
    "TipoMarcaID" SMALLSERIAL NOT NULL,
    "Codigo"      VARCHAR(20) NOT NULL,
    "Nombre"      VARCHAR(80) NOT NULL,
    "OrdenDia"    SMALLINT    NOT NULL,
    "Estado"      VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_TipoMarca" PRIMARY KEY ("TipoMarcaID"),
    CONSTRAINT "UQ_TipoMarca_Codigo" UNIQUE ("Codigo"),
    CONSTRAINT "CK_TipoMarca_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO'))
);

-- Turnos de trabajo
CREATE TABLE IF NOT EXISTS asistencia."Turno" (
    "TurnoID"              SERIAL      NOT NULL,
    "Nombre"               VARCHAR(100) NOT NULL,
    "HoraEntrada"          TIME(0)     NOT NULL,
    "HoraSalida"           TIME(0)     NOT NULL,
    "ToleranciaEntradaMin" SMALLINT    NOT NULL DEFAULT 0,
    "ToleranciaSalidaMin"  SMALLINT    NOT NULL DEFAULT 0,
    "Estado"               VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_Turno" PRIMARY KEY ("TurnoID"),
    CONSTRAINT "UQ_Turno_Nombre" UNIQUE ("Nombre"),
    CONSTRAINT "CK_Turno_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO'))
);

-- Asignación de turnos a empleados (tabla de vigencia — 4NF)
CREATE TABLE IF NOT EXISTS asistencia."AsignacionTurno" (
    "AsignacionTurnoID" BIGSERIAL NOT NULL,
    "EmpleadoID"        BIGINT    NOT NULL,
    "TurnoID"           INT       NOT NULL,
    "FechaInicio"       DATE      NOT NULL,
    "FechaFin"          DATE      NULL,
    CONSTRAINT "PK_AsignacionTurno" PRIMARY KEY ("AsignacionTurnoID"),
    CONSTRAINT "FK_AsigTurno_Empleado"
        FOREIGN KEY ("EmpleadoID") REFERENCES rrhh."Empleado"("EmpleadoID"),
    CONSTRAINT "FK_AsigTurno_Turno"
        FOREIGN KEY ("TurnoID") REFERENCES asistencia."Turno"("TurnoID"),
    CONSTRAINT "CK_AsigTurno_Fechas"
        CHECK ("FechaFin" IS NULL OR "FechaFin" >= "FechaInicio")
);

-- Marcas de asistencia (hecho transaccional atómico)
CREATE TABLE IF NOT EXISTS asistencia."Marca" (
    "MarcaID"            BIGSERIAL   NOT NULL,
    "EmpleadoID"         BIGINT      NOT NULL,
    "TipoMarcaID"        SMALLINT    NOT NULL,
    "AgenteID"           BIGINT      NULL,
    "FechaHoraServidor"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "FechaHoraCliente"   TIMESTAMPTZ NULL,
    "IdempotencyKey"     UUID        NOT NULL,
    "EstadoMarca"        VARCHAR(20) NOT NULL DEFAULT 'VALIDA',
    "ObservacionTecnica" VARCHAR(500) NULL,
    CONSTRAINT "PK_Marca" PRIMARY KEY ("MarcaID"),
    CONSTRAINT "FK_Marca_Empleado"
        FOREIGN KEY ("EmpleadoID") REFERENCES rrhh."Empleado"("EmpleadoID"),
    CONSTRAINT "FK_Marca_Tipo"
        FOREIGN KEY ("TipoMarcaID") REFERENCES asistencia."TipoMarca"("TipoMarcaID"),
    CONSTRAINT "FK_Marca_Agente"
        FOREIGN KEY ("AgenteID") REFERENCES infra."AgenteInstalado"("AgenteID"),
    CONSTRAINT "UQ_Marca_Idempotency" UNIQUE ("IdempotencyKey"),
    CONSTRAINT "CK_Marca_Estado"
        CHECK ("EstadoMarca" IN ('VALIDA','ANULADA','PENDIENTE_REVISION'))
);

-- Catálogo de Motivos de Justificación
CREATE TABLE IF NOT EXISTS asistencia."MotivoJustificacion" (
    "MotivoID"           SMALLSERIAL NOT NULL,
    "Codigo"             VARCHAR(30) NOT NULL,
    "Descripcion"        VARCHAR(150) NOT NULL,
    "RequiereAprobacion" BOOLEAN     NOT NULL DEFAULT TRUE,
    "Estado"             VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "PK_MotivoJustificacion" PRIMARY KEY ("MotivoID"),
    CONSTRAINT "UQ_Motivo_Codigo" UNIQUE ("Codigo"),
    CONSTRAINT "CK_Motivo_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO'))
);

-- Justificaciones (explicación formal de incidencias)
CREATE TABLE IF NOT EXISTS asistencia."Justificacion" (
    "JustificacionID"      BIGSERIAL   NOT NULL,
    "EmpleadoID"           BIGINT      NOT NULL,
    "MarcaID"              BIGINT      NULL,
    "MotivoID"             SMALLINT    NOT NULL,
    "FechaInicio"          DATE        NOT NULL,
    "FechaFin"             DATE        NOT NULL,
    "TextoJustificacion"   VARCHAR(1000) NOT NULL,
    "EstadoJustificacion"  VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "FechaSolicitud"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "AprobadorEmpleadoID"  BIGINT      NULL,
    "FechaResolucion"      TIMESTAMPTZ NULL,
    "ComentarioResolucion" VARCHAR(1000) NULL,
    CONSTRAINT "PK_Justificacion" PRIMARY KEY ("JustificacionID"),
    CONSTRAINT "FK_Just_Empleado"
        FOREIGN KEY ("EmpleadoID") REFERENCES rrhh."Empleado"("EmpleadoID"),
    CONSTRAINT "FK_Just_Marca"
        FOREIGN KEY ("MarcaID") REFERENCES asistencia."Marca"("MarcaID"),
    CONSTRAINT "FK_Just_Motivo"
        FOREIGN KEY ("MotivoID") REFERENCES asistencia."MotivoJustificacion"("MotivoID"),
    CONSTRAINT "FK_Just_Aprobador"
        FOREIGN KEY ("AprobadorEmpleadoID") REFERENCES rrhh."Empleado"("EmpleadoID"),
    CONSTRAINT "CK_Just_Fechas"
        CHECK ("FechaFin" >= "FechaInicio"),
    CONSTRAINT "CK_Just_Estado"
        CHECK ("EstadoJustificacion" IN ('PENDIENTE','APROBADA','RECHAZADA','ANULADA'))
);

-- ============================================================
-- DOMINIO: SEGURIDAD (Usuarios del portal web)
-- ============================================================

CREATE TABLE IF NOT EXISTS seguridad."UsuarioWeb" (
    "UsuarioID"    BIGSERIAL   NOT NULL,
    "EmpleadoID"   BIGINT      NULL,
    "Login"        VARCHAR(120) NOT NULL,
    "HashPassword" VARCHAR(512) NULL,  -- BCrypt hash
    "LoginWindows" VARCHAR(100) NULL,
    "Estado"       VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    "UltimoAcceso" TIMESTAMPTZ NULL,
    CONSTRAINT "PK_UsuarioWeb" PRIMARY KEY ("UsuarioID"),
    CONSTRAINT "UQ_UsuarioWeb_Login" UNIQUE ("Login"),
    CONSTRAINT "FK_Usuario_Empleado"
        FOREIGN KEY ("EmpleadoID") REFERENCES rrhh."Empleado"("EmpleadoID"),
    CONSTRAINT "CK_Usuario_Estado" CHECK ("Estado" IN ('ACTIVO','INACTIVO','BLOQUEADO'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_UsuarioWeb_LoginWindows"
    ON seguridad."UsuarioWeb" ("LoginWindows")
    WHERE "LoginWindows" IS NOT NULL;

CREATE TABLE IF NOT EXISTS seguridad."Rol" (
    "RolID"       SMALLSERIAL NOT NULL,
    "Nombre"      VARCHAR(60) NOT NULL,
    "Descripcion" VARCHAR(150) NULL,
    CONSTRAINT "PK_Rol" PRIMARY KEY ("RolID"),
    CONSTRAINT "UQ_Rol_Nombre" UNIQUE ("Nombre")
);

-- Relación N:M Usuario–Rol (4NF: tabla puente)
CREATE TABLE IF NOT EXISTS seguridad."UsuarioRol" (
    "UsuarioID" BIGINT   NOT NULL,
    "RolID"     SMALLINT NOT NULL,
    CONSTRAINT "PK_UsuarioRol" PRIMARY KEY ("UsuarioID", "RolID"),
    CONSTRAINT "FK_UsuarioRol_Usuario"
        FOREIGN KEY ("UsuarioID") REFERENCES seguridad."UsuarioWeb"("UsuarioID"),
    CONSTRAINT "FK_UsuarioRol_Rol"
        FOREIGN KEY ("RolID") REFERENCES seguridad."Rol"("RolID")
);

-- ============================================================
-- DOMINIO: AUDITORÍA
-- ============================================================

CREATE TABLE IF NOT EXISTS auditoria."EventoAuditoria" (
    "EventoID"    BIGSERIAL   NOT NULL,
    "UsuarioID"   BIGINT      NULL,
    "Entidad"     VARCHAR(80) NOT NULL,
    "EntidadID"   BIGINT      NULL,
    "Accion"      VARCHAR(40) NOT NULL,
    "FechaEvento" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "IpOrigen"    VARCHAR(45) NULL,
    "Detalle"     VARCHAR(2000) NULL,
    CONSTRAINT "PK_EventoAuditoria" PRIMARY KEY ("EventoID")
);

-- ============================================================
-- DOMINIO: HISTÓRICO (destino del archivo mensual)
-- ============================================================

CREATE TABLE IF NOT EXISTS historico."MarcaHistorico" (
    "MarcaID"            BIGINT      NOT NULL,
    "EmpleadoID"         BIGINT      NOT NULL,
    "TipoMarcaID"        SMALLINT    NOT NULL,
    "AgenteID"           BIGINT      NULL,
    "FechaHoraServidor"  TIMESTAMPTZ NOT NULL,
    "FechaHoraCliente"   TIMESTAMPTZ NULL,
    "IdempotencyKey"     UUID        NOT NULL,
    "EstadoMarca"        VARCHAR(20) NOT NULL,
    "ObservacionTecnica" VARCHAR(500) NULL,
    "FechaArchivado"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_MarcaHistorico" PRIMARY KEY ("MarcaID")
);

CREATE TABLE IF NOT EXISTS historico."JustificacionHistorico" (
    "JustificacionID"      BIGINT      NOT NULL,
    "EmpleadoID"           BIGINT      NOT NULL,
    "MarcaID"              BIGINT      NULL,
    "MotivoID"             SMALLINT    NOT NULL,
    "FechaInicio"          DATE        NOT NULL,
    "FechaFin"             DATE        NOT NULL,
    "TextoJustificacion"   VARCHAR(1000) NOT NULL,
    "EstadoJustificacion"  VARCHAR(20) NOT NULL,
    "FechaSolicitud"       TIMESTAMPTZ NOT NULL,
    "AprobadorEmpleadoID"  BIGINT      NULL,
    "FechaResolucion"      TIMESTAMPTZ NULL,
    "ComentarioResolucion" VARCHAR(1000) NULL,
    "FechaArchivado"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_JustificacionHistorico" PRIMARY KEY ("JustificacionID")
);

-- ============================================================
-- ÍNDICES OPERATIVOS PRINCIPALES
-- ============================================================

-- Marca: Búsqueda por empleado y fecha (el más frecuente)
CREATE INDEX IF NOT EXISTS "IX_Marca_Empleado_Fecha"
    ON asistencia."Marca" ("EmpleadoID", "FechaHoraServidor" DESC)
    INCLUDE ("TipoMarcaID", "EstadoMarca");

-- Marca: Búsqueda global por fecha (para reportes de RRHH)
CREATE INDEX IF NOT EXISTS "IX_Marca_Fecha"
    ON asistencia."Marca" ("FechaHoraServidor" DESC);

-- Justificación: por empleado y periodo
CREATE INDEX IF NOT EXISTS "IX_Justificacion_Empleado_Fecha"
    ON asistencia."Justificacion" ("EmpleadoID", "FechaInicio", "FechaFin");

-- Justificación: por estado para flujo de aprobación
CREATE INDEX IF NOT EXISTS "IX_Justificacion_Estado"
    ON asistencia."Justificacion" ("EstadoJustificacion", "FechaSolicitud" DESC);

-- Agente: heartbeat y estado
CREATE INDEX IF NOT EXISTS "IX_Agente_Heartbeat"
    ON infra."AgenteInstalado" ("Estado", "UltimoHeartbeat" DESC);

-- ============================================================
RAISE NOTICE 'Script 01 ejecutado correctamente: Esquemas, Tablas e Índices creados.';

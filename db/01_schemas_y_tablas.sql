-- ============================================================
-- Sistema de Control de Marcas
-- Base de Datos: Marcas (Azure SQL Server)
-- Normalización: 4NF
-- Autor: Héctor Rodríguez Alfaro
-- Script: 01 - Esquemas, Tablas, Constraints e Índices
-- ============================================================

-- ============================================================
-- ESQUEMAS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'rrhh')
    EXEC('CREATE SCHEMA rrhh');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'infra')
    EXEC('CREATE SCHEMA infra');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'asistencia')
    EXEC('CREATE SCHEMA asistencia');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'seguridad')
    EXEC('CREATE SCHEMA seguridad');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'historico')
    EXEC('CREATE SCHEMA historico');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'auditoria')
    EXEC('CREATE SCHEMA auditoria');
GO

-- ============================================================
-- DOMINIO: RRHH
-- ============================================================

-- Departamentos (con jerarquía padre-hijo)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('rrhh.Departamento'))
CREATE TABLE rrhh.Departamento (
    DepartamentoID      INT IDENTITY(1,1)   NOT NULL,
    Nombre              NVARCHAR(120)       NOT NULL,
    DepartamentoPadreID INT                 NULL,
    Estado              VARCHAR(15)         NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_Departamento PRIMARY KEY (DepartamentoID),
    CONSTRAINT UQ_Departamento_Nombre UNIQUE (Nombre),
    CONSTRAINT FK_Departamento_Padre
        FOREIGN KEY (DepartamentoPadreID) REFERENCES rrhh.Departamento(DepartamentoID),
    CONSTRAINT CK_Departamento_Estado CHECK (Estado IN ('ACTIVO','INACTIVO'))
);
GO

-- Puestos
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('rrhh.Puesto'))
CREATE TABLE rrhh.Puesto (
    PuestoID INT IDENTITY(1,1)  NOT NULL,
    Nombre   NVARCHAR(120)      NOT NULL,
    Estado   VARCHAR(15)        NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_Puesto PRIMARY KEY (PuestoID),
    CONSTRAINT UQ_Puesto_Nombre UNIQUE (Nombre),
    CONSTRAINT CK_Puesto_Estado CHECK (Estado IN ('ACTIVO','INACTIVO'))
);
GO

-- Empleados (catálogo maestro — sin teléfonos, roles, turnos ni marcas repetidas)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('rrhh.Empleado'))
CREATE TABLE rrhh.Empleado (
    EmpleadoID      BIGINT IDENTITY(1,1) NOT NULL,
    CodigoEmpleado  VARCHAR(30)          NOT NULL,
    Identificacion  VARCHAR(30)          NOT NULL,
    Nombre          NVARCHAR(80)         NOT NULL,
    PrimerApellido  NVARCHAR(80)         NOT NULL,
    SegundoApellido NVARCHAR(80)         NULL,
    DepartamentoID  INT                  NOT NULL,
    PuestoID        INT                  NOT NULL,
    FechaIngreso    DATE                 NOT NULL,
    Estado          VARCHAR(15)          NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_Empleado PRIMARY KEY (EmpleadoID),
    CONSTRAINT UQ_Empleado_Codigo UNIQUE (CodigoEmpleado),
    CONSTRAINT UQ_Empleado_Identificacion UNIQUE (Identificacion),
    CONSTRAINT FK_Empleado_Departamento
        FOREIGN KEY (DepartamentoID) REFERENCES rrhh.Departamento(DepartamentoID),
    CONSTRAINT FK_Empleado_Puesto
        FOREIGN KEY (PuestoID) REFERENCES rrhh.Puesto(PuestoID),
    CONSTRAINT CK_Empleado_Estado
        CHECK (Estado IN ('ACTIVO','INACTIVO','SUSPENDIDO'))
);
GO

-- ============================================================
-- DOMINIO: INFRAESTRUCTURA
-- ============================================================

-- Computadores (inventario de equipos donde se instala el agente)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('infra.Computador'))
CREATE TABLE infra.Computador (
    ComputadorID BIGINT IDENTITY(1,1) NOT NULL,
    AssetTag     VARCHAR(60)          NOT NULL,
    NombreHost   VARCHAR(120)         NOT NULL,
    DireccionMAC VARCHAR(40)          NULL,
    Estado       VARCHAR(15)          NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_Computador PRIMARY KEY (ComputadorID),
    CONSTRAINT UQ_Computador_AssetTag UNIQUE (AssetTag),
    CONSTRAINT UQ_Computador_NombreHost UNIQUE (NombreHost),
    CONSTRAINT CK_Computador_Estado CHECK (Estado IN ('ACTIVO','INACTIVO','BAJA'))
);
GO

-- Agentes instalados (N agentes pueden existir en un computador a lo largo del tiempo)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('infra.AgenteInstalado'))
CREATE TABLE infra.AgenteInstalado (
    AgenteID         BIGINT IDENTITY(1,1) NOT NULL,
    ComputadorID     BIGINT               NOT NULL,
    VersionAgente    VARCHAR(30)          NOT NULL,
    FechaInstalacion DATETIME2(0)         NOT NULL DEFAULT SYSUTCDATETIME(),
    UltimoHeartbeat  DATETIME2(0)         NULL,
    Estado           VARCHAR(15)          NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_AgenteInstalado PRIMARY KEY (AgenteID),
    CONSTRAINT FK_Agente_Computador
        FOREIGN KEY (ComputadorID) REFERENCES infra.Computador(ComputadorID),
    CONSTRAINT CK_Agente_Estado CHECK (Estado IN ('ACTIVO','INACTIVO','ERROR'))
);
GO

-- ============================================================
-- DOMINIO: ASISTENCIA
-- ============================================================

-- Catálogo de Tipos de Marca
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('asistencia.TipoMarca'))
CREATE TABLE asistencia.TipoMarca (
    TipoMarcaID TINYINT IDENTITY(1,1) NOT NULL,
    Codigo      VARCHAR(20)           NOT NULL,
    Nombre      NVARCHAR(80)          NOT NULL,
    OrdenDia    TINYINT               NOT NULL,
    Estado      VARCHAR(15)           NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_TipoMarca PRIMARY KEY (TipoMarcaID),
    CONSTRAINT UQ_TipoMarca_Codigo UNIQUE (Codigo),
    CONSTRAINT CK_TipoMarca_Estado CHECK (Estado IN ('ACTIVO','INACTIVO'))
);
GO

-- Turnos de trabajo
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('asistencia.Turno'))
CREATE TABLE asistencia.Turno (
    TurnoID              INT IDENTITY(1,1) NOT NULL,
    Nombre               NVARCHAR(100)     NOT NULL,
    HoraEntrada          TIME(0)           NOT NULL,
    HoraSalida           TIME(0)           NOT NULL,
    ToleranciaEntradaMin SMALLINT          NOT NULL DEFAULT 0,
    ToleranciaSalidaMin  SMALLINT          NOT NULL DEFAULT 0,
    Estado               VARCHAR(15)       NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_Turno PRIMARY KEY (TurnoID),
    CONSTRAINT UQ_Turno_Nombre UNIQUE (Nombre),
    CONSTRAINT CK_Turno_Estado CHECK (Estado IN ('ACTIVO','INACTIVO'))
);
GO

-- Asignación de turnos a empleados (tabla de vigencia — 4NF)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('asistencia.AsignacionTurno'))
CREATE TABLE asistencia.AsignacionTurno (
    AsignacionTurnoID BIGINT IDENTITY(1,1) NOT NULL,
    EmpleadoID        BIGINT               NOT NULL,
    TurnoID           INT                  NOT NULL,
    FechaInicio       DATE                 NOT NULL,
    FechaFin          DATE                 NULL,
    CONSTRAINT PK_AsignacionTurno PRIMARY KEY (AsignacionTurnoID),
    CONSTRAINT FK_AsigTurno_Empleado
        FOREIGN KEY (EmpleadoID) REFERENCES rrhh.Empleado(EmpleadoID),
    CONSTRAINT FK_AsigTurno_Turno
        FOREIGN KEY (TurnoID) REFERENCES asistencia.Turno(TurnoID),
    CONSTRAINT CK_AsigTurno_Fechas
        CHECK (FechaFin IS NULL OR FechaFin >= FechaInicio)
);
GO

-- Marcas de asistencia (hecho transaccional atómico)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('asistencia.Marca'))
CREATE TABLE asistencia.Marca (
    MarcaID            BIGINT IDENTITY(1,1) NOT NULL,
    EmpleadoID         BIGINT               NOT NULL,
    TipoMarcaID        TINYINT              NOT NULL,
    AgenteID           BIGINT               NULL,
    FechaHoraServidor  DATETIME2(0)         NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaHoraCliente   DATETIME2(0)         NULL,
    IdempotencyKey     UNIQUEIDENTIFIER     NOT NULL,
    EstadoMarca        VARCHAR(20)          NOT NULL DEFAULT 'VALIDA',
    ObservacionTecnica NVARCHAR(500)        NULL,
    CONSTRAINT PK_Marca PRIMARY KEY (MarcaID),
    CONSTRAINT FK_Marca_Empleado
        FOREIGN KEY (EmpleadoID) REFERENCES rrhh.Empleado(EmpleadoID),
    CONSTRAINT FK_Marca_Tipo
        FOREIGN KEY (TipoMarcaID) REFERENCES asistencia.TipoMarca(TipoMarcaID),
    CONSTRAINT FK_Marca_Agente
        FOREIGN KEY (AgenteID) REFERENCES infra.AgenteInstalado(AgenteID),
    CONSTRAINT UQ_Marca_Idempotency UNIQUE (IdempotencyKey),
    CONSTRAINT CK_Marca_Estado
        CHECK (EstadoMarca IN ('VALIDA','ANULADA','PENDIENTE_REVISION'))
);
GO

-- Catálogo de Motivos de Justificación
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('asistencia.MotivoJustificacion'))
CREATE TABLE asistencia.MotivoJustificacion (
    MotivoID           SMALLINT IDENTITY(1,1) NOT NULL,
    Codigo             VARCHAR(30)            NOT NULL,
    Descripcion        NVARCHAR(150)          NOT NULL,
    RequiereAprobacion BIT                    NOT NULL DEFAULT 1,
    Estado             VARCHAR(15)            NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_MotivoJustificacion PRIMARY KEY (MotivoID),
    CONSTRAINT UQ_Motivo_Codigo UNIQUE (Codigo),
    CONSTRAINT CK_Motivo_Estado CHECK (Estado IN ('ACTIVO','INACTIVO'))
);
GO

-- Justificaciones (explicación formal de incidencias)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('asistencia.Justificacion'))
CREATE TABLE asistencia.Justificacion (
    JustificacionID      BIGINT IDENTITY(1,1) NOT NULL,
    EmpleadoID           BIGINT               NOT NULL,
    MarcaID              BIGINT               NULL,
    MotivoID             SMALLINT             NOT NULL,
    FechaInicio          DATE                 NOT NULL,
    FechaFin             DATE                 NOT NULL,
    TextoJustificacion   NVARCHAR(1000)       NOT NULL,
    EstadoJustificacion  VARCHAR(20)          NOT NULL DEFAULT 'PENDIENTE',
    FechaSolicitud       DATETIME2(0)         NOT NULL DEFAULT SYSUTCDATETIME(),
    AprobadorEmpleadoID  BIGINT               NULL,
    FechaResolucion      DATETIME2(0)         NULL,
    ComentarioResolucion NVARCHAR(1000)       NULL,
    CONSTRAINT PK_Justificacion PRIMARY KEY (JustificacionID),
    CONSTRAINT FK_Just_Empleado
        FOREIGN KEY (EmpleadoID) REFERENCES rrhh.Empleado(EmpleadoID),
    CONSTRAINT FK_Just_Marca
        FOREIGN KEY (MarcaID) REFERENCES asistencia.Marca(MarcaID),
    CONSTRAINT FK_Just_Motivo
        FOREIGN KEY (MotivoID) REFERENCES asistencia.MotivoJustificacion(MotivoID),
    CONSTRAINT FK_Just_Aprobador
        FOREIGN KEY (AprobadorEmpleadoID) REFERENCES rrhh.Empleado(EmpleadoID),
    CONSTRAINT CK_Just_Fechas
        CHECK (FechaFin >= FechaInicio),
    CONSTRAINT CK_Just_Estado
        CHECK (EstadoJustificacion IN ('PENDIENTE','APROBADA','RECHAZADA','ANULADA'))
);
GO

-- ============================================================
-- DOMINIO: SEGURIDAD (Usuarios del portal web)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('seguridad.UsuarioWeb'))
CREATE TABLE seguridad.UsuarioWeb (
    UsuarioID    BIGINT IDENTITY(1,1) NOT NULL,
    EmpleadoID   BIGINT               NULL,
    Login        VARCHAR(120)         NOT NULL,
    HashPassword NVARCHAR(512)        NULL,  -- BCrypt hash
    Estado       VARCHAR(15)          NOT NULL DEFAULT 'ACTIVO',
    UltimoAcceso DATETIME2(0)         NULL,
    CONSTRAINT PK_UsuarioWeb PRIMARY KEY (UsuarioID),
    CONSTRAINT UQ_UsuarioWeb_Login UNIQUE (Login),
    CONSTRAINT FK_Usuario_Empleado
        FOREIGN KEY (EmpleadoID) REFERENCES rrhh.Empleado(EmpleadoID),
    CONSTRAINT CK_Usuario_Estado CHECK (Estado IN ('ACTIVO','INACTIVO','BLOQUEADO'))
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('seguridad.Rol'))
CREATE TABLE seguridad.Rol (
    RolID       SMALLINT IDENTITY(1,1) NOT NULL,
    Nombre      VARCHAR(60)            NOT NULL,
    Descripcion NVARCHAR(150)          NULL,
    CONSTRAINT PK_Rol PRIMARY KEY (RolID),
    CONSTRAINT UQ_Rol_Nombre UNIQUE (Nombre)
);
GO

-- Relación N:M Usuario–Rol (4NF: tabla puente)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('seguridad.UsuarioRol'))
CREATE TABLE seguridad.UsuarioRol (
    UsuarioID BIGINT   NOT NULL,
    RolID     SMALLINT NOT NULL,
    CONSTRAINT PK_UsuarioRol PRIMARY KEY (UsuarioID, RolID),
    CONSTRAINT FK_UsuarioRol_Usuario
        FOREIGN KEY (UsuarioID) REFERENCES seguridad.UsuarioWeb(UsuarioID),
    CONSTRAINT FK_UsuarioRol_Rol
        FOREIGN KEY (RolID) REFERENCES seguridad.Rol(RolID)
);
GO

-- ============================================================
-- DOMINIO: AUDITORÍA
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('auditoria.EventoAuditoria'))
CREATE TABLE auditoria.EventoAuditoria (
    EventoID    BIGINT IDENTITY(1,1) NOT NULL,
    UsuarioID   BIGINT               NULL,
    Entidad     VARCHAR(80)          NOT NULL,
    EntidadID   BIGINT               NULL,
    Accion      VARCHAR(40)          NOT NULL,
    FechaEvento DATETIME2(0)         NOT NULL DEFAULT SYSUTCDATETIME(),
    IpOrigen    VARCHAR(45)          NULL,
    Detalle     NVARCHAR(2000)       NULL,
    CONSTRAINT PK_EventoAuditoria PRIMARY KEY (EventoID)
);
GO

-- ============================================================
-- DOMINIO: HISTÓRICO (destino del archivo mensual)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('historico.MarcaHistorico'))
CREATE TABLE historico.MarcaHistorico (
    MarcaID            BIGINT       NOT NULL,
    EmpleadoID         BIGINT       NOT NULL,
    TipoMarcaID        TINYINT      NOT NULL,
    AgenteID           BIGINT       NULL,
    FechaHoraServidor  DATETIME2(0) NOT NULL,
    FechaHoraCliente   DATETIME2(0) NULL,
    IdempotencyKey     UNIQUEIDENTIFIER NOT NULL,
    EstadoMarca        VARCHAR(20)  NOT NULL,
    ObservacionTecnica NVARCHAR(500) NULL,
    FechaArchivado     DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_MarcaHistorico PRIMARY KEY (MarcaID)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('historico.JustificacionHistorico'))
CREATE TABLE historico.JustificacionHistorico (
    JustificacionID      BIGINT        NOT NULL,
    EmpleadoID           BIGINT        NOT NULL,
    MarcaID              BIGINT        NULL,
    MotivoID             SMALLINT      NOT NULL,
    FechaInicio          DATE          NOT NULL,
    FechaFin             DATE          NOT NULL,
    TextoJustificacion   NVARCHAR(1000) NOT NULL,
    EstadoJustificacion  VARCHAR(20)   NOT NULL,
    FechaSolicitud       DATETIME2(0)  NOT NULL,
    AprobadorEmpleadoID  BIGINT        NULL,
    FechaResolucion      DATETIME2(0)  NULL,
    ComentarioResolucion NVARCHAR(1000) NULL,
    FechaArchivado       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_JustificacionHistorico PRIMARY KEY (JustificacionID)
);
GO

-- ============================================================
-- ÍNDICES OPERATIVOS PRINCIPALES
-- ============================================================

-- Marca: Búsqueda por empleado y fecha (el más frecuente)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Marca_Empleado_Fecha' AND object_id = OBJECT_ID('asistencia.Marca'))
    CREATE INDEX IX_Marca_Empleado_Fecha
        ON asistencia.Marca (EmpleadoID, FechaHoraServidor DESC)
        INCLUDE (TipoMarcaID, EstadoMarca);
GO

-- Marca: Búsqueda global por fecha (para reportes de RRHH)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Marca_Fecha' AND object_id = OBJECT_ID('asistencia.Marca'))
    CREATE INDEX IX_Marca_Fecha
        ON asistencia.Marca (FechaHoraServidor DESC);
GO

-- Justificación: por empleado y periodo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Justificacion_Empleado_Fecha' AND object_id = OBJECT_ID('asistencia.Justificacion'))
    CREATE INDEX IX_Justificacion_Empleado_Fecha
        ON asistencia.Justificacion (EmpleadoID, FechaInicio, FechaFin);
GO

-- Justificación: por estado para flujo de aprobación
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Justificacion_Estado' AND object_id = OBJECT_ID('asistencia.Justificacion'))
    CREATE INDEX IX_Justificacion_Estado
        ON asistencia.Justificacion (EstadoJustificacion, FechaSolicitud DESC);
GO

-- Agente: heartbeat y estado
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Agente_Heartbeat' AND object_id = OBJECT_ID('infra.AgenteInstalado'))
    CREATE INDEX IX_Agente_Heartbeat
        ON infra.AgenteInstalado (Estado, UltimoHeartbeat DESC);
GO

PRINT 'Script 01 ejecutado correctamente: Esquemas, Tablas e Índices creados.';
GO

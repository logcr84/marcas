-- ============================================================
-- Script 03: Tipos de Marca para Empleados Públicos CR
-- Ley Marco de Empleo Público (Ley 10159) y Código de Trabajo
-- Sistema de Control de Marcas - RECOPE
-- ============================================================

-- Limpiar tipos anteriores (solo si es ambiente de desarrollo)
-- DELETE FROM asistencia.TipoMarca;

-- Insertar tipos de marca acordes a la jornada del empleado público costarricense
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE Codigo = 'ENTRADA')
INSERT INTO asistencia.TipoMarca (Codigo, Nombre, OrdenDia) VALUES
    -- ── Jornada principal ──────────────────────────────────────
    ('ENTRADA',              'Entrada al trabajo',              1),
    ('SALIDA',               'Salida del trabajo',              8),

    -- ── Café de mañana (~9:30 a.m., 15-20 min) ────────────────
    -- Base legal: Art. 138 Código de Trabajo CR
    ('SALIDA_CAFE_MANANA',   'Salida a café (mañana)',          2),
    ('REGRESO_CAFE_MANANA',  'Regreso de café (mañana)',        3),

    -- ── Almuerzo (~12:00 p.m., máx. 1 hora) ──────────────────
    -- Base legal: Art. 136 Código de Trabajo CR
    ('SALIDA_ALMUERZO',      'Salida a almuerzo',               4),
    ('REGRESO_ALMUERZO',     'Regreso de almuerzo',             5),

    -- ── Café de tarde (~3:00 p.m., 15-20 min) ────────────────
    -- Base legal: Art. 138 Código de Trabajo CR
    ('SALIDA_CAFE_TARDE',    'Salida a café (tarde)',           6),
    ('REGRESO_CAFE_TARDE',   'Regreso de café (tarde)',         7),

    -- ── Salidas especiales (autorizadas) ─────────────────────
    -- Comisión: Art. 33 Ley 10159 / Reglamento interno RECOPE
    ('SALIDA_COMISION',      'Salida en comisión',              9),
    ('REGRESO_COMISION',     'Regreso de comisión',            10),

    -- Cita médica CCSS: Art. 79 Código de Trabajo CR
    ('SALIDA_MEDICA',        'Salida a cita médica (CCSS)',    11),
    ('REGRESO_MEDICA',       'Regreso de cita médica',         12);
GO

PRINT 'Tipos de marca para empleado público CR insertados correctamente.';
GO

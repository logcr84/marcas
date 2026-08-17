-- ============================================================
-- Script: 04_migracion_tipos_marca_cr.pg.sql
-- Sistema de Control de Marcas - PostgreSQL
-- Descripción: Migración idempotente que garantiza los 12 tipos
--              de marca para el empleado público CR, con los IDs
--              exactos que referencia el agente local (1-12).
-- Base legal: Ley Marco de Empleo Público (Ley 10159) y Código
--             de Trabajo de Costa Rica.
-- ============================================================

-- ── 1. Asegurar que la secuencia de TipoMarcaID esté desde 1 ───────────────
-- (Solo necesario si la tabla está vacía o se van a reinsertar con IDs fijos)

DO $$
BEGIN
    -- Eliminar tipos genéricos del seed anterior (si no tienen marcas asociadas)
    DELETE FROM asistencia."TipoMarca" tm
    WHERE tm."Codigo" IN ('SALIDA_DESCANSO', 'ENTRADA_DESCANSO')
      AND NOT EXISTS (
          SELECT 1 FROM asistencia."Marca" m
          WHERE m."TipoMarcaID" = tm."TipoMarcaID"
      );
END;
$$;

-- ── 2. Insertar/actualizar los 12 tipos oficiales con IDs controlados ───────
--
-- MAPA ID → Código (debe coincidir EXACTAMENTE con FormMarcas.cs del agente):
--
--  ID │ Código                │ Orden │ Descripción legal
--  ───┼───────────────────────┼───────┼──────────────────────────────────────
--   1 │ ENTRADA               │   1   │ Inicio jornada (Art. 136 CT)
--   2 │ SALIDA_CAFE_MANANA    │   2   │ Descanso mañana ~15-20 min (Art. 138 CT)
--   3 │ REGRESO_CAFE_MANANA   │   3   │ Regreso descanso mañana
--   4 │ SALIDA_ALMUERZO       │   4   │ Tiempo de comida máx. 1 h (Art. 136 CT)
--   5 │ REGRESO_ALMUERZO      │   5   │ Regreso tiempo de comida
--   6 │ SALIDA_CAFE_TARDE     │   6   │ Descanso tarde ~15-20 min (Art. 138 CT)
--   7 │ REGRESO_CAFE_TARDE    │   7   │ Regreso descanso tarde
--   8 │ SALIDA                │   8   │ Fin de jornada
--   9 │ SALIDA_COMISION       │   9   │ Comisión institucional (Art. 33 Ley 10159)
--  10 │ REGRESO_COMISION      │  10   │ Regreso de comisión
--  11 │ SALIDA_MEDICA         │  11   │ Cita médica CCSS (Art. 79 CT)
--  12 │ REGRESO_MEDICA        │  12   │ Regreso de cita médica

-- Forzar IDs específicos usando OVERRIDING SYSTEM VALUE
INSERT INTO asistencia."TipoMarca" ("TipoMarcaID", "Codigo", "Nombre", "OrdenDia")
OVERRIDING SYSTEM VALUE
VALUES
    -- Jornada principal
    (1,  'ENTRADA',              'Entrada al trabajo',              1),
    -- Café mañana (Art. 138 CT)
    (2,  'SALIDA_CAFE_MANANA',   'Salida a café (mañana)',          2),
    (3,  'REGRESO_CAFE_MANANA',  'Regreso de café (mañana)',        3),
    -- Almuerzo (Art. 136 CT)
    (4,  'SALIDA_ALMUERZO',      'Salida a almuerzo',               4),
    (5,  'REGRESO_ALMUERZO',     'Regreso de almuerzo',             5),
    -- Café tarde (Art. 138 CT)
    (6,  'SALIDA_CAFE_TARDE',    'Salida a café (tarde)',           6),
    (7,  'REGRESO_CAFE_TARDE',   'Regreso de café (tarde)',         7),
    -- Fin de jornada
    (8,  'SALIDA',               'Salida del trabajo',              8),
    -- Comisión (Art. 33 Ley 10159)
    (9,  'SALIDA_COMISION',      'Salida en comisión',              9),
    (10, 'REGRESO_COMISION',     'Regreso de comisión',            10),
    -- Médico CCSS (Art. 79 CT)
    (11, 'SALIDA_MEDICA',        'Salida a cita médica (CCSS)',    11),
    (12, 'REGRESO_MEDICA',       'Regreso de cita médica',         12)
ON CONFLICT ("Codigo") DO UPDATE
    SET "Nombre"   = EXCLUDED."Nombre",
        "OrdenDia" = EXCLUDED."OrdenDia",
        "Estado"   = 'ACTIVO';

-- ── 3. Sincronizar la secuencia al máximo ID insertado ────────────────────
SELECT setval(
    pg_get_serial_sequence('asistencia."TipoMarca"', 'TipoMarcaID'),
    (SELECT MAX("TipoMarcaID") FROM asistencia."TipoMarca"),
    true
);

-- ── 4. Verificación ────────────────────────────────────────────────────────
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM asistencia."TipoMarca" WHERE "Estado" = 'ACTIVO';
    IF v_count = 12 THEN
        RAISE NOTICE '✅ Migración exitosa: 12 tipos de marca activos en la BD.';
    ELSE
        RAISE NOTICE '⚠️  Se encontraron % tipos activos (se esperaban 12). Revisar.', v_count;
    END IF;
END;
$$;

-- Mostrar resultado final
SELECT "TipoMarcaID", "Codigo", "Nombre", "OrdenDia", "Estado"
FROM asistencia."TipoMarca"
ORDER BY "OrdenDia";

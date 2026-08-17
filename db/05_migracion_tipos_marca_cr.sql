-- ============================================================
-- Script 05: Migración de Tipos de Marca - Empleado Público CR
-- Sistema de Control de Marcas
-- Autor: Migración automática
-- Descripción: Elimina los tipos genéricos del seed original
--              e inserta los 12 tipos oficiales CR si no existen.
--              Idempotente: se puede ejecutar múltiples veces.
-- ============================================================

-- ── Desactivar restricciones FK temporalmente ──────────────────────────────
-- NOTA: Solo ejecutar en ambiente de desarrollo/staging con datos de prueba.
-- En producción, primero migrar las marcas existentes antes de borrar tipos.

-- ── 1. Limpiar tipos de marca genéricos (del seed original Script 02) ──────
--    Solo se eliminan si NO tienen marcas asociadas (seguro en BD vacía)
DELETE FROM asistencia.TipoMarca
WHERE Codigo IN ('SALIDA_DESCANSO', 'ENTRADA_DESCANSO')
  AND NOT EXISTS (
      SELECT 1 FROM asistencia.Marca m WHERE m.TipoMarcaID = asistencia.TipoMarca.TipoMarcaID
  );
GO

-- ── 2. Insertar los 12 tipos oficiales del empleado público CR ──────────────
--    Usa SET IDENTITY_INSERT para controlar los IDs exactos que espera el agente.
--    El agente local referencia los tipos por ID fijo (1-12).

SET IDENTITY_INSERT asistencia.TipoMarca ON;
GO

-- Jornada principal
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 1)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (1, 'ENTRADA', 'Entrada al trabajo', 1);

IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 8)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (8, 'SALIDA', 'Salida del trabajo', 8);

-- Café mañana (Art. 138 Código de Trabajo CR)
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 2)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (2, 'SALIDA_CAFE_MANANA', 'Salida a café (mañana)', 2);

IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 3)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (3, 'REGRESO_CAFE_MANANA', 'Regreso de café (mañana)', 3);

-- Almuerzo (Art. 136 Código de Trabajo CR)
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 4)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (4, 'SALIDA_ALMUERZO', 'Salida a almuerzo', 4);

IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 5)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (5, 'REGRESO_ALMUERZO', 'Regreso de almuerzo', 5);

-- Café tarde (Art. 138 Código de Trabajo CR)
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 6)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (6, 'SALIDA_CAFE_TARDE', 'Salida a café (tarde)', 6);

IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 7)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (7, 'REGRESO_CAFE_TARDE', 'Regreso de café (tarde)', 7);

-- Comisión (Art. 33 Ley 10159 Marco Empleo Público)
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 9)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (9, 'SALIDA_COMISION', 'Salida en comisión', 9);

IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 10)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (10, 'REGRESO_COMISION', 'Regreso de comisión', 10);

-- Médico CCSS (Art. 79 Código de Trabajo CR)
IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 11)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (11, 'SALIDA_MEDICA', 'Salida a cita médica (CCSS)', 11);

IF NOT EXISTS (SELECT 1 FROM asistencia.TipoMarca WHERE TipoMarcaID = 12)
    INSERT INTO asistencia.TipoMarca (TipoMarcaID, Codigo, Nombre, OrdenDia)
    VALUES (12, 'REGRESO_MEDICA', 'Regreso de cita médica', 12);
GO

SET IDENTITY_INSERT asistencia.TipoMarca OFF;
GO

-- ── 3. Verificar resultado ─────────────────────────────────────────────────
SELECT TipoMarcaID, Codigo, Nombre, OrdenDia, Estado
FROM asistencia.TipoMarca
ORDER BY OrdenDia;
GO

PRINT '✅ Script 05 ejecutado: 12 tipos de marca CR sincronizados correctamente.';
GO

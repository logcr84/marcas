-- ============================================================
-- Script de Datos de Prueba (Dummy Data) para Visualización UI
-- ============================================================

DO $$
DECLARE 
    dep_id_sistemas INT;
    dep_id_ventas INT;
    puesto_admin INT;
    puesto_vendedor INT;
    emp_juan_id BIGINT;
    emp_maria_id BIGINT;
    emp_carlos_id BIGINT;
BEGIN
    -- 1. Asegurar Departamentos base
    INSERT INTO rrhh."Departamento" ("Nombre", "Estado") 
    VALUES ('Sistemas', 'ACTIVO') ON CONFLICT ("Nombre") DO NOTHING;
    
    INSERT INTO rrhh."Departamento" ("Nombre", "Estado") 
    VALUES ('Ventas', 'ACTIVO') ON CONFLICT ("Nombre") DO NOTHING;

    SELECT "DepartamentoID" INTO dep_id_sistemas FROM rrhh."Departamento" WHERE "Nombre" = 'Sistemas' LIMIT 1;
    SELECT "DepartamentoID" INTO dep_id_ventas FROM rrhh."Departamento" WHERE "Nombre" = 'Ventas' LIMIT 1;

    -- 2. Asegurar Puestos base
    INSERT INTO rrhh."Puesto" ("Nombre", "Estado") 
    VALUES ('Administrador TI', 'ACTIVO') ON CONFLICT ("Nombre") DO NOTHING;
    
    INSERT INTO rrhh."Puesto" ("Nombre", "Estado") 
    VALUES ('Vendedor Senior', 'ACTIVO') ON CONFLICT ("Nombre") DO NOTHING;

    SELECT "PuestoID" INTO puesto_admin FROM rrhh."Puesto" WHERE "Nombre" = 'Administrador TI' LIMIT 1;
    SELECT "PuestoID" INTO puesto_vendedor FROM rrhh."Puesto" WHERE "Nombre" = 'Vendedor Senior' LIMIT 1;

    -- 3. Empleados de prueba
    INSERT INTO rrhh."Empleado" ("CodigoEmpleado", "Identificacion", "Nombre", "PrimerApellido", "SegundoApellido", "DepartamentoID", "PuestoID", "FechaIngreso")
    VALUES ('EMP-002', '101110111', 'Juan', 'Pérez', 'Soto', dep_id_sistemas, puesto_admin, '2022-01-15')
    ON CONFLICT ("CodigoEmpleado") DO NOTHING;

    INSERT INTO rrhh."Empleado" ("CodigoEmpleado", "Identificacion", "Nombre", "PrimerApellido", "SegundoApellido", "DepartamentoID", "PuestoID", "FechaIngreso")
    VALUES ('EMP-003', '202220222', 'María', 'Gómez', 'Vargas', dep_id_ventas, puesto_vendedor, '2023-05-10')
    ON CONFLICT ("CodigoEmpleado") DO NOTHING;

    INSERT INTO rrhh."Empleado" ("CodigoEmpleado", "Identificacion", "Nombre", "PrimerApellido", "SegundoApellido", "DepartamentoID", "PuestoID", "FechaIngreso")
    VALUES ('EMP-004', '303330333', 'Carlos', 'López', 'Mena', dep_id_ventas, puesto_vendedor, '2021-11-20')
    ON CONFLICT ("CodigoEmpleado") DO NOTHING;

    SELECT "EmpleadoID" INTO emp_juan_id FROM rrhh."Empleado" WHERE "CodigoEmpleado" = 'EMP-002' LIMIT 1;
    SELECT "EmpleadoID" INTO emp_maria_id FROM rrhh."Empleado" WHERE "CodigoEmpleado" = 'EMP-003' LIMIT 1;
    SELECT "EmpleadoID" INTO emp_carlos_id FROM rrhh."Empleado" WHERE "CodigoEmpleado" = 'EMP-004' LIMIT 1;

    -- 4. Marcas de Asistencia
    IF NOT EXISTS (SELECT 1 FROM asistencia."Marca" WHERE "EmpleadoID" = emp_juan_id) THEN
        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_juan_id, 1, NOW() - INTERVAL '2 days 8 hours', gen_random_uuid(), 'VALIDA');
        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_juan_id, 4, NOW() - INTERVAL '2 days 1 hour', gen_random_uuid(), 'VALIDA');
        
        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_juan_id, 1, NOW() - INTERVAL '1 days 7 hours 45 minutes', gen_random_uuid(), 'VALIDA');
        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_juan_id, 4, NOW() - INTERVAL '1 days 0 hours', gen_random_uuid(), 'VALIDA');

        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_juan_id, 1, NOW() - INTERVAL '10 minutes', gen_random_uuid(), 'VALIDA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM asistencia."Marca" WHERE "EmpleadoID" = emp_maria_id) THEN
        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_maria_id, 1, NOW() - INTERVAL '2 days 8 hours 30 minutes', gen_random_uuid(), 'VALIDA');
        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_maria_id, 4, NOW() - INTERVAL '2 days 2 hours', gen_random_uuid(), 'VALIDA');

        INSERT INTO asistencia."Marca" ("EmpleadoID", "TipoMarcaID", "FechaHoraServidor", "IdempotencyKey", "EstadoMarca")
        VALUES (emp_maria_id, 1, NOW() - INTERVAL '15 minutes', gen_random_uuid(), 'VALIDA');
    END IF;

    -- 5. Justificaciones de Prueba
    IF NOT EXISTS (SELECT 1 FROM asistencia."Justificacion" WHERE "EmpleadoID" = emp_maria_id) THEN
        INSERT INTO asistencia."Justificacion" ("EmpleadoID", "MotivoID", "FechaInicio", "FechaFin", "TextoJustificacion", "EstadoJustificacion")
        VALUES (emp_maria_id, 1, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day', 'Cita médica CCSS programada', 'APROBADA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM asistencia."Justificacion" WHERE "EmpleadoID" = emp_carlos_id) THEN
        INSERT INTO asistencia."Justificacion" ("EmpleadoID", "MotivoID", "FechaInicio", "FechaFin", "TextoJustificacion", "EstadoJustificacion")
        VALUES (emp_carlos_id, 8, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'Vacaciones anuales correspondientes al periodo 2025', 'PENDIENTE');
    END IF;

    RAISE NOTICE 'Datos de prueba insertados con éxito.';
END $$;

-- ============================================================
-- Usuario de prueba: Héctor (Rol Normal)
-- ============================================================
INSERT INTO rrhh."Empleado" ("CodigoEmpleado", "Identificacion", "Nombre", "PrimerApellido", "SegundoApellido", "DepartamentoID", "PuestoID", "FechaIngreso")
SELECT 'EMP-005', '505550555', 'Héctor', 'Prueba', 'Normal', "DepartamentoID", "PuestoID", '2024-01-01'
FROM rrhh."Departamento", rrhh."Puesto"
WHERE rrhh."Departamento"."Nombre" = 'Sistemas' AND rrhh."Puesto"."Nombre" = 'Administrador TI'
LIMIT 1
ON CONFLICT ("CodigoEmpleado") DO NOTHING;

INSERT INTO seguridad."UsuarioWeb" ("EmpleadoID", "Login", "HashPassword", "Estado")
SELECT e."EmpleadoID",
       'hector@marcas.local',
       '$2b$12$LxRbMGjndPMln2zbfan05OVaV./NqqNgIF7sNy7508Vc9sV2msQjy', -- Admin@2026!
       'ACTIVO'
FROM rrhh."Empleado" e WHERE e."CodigoEmpleado" = 'EMP-005'
ON CONFLICT ("Login") DO UPDATE 
SET "HashPassword" = '$2b$12$LxRbMGjndPMln2zbfan05OVaV./NqqNgIF7sNy7508Vc9sV2msQjy';

INSERT INTO seguridad."UsuarioRol" ("UsuarioID", "RolID")
SELECT uw."UsuarioID", r."RolID"
FROM seguridad."UsuarioWeb" uw, seguridad."Rol" r
WHERE uw."Login" = 'hector@marcas.local' AND r."Nombre" = 'EMPLEADO_CONSULTA'
ON CONFLICT ("UsuarioID", "RolID") DO NOTHING;

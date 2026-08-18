DO $$ 
DECLARE
    v_empleado_id BIGINT;
BEGIN
    FOR v_empleado_id IN (SELECT "EmpleadoID" FROM rrhh."Empleado" WHERE "Nombre" ILIKE '%hector%' OR "Nombre" ILIKE '%héctor%')
    LOOP
        -- 1. Borrar justificaciones (tienen llave foránea hacia Marca)
        DELETE FROM asistencia."Justificacion" 
        WHERE "MarcaID" IN (SELECT "MarcaID" FROM asistencia."Marca" WHERE "EmpleadoID" = v_empleado_id);

        -- 2. Borrar marcas
        DELETE FROM asistencia."Marca" WHERE "EmpleadoID" = v_empleado_id;
        
        -- 3. Borrar roles del usuario web
        DELETE FROM seguridad."UsuarioRol" 
        WHERE "UsuarioID" IN (SELECT "UsuarioID" FROM seguridad."UsuarioWeb" WHERE "EmpleadoID" = v_empleado_id);
        
        -- 4. Borrar el usuario web
        DELETE FROM seguridad."UsuarioWeb" WHERE "EmpleadoID" = v_empleado_id;
        
        -- 5. Borrar al empleado
        DELETE FROM rrhh."Empleado" WHERE "EmpleadoID" = v_empleado_id;
    END LOOP;
END $$;

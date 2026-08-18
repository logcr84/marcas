CREATE OR REPLACE FUNCTION asistencia.fn_reportegeneralmarcas(p_fechainicio date, p_fechafin date, p_departamentoid integer DEFAULT NULL::integer, p_estadomarca character varying DEFAULT NULL::character varying)
 RETURNS TABLE("MarcaID" bigint, "CodigoEmpleado" character varying, "NombreEmpleado" text, "Departamento" character varying, "Puesto" character varying, "FechaHoraServidor" timestamp with time zone, "TipoMarca" character varying, "NombreTipoMarca" character varying, "EstadoMarca" character varying, "EstadoJustificacion" character varying)
 LANGUAGE plpgsql
AS $function$
 BEGIN
     RETURN QUERY
     SELECT
         m."MarcaID",
         e."CodigoEmpleado",
         (e."Nombre" || ' ' || e."PrimerApellido" || ' ' || COALESCE(e."SegundoApellido", ''))::TEXT AS "NombreEmpleado",
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
     WHERE m."FechaHoraServidor" AT TIME ZONE 'America/Costa_Rica' >= p_FechaInicio::TIMESTAMP
       AND m."FechaHoraServidor" AT TIME ZONE 'America/Costa_Rica' <  (p_FechaFin + INTERVAL '1 day')::TIMESTAMP
       AND (p_DepartamentoID IS NULL OR e."DepartamentoID" = p_DepartamentoID)
       AND (p_EstadoMarca IS NULL OR m."EstadoMarca" = p_EstadoMarca)
     ORDER BY m."FechaHoraServidor" DESC, e."PrimerApellido";
 END;
 $function$;

CREATE OR REPLACE FUNCTION asistencia.fn_reportemarcasempleado(p_empleadoid bigint, p_fechainicio date, p_fechafin date)
 RETURNS TABLE("MarcaID" bigint, "FechaHoraServidor" timestamp with time zone, "TipoMarca" character varying, "NombreTipoMarca" character varying, "EstadoMarca" character varying, "EstadoJustificacion" character varying, "TextoJustificacion" text, "MotivoJustificacion" character varying)
 LANGUAGE plpgsql
AS $function$
 BEGIN
     RETURN QUERY
     SELECT
         m."MarcaID",
         m."FechaHoraServidor",
         tm."Codigo"   AS "TipoMarca",
         tm."Nombre"   AS "NombreTipoMarca",
         m."EstadoMarca",
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
       AND m."FechaHoraServidor" AT TIME ZONE 'America/Costa_Rica' >= p_FechaInicio::TIMESTAMP
       AND m."FechaHoraServidor" AT TIME ZONE 'America/Costa_Rica' <  (p_FechaFin + INTERVAL '1 day')::TIMESTAMP
     ORDER BY m."FechaHoraServidor" DESC;
 END;
 $function$;

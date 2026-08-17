#!/bin/bash
set -e

# Inicializar la base de datos si existe la cadena de conexión
if [ -n "$ConnectionStrings__DefaultConnection" ]; then
    echo "========================================="
    echo "Inicializando base de datos PostgreSQL..."
    echo "========================================="
    psql "$ConnectionStrings__DefaultConnection" -f /app/db/postgres/01_schemas_y_tablas.pg.sql
    psql "$ConnectionStrings__DefaultConnection" -f /app/db/postgres/02_procedures_y_seed.pg.sql
    psql "$ConnectionStrings__DefaultConnection" -f /app/db/postgres/03_dummy_data.pg.sql
    echo "Inicialización completada."
else
    echo "Advertencia: Variable ConnectionStrings__DefaultConnection no definida."
fi

echo "Iniciando la aplicación API..."
exec dotnet Marcas.API.dll

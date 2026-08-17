# ============================================================
# Dockerfile multi-stage — Sistema de Control de Marcas
# Etapa 1: Build del frontend (React + Vite)
# Etapa 2: Build del backend (.NET 10)
# Etapa 3: Imagen de producción (sólo el runtime)
# ============================================================

# ──────────────────────────────────────────────────────────────
# Etapa 1: Compilar el Frontend (Node)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copiar archivos de dependencias primero (cache Docker)
COPY frontend/package*.json ./
RUN npm ci

# Copiar el resto del frontend y compilar
# VITE_API_URL vacío = rutas relativas (la API corre en el mismo origen)
COPY frontend/ ./
RUN VITE_API_URL=/api npm run build


# ──────────────────────────────────────────────────────────────
# Etapa 2: Compilar el Backend (.NET 10 SDK)
# ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build

WORKDIR /app/backend

# Restaurar dependencias (aprovecha caché de Docker)
COPY backend/Marcas.sln ./
COPY backend/Marcas.Core/Marcas.Core.csproj             ./Marcas.Core/
COPY backend/Marcas.Infrastructure/Marcas.Infrastructure.csproj ./Marcas.Infrastructure/
COPY backend/Marcas.API/Marcas.API.csproj               ./Marcas.API/
RUN dotnet restore Marcas.sln

# Copiar el código fuente y publicar en Release
COPY backend/ ./
RUN dotnet publish Marcas.API/Marcas.API.csproj \
    -c Release \
    -o /publish \
    --no-restore

# Copiar el frontend compilado al directorio wwwroot del backend
COPY --from=frontend-build /app/frontend/dist /publish/wwwroot/


# ──────────────────────────────────────────────────────────────
# Etapa 3: Imagen final de producción (sólo el runtime ASP.NET)
# ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

# Crear usuario no-root por seguridad
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

COPY --from=backend-build /publish ./

# Render inyecta PORT; el entrypoint lo lee desde Program.cs
EXPOSE 8080

ENTRYPOINT ["dotnet", "Marcas.API.dll"]

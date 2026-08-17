import os
import shutil
import subprocess

# Rutas y configuración
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist_agentes')
PUBLISH_BASE_DIR = os.path.join(BASE_DIR, 'bin', 'Release', 'net10.0-windows', 'win-x64', 'publish')

def main():
    print("🚀 Iniciando empaquetado de Agente Universal para Windows...")

    # 1. Compilar el proyecto para Windows (Single File)
    print("\n📦 Compilando la aplicación base (win-x64)...")
    build_cmd = [
        "dotnet", "publish", "-c", "Release", "-r", "win-x64", 
        "--self-contained", "true", "-p:PublishSingleFile=true"
    ]
    subprocess.run(build_cmd, cwd=BASE_DIR, check=True)

    # Limpiar o crear carpeta de distribución
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
    os.makedirs(DIST_DIR)

    # 2. Empaquetar Agente Universal
    print("\n👥 Generando empaquetado universal...")
    
    # Crear carpeta para el instalador
    folder_name = "Agente_Instalador_Universal"
    emp_dir = os.path.join(DIST_DIR, folder_name)
    os.makedirs(emp_dir)
    
    # Copiar el ejecutable base (Marcas.Agent.Worker.exe) a la carpeta
    exe_name = "Marcas.Agent.Worker.exe"
    shutil.copy2(os.path.join(PUBLISH_BASE_DIR, exe_name), os.path.join(emp_dir, exe_name))
    
    # Copiar el appsettings.json base a la carpeta
    shutil.copy2(os.path.join(BASE_DIR, 'appsettings.json'), os.path.join(emp_dir, 'appsettings.json'))
    
    # Comprimir en un archivo ZIP listo para enviar
    shutil.make_archive(emp_dir, 'zip', emp_dir)
    print(f"     ✅ Creado: {folder_name}.zip")

    print(f"\n🎉 ¡Proceso completado! El instalador universal (ZIP) está listo en:")
    print(f"📁 {DIST_DIR}")

if __name__ == "__main__":
    main()

import os
import csv
import json
import shutil
import subprocess

# Rutas y configuración
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, 'empleados.csv')
DIST_DIR = os.path.join(BASE_DIR, 'dist_agentes')
TEMPLATE_APPSETTINGS = os.path.join(BASE_DIR, 'appsettings.json')
PUBLISH_BASE_DIR = os.path.join(BASE_DIR, 'bin', 'Release', 'net10.0', 'win-x64', 'publish')

def main():
    print("🚀 Iniciando empaquetado de Agentes para Windows...")

    # 1. Compilar el proyecto para Windows (Single File)
    print("\n📦 Compilando la aplicación base (win-x64)...")
    build_cmd = [
        "dotnet", "publish", "-c", "Release", "-r", "win-x64", 
        "--self-contained", "true", "-p:PublishSingleFile=true"
    ]
    subprocess.run(build_cmd, cwd=BASE_DIR, check=True)

    # 2. Leer configuración base de appsettings.json
    with open(TEMPLATE_APPSETTINGS, 'r', encoding='utf-8') as f:
        base_config = json.load(f)

    # Limpiar o crear carpeta de distribución
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
    os.makedirs(DIST_DIR)

    # 3. Leer CSV y generar carpetas por empleado
    print("\n👥 Generando empaquetados por empleado...")
    with open(CSV_FILE, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            emp_id = int(row['EmpleadoID'].strip())
            nombre = row['Nombre'].strip().replace(" ", "_")
            token = row['AuthToken'].strip()
            
            print(f"  -> Preparando agente para: {nombre} (ID: {emp_id})")
            
            # Crear carpeta específica para el empleado
            folder_name = f"Agente_{nombre}_{emp_id}"
            emp_dir = os.path.join(DIST_DIR, folder_name)
            os.makedirs(emp_dir)
            
            # Copiar el ejecutable base (Marcas.Agent.Worker.exe) a la carpeta
            exe_name = "Marcas.Agent.Worker.exe"
            shutil.copy2(os.path.join(PUBLISH_BASE_DIR, exe_name), os.path.join(emp_dir, exe_name))
            
            # Modificar la configuración específica
            emp_config = base_config.copy()
            emp_config['AgentConfig']['EmpleadoID'] = emp_id
            emp_config['AgentConfig']['AuthToken'] = token
            
            # Guardar el appsettings.json modificado en la carpeta del empleado
            emp_settings_path = os.path.join(emp_dir, 'appsettings.json')
            with open(emp_settings_path, 'w', encoding='utf-8') as f:
                json.dump(emp_config, f, indent=2)
            
            # Comprimir en un archivo ZIP listo para enviar
            shutil.make_archive(emp_dir, 'zip', emp_dir)
            print(f"     ✅ Creado: {folder_name}.zip")

    print(f"\n🎉 ¡Proceso completado! Los instaladores (ZIPs) están listos en:")
    print(f"📁 {DIST_DIR}")

if __name__ == "__main__":
    main()

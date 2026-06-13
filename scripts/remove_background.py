#!/usr/bin/env python3
"""
Recuerdos de Cobre — Removedor de Fondos Local (Pro)
Remueve el fondo de imágenes en alta resolución usando modelos avanzados de IA local.

Instalación:
    pip install rembg pillow

Modelos recomendados:
    - isnet-general-use (Por defecto, ultra-preciso en retratos/fotos)
    - isnet-anime (Ideal para ilustraciones 2D, dibujos o arte digital)
    - u2net_human (Optimizado para retratos de personas reales)

Uso:
    # Procesar con el modelo por defecto (isnet-general-use):
    python scripts/remove_background.py "ruta/a/la/carpeta"

    # Procesar usando el modelo para ilustraciones/dibujos:
    python scripts/remove_background.py "ruta/a/la/carpeta" --model isnet-anime

    # Procesar usando el modelo para retratos humanos:
    python scripts/remove_background.py "ruta/a/la/carpeta" --model u2net_human
"""

import os
import sys
from PIL import Image

def process_image(input_path, output_path, session):
    try:
        from rembg import remove
    except ImportError:
        print("\n[!] Error: No se encuentra la librería 'rembg'.")
        print("    Ejecutá: pip install rembg pillow\n")
        sys.exit(1)

    print(f"⌛ Procesando: {os.path.basename(input_path)}...", end="", flush=True)
    try:
        input_image = Image.open(input_path)
        width, height = input_image.size
        
        # Procesar usando la sesión del modelo específico
        output_image = remove(input_image, session=session)
        
        output_image.save(output_path, "PNG")
        print(f"\r✓ Procesado: {os.path.basename(input_path)} ({width}x{height}px) -> {os.path.basename(output_path)}")
    except Exception as e:
        print(f"\r❌ Error al procesar {os.path.basename(input_path)}: {e}")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    # Buscar argumento --model
    model_name = "isnet-general-use"
    if "--model" in sys.argv:
        try:
            idx = sys.argv.index("--model")
            raw_model = sys.argv[idx + 1].lower()
            
            # Mapeos inteligentes para evitar errores por typos o nombres largos
            if raw_model in ["isnet-anime", "isnet-ani", "anime", "ani"]:
                model_name = "isnet-anime"
            elif raw_model in ["isnet-general-use", "isnet-general", "general", "isnet"]:
                model_name = "isnet-general-use"
            elif raw_model in ["u2net_human", "u2net-human", "human"]:
                model_name = "u2net_human"
            elif raw_model in ["u2net", "default"]:
                model_name = "u2net"
            else:
                model_name = sys.argv[idx + 1]  # Dejar pasar el nombre literal si es personalizado
                
            # Limpiar de la lista de argumentos para que no moleste a la ruta
            sys.argv.pop(idx)
            sys.argv.pop(idx)
        except IndexError:
            print("[!] Error: Debes especificar el nombre del modelo después de --model")
            sys.exit(1)

    target = sys.argv[1]

    if not os.path.exists(target):
        print(f"[!] Error: La ruta '{target}' no existe.")
        sys.exit(1)

    # Inicializar sesión de rembg con el modelo seleccionado
    try:
        from rembg import new_session
        print(f"🧠 Cargando modelo de IA: '{model_name}'...")
        session = new_session(model_name)
    except Exception as e:
        print(f"[!] Error al cargar el modelo '{model_name}': {e}")
        print("Modelos válidos: isnet-general-use, isnet-anime, u2net_human, u2net")
        sys.exit(1)

    # Si es un archivo individual
    if os.path.isfile(target):
        ext = os.path.splitext(target)[1].lower()
        if ext not in ['.png', '.jpg', '.jpeg', '.webp']:
            print("[!] Error: El formato de archivo no está soportado.")
            sys.exit(1)
            
        dir_name = os.path.dirname(target)
        base_name = os.path.splitext(os.path.basename(target))[0]
        output_path = os.path.join(dir_name, f"{base_name}_nobg.png")
        
        process_image(target, output_path, session)

    # Si es una carpeta
    elif os.path.isdir(target):
        valid_extensions = ('.png', '.jpg', '.jpeg', '.webp')
        files = [f for f in os.listdir(target) if f.lower().endswith(valid_extensions) and not f.endswith('_nobg.png')]
        
        if not files:
            print(f"No se encontraron imágenes válidas en la carpeta '{target}'.")
            return

        print(f"Se encontraron {len(files)} imágenes para procesar en '{target}'.")
        
        output_dir = os.path.join(target, "sin_fondo")
        os.makedirs(output_dir, exist_ok=True)
        
        for file in files:
            input_path = os.path.join(target, file)
            base_name = os.path.splitext(file)[0]
            output_path = os.path.join(output_dir, f"{base_name}.png")
            process_image(input_path, output_path, session)
            
        print(f"\n🎉 ¡Proceso completado! Las imágenes procesadas están en: {output_dir}")

if __name__ == "__main__":
    main()

import pandas as pd
from img2table.document import Image
from img2table.ocr import PaddleOCR

# 1. Configurar el motor OCR en español
ocr = PaddleOCR(lang="es")

# 2. Cargar la imagen de tu horario (cambia el nombre por el de tu archivo)
ruta_imagen = "tu_imagen_con_10_columnas.jpg"
doc = Image(src=ruta_imagen)

print("Procesando la imagen...")
# 3. Extraer la tabla
tablas_extraidas = doc.extract_tables(ocr=ocr, implicit_rows=False, borderless=False)

if tablas_extraidas:
    df = tablas_extraidas[0].df
    
    # --- LIMPIEZA BÁSICA ---
    # Quitar saltos de línea internos en las celdas
    df = df.replace(r'\n', ' ', regex=True)
    # Quitar filas o columnas totalmente vacías
    df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
    
    # --- ASIGNACIÓN DE TUS CAMPOS ---
    campos_solicitados = ["Grupo", "Asignatura", "Profesor", "Edificio", "Salon", "Lun", "Mar", "Mie", "Jue", "Vie"]
    
    # Si la primera fila detectada por el OCR contiene los encabezados viejos (ej. dice "Materia"), la eliminamos
    if df.iloc[0].astype(str).str.contains('Grupo|Asignatura|Profesor|Lunes', case=False, na=False).any():
        df = df.iloc[1:].reset_index(drop=True)
    
    # Validamos que el OCR haya detectado exactamente 10 columnas en la foto
    if len(df.columns) == len(campos_solicitados):
        df.columns = campos_solicitados
        print("✅ Columnas asignadas correctamente.")
    else:
        print(f"⚠️ Advertencia: Detecté {len(df.columns)} columnas en la imagen, pero tus campos son {len(campos_solicitados)}.")
        print("Se guardarán los datos tal como se detectaron para evitar pérdida de información.")
    
    # 4. Guardar en CSV
    nombre_salida = "horario_campos_personalizados.csv"
    
    # Aquí index=False evita que se guarde el número de fila, y header=True imprime tus nuevos campos
    df.to_csv(nombre_salida, index=False, header=True, encoding='utf-8-sig')
    print(f"✅ ¡Extracción completada! Archivo guardado como: {nombre_salida}")

else:
    print("❌ No se detectaron tablas en la imagen. Revisa la claridad y las líneas divisorias.")
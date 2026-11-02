# Runner: aplica extracor.py (script del usuario, misma logica y parametros)
# a todas las imagenes de Nueva carpeta/M y /V. Un CSV por imagen.
import os
import sys
import pandas as pd
from img2table.document import Image
from img2table.ocr import PaddleOCR

BASE = os.path.dirname(os.path.abspath(__file__))

# 1. Configurar el motor OCR en espanol (igual que extracor.py)
ocr = PaddleOCR(lang="es")

campos_solicitados = ["Grupo", "Asignatura", "Profesor", "Edificio", "Salon",
                      "Lun", "Mar", "Mie", "Jue", "Vie"]
# Las imagenes 27/1 traen columna extra Sab
campos_con_sab = campos_solicitados + ["Sab"]

os.makedirs(os.path.join(BASE, "csv"), exist_ok=True)

for turno in ["M", "V"]:
    carpeta = os.path.join(BASE, turno)
    if not os.path.isdir(carpeta):
        continue
    for fn in sorted(os.listdir(carpeta)):
        if not fn.lower().endswith(".png"):
            continue
        ruta_imagen = os.path.join(carpeta, fn)
        print(f"Procesando {turno}/{fn} ...", flush=True)
        doc = Image(src=ruta_imagen)

        # 3. Extraer la tabla. Las PNG 27/1 son tablas web SIN bordes marcados,
        # por eso borderless_tables=True (las JPG viejas usaban False).
        tablas_extraidas = doc.extract_tables(ocr=ocr, implicit_rows=False, borderless_tables=True)

        if not tablas_extraidas:
            print(f"  X No se detectaron tablas en {fn}", flush=True)
            continue

        df = tablas_extraidas[0].df
        # --- LIMPIEZA BASICA (igual que extracor.py) ---
        df = df.replace(r'\n', ' ', regex=True)
        df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)

        # quitar fila de encabezados detectada por el OCR
        if df.iloc[0].astype(str).str.contains('Grupo|Asignatura|Profesor|Lun', case=False, na=False).any():
            df = df.iloc[1:].reset_index(drop=True)

        if len(df.columns) == len(campos_con_sab):
            df.columns = campos_con_sab
            print(f"  OK 11 columnas (con Sab)", flush=True)
        elif len(df.columns) == len(campos_solicitados):
            df.columns = campos_solicitados
            print(f"  OK 10 columnas", flush=True)
        else:
            print(f"  ! Detecte {len(df.columns)} columnas; guardo tal cual", flush=True)

        nombre_salida = os.path.join(BASE, "csv", f"{turno}_{os.path.splitext(fn)[0]}.csv")
        df.to_csv(nombre_salida, index=False, header=True, encoding='utf-8-sig')
        print(f"  -> {nombre_salida}  ({len(df)} filas)", flush=True)

print("LISTO", flush=True)

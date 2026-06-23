import pandas as pd
from img2table.document import Image
from img2table.ocr import TesseractOCR
import os

os.environ["TESSERACT_PATH"] = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

ocr = TesseractOCR(lang="spa")

campos = ["Grupo", "Asignatura", "Profesor", "Edificio", "Salon", "Lun", "Mar", "Mie", "Jue", "Vie"]

imagenes = sorted([f for f in os.listdir(".") if f.lower().endswith(".jpg")])

dfs = []

for ruta in imagenes:
    print(f"Procesando {ruta}...")
    doc = Image(src=ruta)
    tablas = doc.extract_tables(ocr=ocr, implicit_rows=False)

    if not tablas:
        print(f"  Sin tablas detectadas en {ruta}, omitiendo.")
        continue

    df = tablas[0].df
    df = df.replace(r'\n', ' ', regex=True)
    df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
    df = df.fillna("").astype(str)

    if df.iloc[0].astype(str).str.contains('Grupo|Asignatura|Profesor|Lunes', case=False, na=False).any():
        df = df.iloc[1:].reset_index(drop=True)

    if len(df.columns) == len(campos):
        df.columns = campos
    else:
        print(f"  Advertencia: {ruta} tiene {len(df.columns)} columnas (esperadas {len(campos)}), nombres genéricos.")
        df.columns = [f"col_{i}" for i in range(len(df.columns))]

    df.insert(0, "Fuente", ruta)
    dfs.append(df)

if dfs:
    resultado = pd.concat(dfs, ignore_index=True)
    salida = "horario_completo1.csv"
    resultado.to_csv(salida, index=False, encoding='utf-8-sig')
    print(f"\nListo. {len(dfs)} imagen(es) procesadas → {salida} ({len(resultado)} filas)")
else:
    print("No se extrajo ninguna tabla.")

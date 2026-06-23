import pytesseract
import pandas as pd
from PIL import Image as PILImage, ImageEnhance
import os

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

csv_entrada = "horario_completo1.csv"
csv_salida  = "horario_completo1.csv"

df_total = pd.read_csv(csv_entrada, encoding="utf-8-sig", dtype=str)

imagenes_s = sorted([f for f in os.listdir(".") if f.lower().endswith("s.jpg")])

for ruta in imagenes_s:
    # Buscar el archivo base correspondiente (sin importar mayúsculas en extensión)
    base_sin_ext = ruta[:-5]  # quita la "s.jpg"
    base = next(
        (f for f in os.listdir(".") if f.lower().endswith(".jpg")
         and f.lower()[:-4] == base_sin_ext.lower()
         and not f.lower().endswith("s.jpg")),
        base_sin_ext + ".jpg"
    )

    print(f"Leyendo edificio de {ruta} (para filas de {base})...")

    img = PILImage.open(ruta)
    w, h = img.size
    img = img.resize((w * 3, h * 3), PILImage.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = img.convert("L")

    config = "--psm 6 -c tessedit_char_whitelist=0123456789"
    texto = pytesseract.image_to_string(img, lang="spa", config=config)

    numeros = [line.strip() for line in texto.splitlines() if line.strip().isdigit()]

    mask = df_total["Fuente"] == base
    indices = df_total[mask].index

    if len(numeros) == len(indices):
        df_total.loc[indices, "Edificio"] = numeros
        print(f"  {len(numeros)} valores asignados.")
    else:
        print(f"  Advertencia: {len(numeros)} números detectados pero hay {len(indices)} filas para {base}.")
        # Asignar los que alcancen
        for i, idx in enumerate(indices):
            if i < len(numeros):
                df_total.loc[idx, "Edificio"] = numeros[i]

df_total.to_csv(csv_salida, index=False, encoding="utf-8-sig")
print(f"\nListo. CSV actualizado: {csv_salida}")

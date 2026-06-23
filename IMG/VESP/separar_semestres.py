import pandas as pd
import os

df = pd.read_csv("horario_completo1.csv", encoding="utf-8-sig", dtype=str)

os.makedirs("semestres", exist_ok=True)

for fuente, grupo in df.groupby("Fuente"):
    nombre = os.path.splitext(fuente)[0] + ".csv"  # ej: 1ER.csv
    ruta = os.path.join("semestres", nombre)
    grupo.drop(columns=["Fuente"]).to_csv(ruta, index=False, encoding="utf-8-sig")
    print(f"  {nombre}: {len(grupo)} filas")

print(f"\nListo. Archivos guardados en carpeta 'semestres/'")

import pandas as pd
import os

df = pd.read_csv("horario_completo1.csv", encoding="utf-8-sig", dtype=str)

os.makedirs("grupos", exist_ok=True)

for grupo, datos in df.groupby("Grupo"):
    nombre = f"{grupo}.csv"
    ruta = os.path.join("grupos", nombre)
    datos.drop(columns=["Fuente"]).to_csv(ruta, index=False, encoding="utf-8-sig")
    print(f"  {nombre}: {len(datos)} filas")

print(f"\nListo. Archivos guardados en carpeta 'grupos/'")

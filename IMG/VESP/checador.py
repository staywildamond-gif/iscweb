import pandas as pd
import re
import io

def limpiar_y_cargar_csv(contenido_csv):
    """
    Une líneas rotas por comillas mal cerradas o saltos erróneos en el CSV.
    """
    lineas = contenido_csv.strip().split('\n')
    lineas_limpias = []
    buffer_linea = ""

    for linea in lineas:
        linea = re.sub(r'\', '', linea) # Limpieza de etiquetas de origen
        
        if buffer_linea:
            linea = buffer_linea + " " + linea.strip()
            buffer_linea = ""
        
        # Si la línea no tiene suficientes columnas y no es encabezado, se asume truncada
        if len(linea.split(',')) < 4 and not "SEMESTRE" in linea.upper():
            buffer_linea = linea.strip()
            continue
            
        lineas_limpias.append(linea)
        
    csv_final = "\n".join(lineas_limpias)
    return pd.read_csv(io.StringIO(csv_final))

def verificar_turno_anomalo(grupo, hora_inicio):
    """
    Detecta si una clase programada pertenece a un turno que no corresponde al grupo.
    En ESCOM: Grupos '1CMx' son Matutinos (M), '1CVx' son Vespertinos (V).
    """
    # Extraer la letra del turno (M o V) del identificador del grupo (ej. 1CM1 -> M)
    match = re.search(r'\d+C([MV])\d+', grupo.upper())
    if not match:
        return False
    
    turno_grupo = match.group(1)
    hora_entera = int(hora_inicio.split(':')[0])
    
    # Regla de negocio: Matutino entra antes de las 14:00, Vespertino después.
    if turno_grupo == 'M' and hora_entera >= 14:
        return f"Grupo Matutino ({grupo}) programado en la tarde ({hora_inicio} hrs)."
    if turno_grupo == 'V' and hora_entera < 12:
        return f"Grupo Vespertino ({grupo}) programado en la mañana ({hora_inicio} hrs)."
    return None

def analizar_horarios_escom(df):
    print("="*60)
    print("   REPORTE DE ANOMALÍAS AVANZADO - ESCOM")
    print("="*60 + "\n")
    
    # Diccionarios para rastrear ocupación y colisiones
    agenda_profesores = {} # { Profesor: [(Día, Hora_In, Hora_Fin, Materia, Grupo)] }
    agenda_salones = {}    # { Salón: [(Día, Hora_In, Hora_Fin, Grupo)] }
    
    for idx, row in df.iterrows():
        # Extracción y limpieza básica de campos
        materia = str(row['Materia']).strip()
        maestro = str(row['Maestro']).strip() if not pd.isna(row['Maestro']) else "VACÍO"
        grupo = str(row['Grupo']).strip() if not pd.isna(row['Grupo']) else "VACÍO"
        dia = str(row['Dia']).strip().upper() if not pd.isna(row['Dia']) else "VACÍO"
        hora_in = str(row['Hora_Inicio']).strip() if not pd.isna(row['Hora_Inicio']) else "VACÍO"
        hora_fin = str(row['Hora_Fin']).strip() if not pd.isna(row['Hora_Fin']) else "VACÍO"
        salon = str(row['Salon']).strip() if not pd.isna(row['Salon']) else "VACÍO"
        
        # 1. Alerta de Datos Faltantes Críticos
        if "VACÍO" in [maestro, grupo, dia, hora_in, salon]:
            print(f"[DATOS FALTANTES] Fila {idx+2}: Materia '{materia}' tiene campos vacíos.")
            continue
            
        # 2. Validación de Nombres Truncados
        if re.search(r'\b(DE|LA|DEL|MA|MC|DR)\.?\s*$', maestro, re.IGNORECASE):
            print(f"[POSIBLE NOMBRE TRUNCADO] Maestro: '{maestro}' en '{materia}'")

        # 3. Validación de Turno Anómalo
        error_turno = verificar_turno_anomalo(grupo, hora_in)
        if error_turno:
            print(f"[SESIÓN ANÓMALA] {error_turno} | Materia: {materia}")

        # --- ALGORITMO DE DETECCIÓN DE CHOQUES HORARIOS ---
        # Convertimos las horas a minutos del día para comparar rangos matemáticamente
        h_in_min = int(hora_in.split(':')[0]) * 60 + int(hora_in.split(':')[1])
        h_fi_min = int(hora_fin.split(':')[0]) * 60 + int(hora_fin.split(':')[1])
        
        # A) Choque de Profesor (No puede estar en dos lugares a la vez)
        if maestro != "POR ASIGNAR":
            if maestro not in agenda_profesores:
                agenda_profesores[maestro] = []
            
            for clase in agenda_profesores[maestro]:
                if clase['dia'] == dia:
                    # Verificar si los rangos de tiempo se traslapan
                    if max(h_in_min, clase['in']) < min(h_fi_min, clase['fin']):
                        print(f"[¡CHOQUE DE PROFESOR!] El docente '{maestro}' tiene un empalme el {dia}:")
                        print(f"  -> Clase 1: {clase['materia']} (Grupo {clase['grupo']}) de {clase['h_str_in']} a {clase['h_str_fi']}")
                        print(f"  -> Clase 2: {materia} (Grupo {grupo}) de {hora_in} a {hora_fin}\n")
            
            agenda_profesores[maestro].append({'dia': dia, 'in': h_in_min, 'fin': h_fi_min, 'materia': materia, 'grupo': grupo, 'h_str_in': hora_in, 'h_str_fi': hora_fin})

        # B) Choque de Salón (Dos grupos no pueden usar el mismo salón al mismo tiempo)
        if salon != "POR ASIGNAR" and salon != "LINEA":
            if salon not in agenda_salones:
                agenda_salones[salon] = []
                
            for ocupacion in agenda_salones[salon]:
                if ocupacion['dia'] == dia:
                    if max(h_in_min, ocupacion['in']) < min(h_fi_min, ocupacion['fin']):
                        print(f"[¡CHOQUE DE SALÓN!] El aula '{salon}' está duplicada el {dia}:")
                        print(f"  -> Ocupado por: Grupo {ocupacion['grupo']} ({ocupacion['materia']})")
                        print(f"  -> Intenta entrar: Grupo {grupo} ({materia}) a las {hora_in} hrs.\n")
                        
            agenda_salones[salon].append({'dia': dia, 'in': h_in_min, 'fin': h_fi_min, 'grupo': grupo, 'materia': materia})

# --- SIMULACIÓN CON ERRORES ---
csv_ejemplo = """Materia,Maestro,Grupo,Dia,Hora_Inicio,Hora_Fin,Salon
CALCULO,DORANTES VILLA CLAUDIA JISELA,1CM1,Lunes,07:00,08:30,1101
MATEMÁTICAS DISCRETAS,DORANTES VILLA CLAUDIA JISELA,1CM2,Lunes,08:00,09:30,1102
FUNDAMENTOS DE PROGRAMACIÓN,RESENDIZ MUÑOZ ROCIO,1CM1,Martes,15:00,16:30,1101
ESTRUCTURA DE DATOS,FLORES MENDOZA YAXKIN,1CM5,Martes,07:00,08:30,1101
ALGEBRA LINEAL,MIGUEL PILAR ZELIN,1CM1,Miercoles,07:00,08:30,
"""

# Ejecutar el análisis
df_datos = limpiar_y_cargar_csv(csv_ejemplo)
analizar_horarios_escom(df_datos)
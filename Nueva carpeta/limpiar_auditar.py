# Limpia los CSV crudos del OCR (artefactos de PaddleOCR/img2table) y audita:
#   - formato de horas, celdas con horas dobles (filas fusionadas)
#   - choques intra-grupo
#   - profesores no vistos en 26/2 (posible error de OCR o profe nuevo)
#   - materias que no empatan con el plan
# Salida: csv_limpio/<turno>_<sem>.csv + reporte_auditoria.txt
import os, re, csv, unicodedata

BASE = os.path.dirname(os.path.abspath(__file__))
IN_DIR = os.path.join(BASE, "csv")
OUT_DIR = os.path.join(BASE, "csv_limpio")
os.makedirs(OUT_DIR, exist_ok=True)

DIAS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
HORA_RE = re.compile(r"\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}")

def norm(s):
    s = unicodedata.normalize("NFD", s.upper())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def uncell(v):
    """Deshace el formato del OCR: ['T E X T O'] -> TEXTO (palabras con espacio simple)."""
    if v is None:
        return ""
    v = str(v).strip()
    if not v or v == "nan":
        return ""
    # quitar envoltura de lista ['..'] o ['..', '..'] (une elementos con espacio)
    if v.startswith("[") and v.endswith("]"):
        try:
            import ast
            items = ast.literal_eval(v)
            if isinstance(items, (list, tuple)):
                v = " ".join(str(x) for x in items)
        except Exception:
            v = v.strip("[]").replace("'", "")
    # letras separadas por 1 espacio, palabras por 2+: colapsar
    if re.fullmatch(r"(\S( \S)*)( {2,}\S( \S)*)*", v):
        palabras = re.split(r" {2,}", v)
        v = " ".join(p.replace(" ", "") for p in palabras)
    return re.sub(r"\s+", " ", v).strip()

# --- profesores conocidos del 26/2 (schedule.js) ---
conocidos = set()
sched_js = open(os.path.join(BASE, "..", "schedule.js"), encoding="utf-8").read()
for m in re.finditer(r'profesor:"([^"]+)"', sched_js):
    conocidos.add(norm(m.group(1)))
metrics_js = open(os.path.join(BASE, "..", "metrics.js"), encoding="utf-8").read()
for m in re.finditer(r'^\s*"([^"]+)":', metrics_js, re.M):
    conocidos.add(norm(m.group(1)))

# --- materias del plan (de data.js PLAN + variantes con | en schedule) ---
materias_plan = set()
data_js = open(os.path.join(BASE, "..", "data.js"), encoding="utf-8").read()
for m in re.finditer(r'\["([^"]+)",\s*[\d.]+\]', data_js):
    materias_plan.add(norm(m.group(1)))
for m in re.finditer(r'materia:"([^"]+)"', sched_js):
    materias_plan.add(norm(m.group(1)))

rep = []
filas_ok = []
def W(s=""):
    rep.append(s)

tot_filas = 0
for fn in sorted(os.listdir(IN_DIR)):
    if not fn.endswith(".csv"):
        continue
    turno_sem = fn[:-4]
    with open(os.path.join(IN_DIR, fn), encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    header, data = rows[0], rows[1:]
    limpio = []
    for r in data:
        r = (r + [""] * 11)[:11]
        vals = [uncell(x) for x in r]
        # fila basura: contiene los nombres de encabezado
        if "GRUPO" in norm(vals[0]) or not vals[0]:
            if not any(vals):
                continue
            if "GRUPO" in norm(" ".join(vals)):
                continue
        limpio.append(vals)
    # guardar limpio
    with open(os.path.join(OUT_DIR, fn), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Grupo", "Asignatura", "Profesor", "Edificio", "Salon"] + DIAS)
        w.writerows(limpio)
    tot_filas += len(limpio)
    for vals in limpio:
        filas_ok.append((turno_sem, vals))

W(f"== FILAS TOTALES LIMPIAS: {tot_filas} ==")
W()

# --- auditoría ---
W("== 1) Celdas de dia con HORAS DOBLES o formato raro ==")
n = 0
for src, v in filas_ok:
    for di, d in enumerate(DIAS):
        cell = v[5 + di]
        if not cell:
            continue
        horas = HORA_RE.findall(cell)
        resto = HORA_RE.sub("", cell).strip()
        if len(horas) > 1:
            W(f"  [{src}] {v[0]} {v[1][:35]} {d}: {len(horas)} horas en una celda -> {cell!r}")
            n += 1
        elif len(horas) == 0 or resto:
            W(f"  [{src}] {v[0]} {v[1][:35]} {d}: formato raro -> {cell!r}")
            n += 1
W(f"  total: {n}")
W()

W("== 2) Filas con campos clave vacios (grupo/materia/profesor/salon) ==")
n = 0
for src, v in filas_ok:
    faltan = [c for c, x in zip(["grupo", "materia", "profesor", "edificio", "salon"], v[:5]) if not x]
    if faltan:
        W(f"  [{src}] {v[0] or '?'} {v[1][:40] or '?'} -> faltan: {','.join(faltan)}")
        n += 1
W(f"  total: {n}")
W()

W("== 3) Grupos con formato invalido ==")
n = 0
for src, v in filas_ok:
    if v[0] and not re.fullmatch(r"[1-8]C[MVX]\d{1,2}", v[0].replace(" ", "")):
        W(f"  [{src}] grupo raro: {v[0]!r}")
        n += 1
W(f"  total: {n}")
W()

W("== 4) Profesores NO vistos en 26/2 (nuevos o error de OCR) ==")
nuevos = {}
for src, v in filas_ok:
    p = norm(v[2])
    if p and p not in conocidos:
        nuevos.setdefault(p, []).append(f"{v[0]}({src})")
for p, gs in sorted(nuevos.items()):
    W(f"  {p}  <-  {', '.join(gs[:4])}{'...' if len(gs) > 4 else ''}")
W(f"  total: {len(nuevos)}")
W()

W("== 5) Materias que NO empatan con el plan ==")
desconocidas = {}
for src, v in filas_ok:
    mn = norm(v[1])
    if mn and mn not in materias_plan and not any(mn == m or mn in m or m in mn for m in materias_plan):
        desconocidas.setdefault(mn, []).append(v[0])
for m, gs in sorted(desconocidas.items()):
    W(f"  {m[:70]}  <-  {', '.join(gs[:4])}")
W(f"  total: {len(desconocidas)}")
W()

W("== 6) CHOQUES intra-grupo (traslapes de horario) ==")
def amin(h):
    a, b = h.split(":")
    return int(a) * 60 + int(b)
slots = {}
for src, v in filas_ok:
    g = v[0].replace(" ", "")
    for di, d in enumerate(DIAS):
        for h in HORA_RE.findall(v[5 + di]):
            ini, fin = [x.strip() for x in h.split("-")]
            slots.setdefault(g, []).append((d, amin(ini), amin(fin), v[1][:38], ini, fin))
n = 0
for g in sorted(slots):
    ss = slots[g]
    for i in range(len(ss)):
        for j in range(i + 1, len(ss)):
            a, b = ss[i], ss[j]
            if a[0] == b[0] and a[1] < b[2] and b[1] < a[2] and a[3] != b[3]:
                W(f"  {g} {a[0]}: '{a[3]}' {a[4]}-{a[5]}  vs  '{b[3]}' {b[4]}-{b[5]}")
                n += 1
W(f"  total: {n}")

texto = "\n".join(rep)
open(os.path.join(BASE, "reporte_auditoria.txt"), "w", encoding="utf-8").write(texto)
print(texto[:6000])
print("...")
print(f"Reporte completo: {os.path.join(BASE, 'reporte_auditoria.txt')}")

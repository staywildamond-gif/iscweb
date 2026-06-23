import csv, sys, re, json
from collections import defaultdict

PATH = r"C:\Users\P\Documents\pro\IMG\VESP\horario_completo1.csv"

def parse_time(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        start, end = s.split('-')
        h1,m1 = map(int,start.split(':'))
        h2,m2 = map(int,end.split(':'))
        return h1*60+m1, h2*60+m2
    except Exception:
        return None

rows = []
with open(PATH, encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    for i,row in enumerate(reader, start=2):
        row['_line'] = i
        rows.append(row)

# Collect sessions per group+day
days = ['Lun','Mar','Mie','Jue','Vie']
group_day = defaultdict(list)
missing = []
suspicious = []
anomalous = []
for r in rows:
    group = r.get('Grupo','').strip()
    subj = r.get('Asignatura','').strip()
    prof = r.get('Profesor','').strip()
    edificio = r.get('Edificio','').strip()
    salon = r.get('Salon','').strip()
    # Missing critical fields
    if not prof or not edificio or not salon:
        missing.append({'line':r['_line'],'Grupo':group,'Asignatura':subj,'Profesor':prof,'Edificio':edificio,'Salon':salon})
    # Suspicious/truncated heuristics
    # 1) contains pipe
    if '|' in subj or '|' in prof:
        suspicious.append({'line':r['_line'],'field':'pipe','Grupo':group,'Asignatura':subj,'Profesor':prof})
    # 2) professor with <2 name parts
    if prof and len(prof.split()) < 2:
        suspicious.append({'line':r['_line'],'field':'short_prof','Profesor':prof,'Grupo':group})
    # 3) starts with non-letter (possible truncation)
    if subj and not subj[0].isalpha():
        suspicious.append({'line':r['_line'],'field':'subj_start_nonalpha','Asignatura':subj,'Grupo':group})
    if prof and not prof[0].isalpha():
        suspicious.append({'line':r['_line'],'field':'prof_start_nonalpha','Profesor':prof,'Grupo':group})

    for d in days:
        ts = r.get(d,'').strip()
        if ts:
            parsed = parse_time(ts)
            if parsed is None:
                anomalous.append({'line':r['_line'],'Grupo':group,'day':d,'time':ts,'reason':'unparsable','Asignatura':subj})
            else:
                start,end = parsed
                dur = end - start
                if dur <= 0:
                    anomalous.append({'line':r['_line'],'Grupo':group,'day':d,'time':ts,'reason':'nonpositive_duration','Asignatura':subj})
                if dur > 180:
                    anomalous.append({'line':r['_line'],'Grupo':group,'day':d,'time':ts,'reason':'long_duration','dur_min':dur,'Asignatura':subj})
                group_day[(group,d)].append({'line':r['_line'],'start':start,'end':end,'Asignatura':subj,'Profesor':prof,'time':ts})

# Detect intra-group overlaps
conflicts = []
for (group,d), items in group_day.items():
    items_sorted = sorted(items, key=lambda x: x['start'])
    for i in range(len(items_sorted)):
        a = items_sorted[i]
        for j in range(i+1, len(items_sorted)):
            b = items_sorted[j]
            if b['start'] < a['end']:
                conflicts.append({'Grupo':group,'day':d,'A':{'line':a['line'],'Asignatura':a['Asignatura'],'time':a['time']},'B':{'line':b['line'],'Asignatura':b['Asignatura'],'time':b['time']}})
            else:
                break

# Prepare summary
summary = {
    'total_rows': len(rows),
    'missing_count': len(missing),
    'missing_examples': missing[:10],
    'suspicious_count': len(suspicious),
    'suspicious_examples': suspicious[:10],
    'anomalous_count': len(anomalous),
    'anomalous_examples': anomalous[:10],
    'conflicts_count': len(conflicts),
    'conflicts_examples': conflicts[:10]
}

print(json.dumps(summary, ensure_ascii=False, indent=2))

# Proyecto — Tracker académico ISC (ESCOM-IPN)

App web para que un estudiante de **Ingeniería en Sistemas Computacionales** de ESCOM lleve su avance en el plan de estudios, califique a sus profesores, vea materias optativas por especialización, y arme su horario por reinscripción.

Sin backend, sin framework. Todo vive en archivos estáticos servidos en `http://localhost:8123` (preview).

---

## 1. Arquitectura

**Vanilla JS, sin bundler.** Los datos viven como literales JavaScript (`const X = [...]`) en archivos `.js` cargados con `<script>`. El estado del usuario vive en `localStorage` bajo la clave `avanceISC_v2`.

```
index.html           ← UI + sistema de pestañas
app.js               ← lógica principal (estado, render, eventos)
styles.css           ← visual
schedule.js          ← generado desde horarios.csv + IMG/VESP/horario_completo1.csv (430 ofertas, M+V ISC)
metrics.js           ← generado desde AESTR_CORREGIDO_3.csv + AESTR_VESPERTINO_plantilla.csv (202 profes M+V)
roster.js            ← mapeo profes → materias (M + V); aún necesario para resolver OPTATIVA A1/B1
optativas.js         ← 14 especializaciones (ramas) y sus materias por sem
```

### Fuentes canónicas (CSVs editables a mano)

```
horarios.csv                    ← Mat ISC, 240 filas, sin choques, IS LA VERDAD para schedule.js (parte M)
AESTR_CORREGIDO_3.csv           ← Mat ISC, calificaciones por maestro, IS LA VERDAD para metrics.js (parte M)
IMG/VESP/horario_completo1.csv  ← Vesp ISC, 190 filas, sin choques, YA en schedule.js (parte V)
AESTR_VESPERTINO_plantilla.csv  ← Vesp ISC, calificaciones 105 maestros, YA en metrics.js (parte V)
```

**Regla:** si el usuario corrige un CSV, hay que **regenerar** el `.js` correspondiente con PowerShell. Los `.js` son artefactos derivados.

### Convención de IDs

- Cada materia del plan tiene un id `s{semestre0}-{índice0}` (ej. Cálculo de 1.er sem = `s0-0`).
- Cada grupo se codifica `[1-8][A-Z][MV][1-9]`:
  - 1.º carácter: semestre (1-8)
  - 2.º carácter: **carrera** — `C`=ISC, `A`=Ing. en IA, `B`=Lic. Cs. Datos
  - 3.º carácter: **turno** — `M`=matutino, `V`=vespertino
  - 4.º+: # de grupo (1-10)
- Ej: `6CV3` = 6.º sem, ISC, vespertino, grupo 3.

---

## 2. Reglas de negocio (las 17 + extras del usuario)

Numeradas según las pidió el usuario. Todas ya implementadas en el código.

1. **Auto-quitar del horario al aprobar.** Solo cuando status pasa a `aprobada` se borra del horario. Cualquier otra transición lo conserva.
2. **Status DERIVADO de calif** (no hay select de status):
   - `pendiente` = sin calif (1ª vez)
   - `🔁 En recurse` = sin calif + veces=2 (cursándola 2ª vez, aún sin pasar)
   - `aprobada` = calif ≥ 6
   - `reprobada` = calif < 6 (veces=1) · `🔒 Bloqueada · sin 3.er intento` (veces=2)
   - Calif obligatoria solo si el usuario captura algo.
3. **Calif = ENTERO 0–10**. Decimales → alert + borrar.
4. **Métricas de profes son SOLO LECTURA** en pestaña Maestros. `Lo Recomiendan` muestra `%`.
5. **Paleta de 6 colores** para métricas de profes:
   - Calidad (0–10): `≥9 verde fuerte #15803d` · `≥8 verde claro #84cc16` · `≥7 amarillo #facc15` · `≥6 naranja #f97316` · `≥4.9 rojo #dc2626` · `resto rojo fuerte #7f1d1d`
   - Recomiendan (0–100%): mismos umbrales × 10 (90/80/70/60/50)
   - **Dificultad invertida** (escala 0–6, bajo = bueno, alto = malo): `<1 verde fuerte` · `<2 verde claro` · `<3 amarillo` · `<4 naranja` · `<5 rojo` · `≥5 rojo fuerte`
6. (no usado, el usuario brincó del 5 al 7)
7. **Dropdown único de orden** en pestaña Maestros (no flechas por columna).
8. **Criterios de orden:** Maestro/Calidad/Recomiendan/Dificultad/Grupo/Semestre/Materia.
9. **Resumen horario** muestra solo 4 tarjetas: Créditos inscritos · Materias inscritas · Calidad promedio · Dificultad promedio. (El recurse YA NO es obligatorio en el horario — se quitó el bloqueo visual que exigía meter reprobadas.)
10. **Barra de avance continua** (no segmentada por semestre). Color cambia por % completado. No cuenta reprobadas.
11. Espacios de la rejilla del horario: 78px alto, padding ~10px, line-clamp 2 en nombres.
12. **Promedios** simples (no ponderados): solo Calidad y Dificultad. No mostrar Recomiendan.
13. **Bloquear materia duplicada** en horario. Mismo `sid` solo puede aparecer 1 vez. Para optativas: cada slot (A1/B1/A2/B2) solo acepta 1 rama.
14. **Botón "Borrar todo el horario"** con confirmación.
15. **Pestaña Optativas** estilo ruta horizontal `6.° → 7.°` para las 14 ramas. Resalta la rama elegida con borde + ✓ ELEGIDA.
16. **(Pendiente)** Filtro M / V en pestaña Maestros + carga del CSV vespertino.
17. **Modo Auto en Generar Horario** (rediseñado):
   - Inputs: turno (M/V/ambos), hora entrada, hora salida, máx materias (1–9, default 7).
   - **Completar, no sobrescribir:** conserva lo que metiste a mano (entradas sin `_auto`); solo reemplaza lo auto-generado (`_auto:true`).
   - **Cascada multi-semestre:** recorre TODOS los semestres de menor a mayor. Prioriza el semestre más bajo con pendientes, luego sube. Intercala semestres por compacidad pero el orden greedy garantiza que el menor se llena primero.
   - **Créditos bloqueados cuentan:** `creditosBloqueados()` suma los créditos de materias bloqueadas (reprobada + veces≥2). Se restan de los 55 disponibles. `maxEfectivo = 55 − credBloq`.
   - Optativas NO — se eligen a mano.
   - **NO usa calidad/dificultad.** Búsqueda **aleatoria** (600 pasadas) que junta soluciones distintas; el pool se queda con las de **máximo de materias y mínimo de huecos** (`contarHuecos` sobre bloques). Respeta límite de créditos (no sobrepasa `maxEfectivo`).
   - Botón **🎲 Otra opción** (`autoOtraBtn`): baraja otra combinación igual de compacta sin repetir la anterior.
   - **Resultado muestra desglose por semestre** ("2 de 1.er sem, 3 de 2.° sem...").
   - Las horas muertas solo se permiten en modo Manual.

### Diseño del flujo de status (importante, no obvio):

- **No hay select de status manual.** Solo: input `calif` + select `veces cursada` (1 ó 2).
- veces=1 sin calif → `Pendiente`; veces=2 sin calif → `🔁 En recurse` (badge `data-recurse="1"`).
- Si veces=2 y reprobada → **bloqueada** (`🔒 sin 3.er intento`, badge rojo oscuro, profsBtn oculto, se borra del horario).
- Si veces=2 y aprobada → "Aprobada (recurse)".
- `tipo` en horario (`nueva` vs `recurse`) se infiere de `veces` (≥2 → recurse).

### Reglas de inscripción

- Máx **55 créditos** por reinscripción. Materias **bloqueadas** restan del tope (`maxEfectivo = 55 − creditosBloqueados()`).
- La tarjeta de créditos muestra `inscritos / maxEfectivo` y un badge `(X cr bloq.)` si aplica.
- **Misma materia no puede estar 2 veces** en el horario.
- Una optativa por slot.

---

## 3. Excepciones del plan que no son errores

Si una validación detecta esto y lo reporta como error, es **falso positivo**:

- **Grupos `1CM7`-`1CM10` y `1CV5`+**: son grupos de **recurse** del primer sem. No hay recurse de COE (Comunicación Oral y Escrita).
- **Desde 2.º sem solo hay XCM1-XCM5 (M) / XCV1-XCV5 (V).** Los grupos se depuran, ya no hay recurses.
- **`6CM6`, `7CM6`, `6CV5`, `7CV5`**: grupos especiales para una sola optativa alternativa (B1 o A2/B2).
- **`5CM6` y `5CV6`** (si aparecen): grupo separado solo para una materia (gestión escolar).
- **`7CV7` sin `7CV6`**: 7CV6 no se abrió pero existe una materia listada como 7CV7. Es válido.
- **Materias faltantes en algún grupo** (4CM5, 5CM3, 5CM4 a veces): por disponibilidad de salones o gestión externa. No son errores de transcripción.
- **8.º sem solo 3 materias visibles** (Liderazgo, Gestión, Hab. Soc.): `Trabajo Terminal II` y `Estancia Profesional` no tienen horario fijo.

### Mapeo no-obvio de optativas

Este es el truco más sutil del proyecto. Hay 2 fuentes describiendo lo mismo distinto:

- **`roster.js`** (de AESTR_CORREGIDO_3.csv) usa nombre de slot: `"OPTATIVA A1"`, `"OPTATIVA B1"`, etc.
- **`schedule.js`** (de horarios.csv) usa nombre de rama: `"CRIPTOGRAFIA|INTRODUCTION TO CRYPTOGRAPHY"`, `"BIG DATA|NON-RELATIONAL DATABASES"`, etc.

Para enlazar: `scheduleFor()` en `app.js` busca en ROSTER los profes de `OPTATIVA <label>` y filtra SCHEDULE por esos profes + materia con `|` + semestre del slot. **Si rompes esto, la selección de optativas falla silenciosamente.**

Los slots son fijos: `OPT_SLOTS["s5-5"]=A1, "s5-6"=B1, "s6-4"=A2, "s6-5"=B2`.

---

## 4. Bloques horarios

```
07:00 – 08:30
08:30 – 10:00
☕ Receso 10:00 – 10:30
10:30 – 12:00
12:00 – 13:30
13:30 – 15:00
15:00 – 16:30
16:30 – 18:00
☕ Receso 18:00 – 18:30
18:30 – 20:00
20:00 – 21:30
```

- Cada bloque = **1:30 horas**.
- **Matutino** ocupa típicamente 07:00–15:00.
- **Vespertino** puede empezar **desde las 12:00** (no desde 15:00 como pensábamos al inicio).

---

## 5. Flujo de trabajo con datos

Cuando el usuario quiere actualizar un horario o calificaciones, el flujo SIEMPRE es:

1. **Usuario manda imagen** (captura de SAESPEED u otro sistema oficial) o CSV de WIP.
2. **Yo transcribo** y/o **audito** con PowerShell: choques intra-grupo, datos faltantes, nombres truncados, sesiones anómalas, formato de tiempo válido.
3. **Reporto inconsistencias en tabla** y pregunto al usuario.
4. **Usuario confirma o manda imagen oficial** (siempre dice "AQUI ESTAN LAS OFICIALES" cuando es la fuente de verdad).
5. **Aplico correcciones** al CSV canónico vía PowerShell.
6. **Re-valido choques = 0.**
7. **Regenero el `.js` derivado** (`schedule.js` o `metrics.js`).
8. **Verifico en el preview** que no hay errores en consola + capturo screenshot.

**Nunca asumir un cambio sin ver datos oficiales.** El usuario usa SAESPEED como fuente canónica.

---

## 6. Estado actual (snapshot)

### ✅ Completado
- Plan estudios completo (47 materias, 387 créditos)
- Sistema status derivado de calif + veces cursada
- Pestaña Mi avance: barra continua, calif por materia, badge estado, drop maestros
- Pestaña Maestros: 6 colores, dropdown ordenamiento (8 criterios), materias toggleables verde/rojo, agregar materia manualmente
- Pestaña Generar Horario: rejilla semanal + recesos + colores por materia + detección de choques + modo Auto
- Pestaña Optativas: rutas estilo `6.° → 7.°` para las 14 ramas
- **TURNO VESPERTINO UNIFICADO** (todas las funciones):
  - `schedule.js`: 430 ofertas (240 M + 190 V), **0 choques**
  - `metrics.js`: 202 profes (M + V; correcciones BARRALES rec→14, TELLEZ BARRERA rec/dif invertidos)
  - `roster.js`: extendido con 148 entradas vespertino (105 profes V)
  - **P16**: filtro `Ambos / Matutino / Vespertino` en pestaña Maestros + badges M/V por maestro
  - Modo Auto con selector de turno (ajusta ventana: M=07-15, V=12-21:30) y filtra ofertas por turno
  - Materias regulares: el dropdown muestra ofertas M y V juntas (grupo identifica el turno)
- **Optativas vespertinas:** NO tienen división A/B como matutino. `scheduleFor()` muestra TODAS las optativas V del semestre en ambos slots (A1/B1, A2/B2); matutino conserva su filtro A/B exacto por roster. Si ESCOM define un A/B oficial para V, pedirlo al usuario.

### ⏳ Pendiente
1. Eventualmente: **Ing. en IA** (códigos `XAM/XAV`) e **Lic. Cs. Datos** (`XBM/XBV`).

---

## 7. Convenciones de comunicación con el usuario

- **Idioma:** español informal.
- **Tono:** conciso, directo. Nada de saludos largos, ni resúmenes innecesarios al final.
- **Para correcciones iterativas:** primero reportar en tabla, esperar confirmación, después aplicar. Nunca aplicar y luego avisar.
- **Cuando hay ambigüedad:** preguntar punto por punto antes de actuar (el usuario lo pide explícito: "PUNTO POR PUNTO").
- **Para tareas grandes (3+ pasos):** usar `TaskCreate` y mantener actualizado.

---

## 8. No tocar / no asumir

- **No "modernizar" a un framework.** Es vanilla por diseño.
- **No agregar un backend** ni base de datos. Todo localStorage.
- **No borrar `roster.js`** aunque parezca duplicado con `schedule.js` — sigue siendo necesario para resolver optativas.
- **No suponer profes** para los grupos del vespertino — el usuario los validará uno a uno.
- **No agregar features no pedidas.** Las 17 reglas (+ rediseño status) son el alcance acordado por ahora.

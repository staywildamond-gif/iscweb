# Proyecto — Tracker académico ISC (ESCOM-IPN)

App web para que un estudiante de **Ingeniería en Sistemas Computacionales** de ESCOM lleve su avance en el plan de estudios, califique a sus profesores, vea materias optativas por especialización, y arme su horario por reinscripción.

Sin backend, sin framework. Todo vive en archivos estáticos servidos en `http://localhost:8123` (preview).

---

## 1. Arquitectura

**Vanilla JS, sin bundler.** Los datos viven como literales JavaScript (`const X = [...]`) en archivos `.js` cargados con `<script>`. El estado del usuario vive en `localStorage` bajo la clave `avanceISC_v2`.

**Ya NO existe `app.js`.** La lógica está modularizada; `index.html` carga los `.js` en este orden exacto (datos primero, módulos después, `init.js` al final):

```
index.html           ← UI + sistema de pestañas
styles.css           ← visual

— DATOS CRÍTICOS, en <script> (artefactos derivados, no editar a mano) —
roster.js            ← 331 entradas profe→materia→grupos (solo ISC); resuelve OPTATIVA A1/B1/A2/B2
                       y aporta los profes con métrica que no dan clase este periodo
metrics.js           ← 202 profes con calidad / recomiendan / dificultad (global por profe)
schedule.js          ← 665 ofertas de las 3 carreras (M+V), con campo `carrera`, 0 choques
planes.js            ← PLANES: plan, optativas, slots, créditos, maxCred y seriación por carrera
optativas.js         ← 14 especializaciones (ramas) ISC y sus 2 materias (sem 6 → sem 7)
calendario.js        ← CALENDARIO: periodos escolares y eventos (reinscripción, ETS, asuetos)

— DATOS DIFERIDOS (NO van en index.html; los pide lazy.js) —
cupos.js             ← CUPOS (periodo vigente) + CUPOS_HIST (periodos pasados) por grupo+materia
maestros_manual.js   ← 205 links a MisProfesores (con <script> para que funcione en file://)
historial.js         ← historial de periodos (26/2, 27/1), con campo `carrera`; hoy todo ISC

— MÓDULOS —
lazy.js              ← cargarDato() / prefetchDatos() / repintarActiva(); carga antes que data.js
data.js              ← carrera activa + PLAN / OPT_SLOTS / TOTAL / MAX_CRED / KEY derivados de ella
carrera-ui.js        ← selector de carrera del header (cambiar recarga la página)
core.js              ← norm(), cupoDe(), turnoDeGrupo(), helpers compartidos
avance.js            ← pestaña Mi avance + irAPestana()
maestros.js          ← pestaña Maestros
horario.js           ← pestaña Generar horario (rejilla, choques)
optativas-ui.js      ← pestaña Optativas
auto.js              ← modo Auto + SERIACION
export.js            ← exportar horario a JPG / XLSX
historial-ui.js      ← pestaña Historial
calendario-ui.js     ← pestaña Calendario + franja de periodo y días inhábiles en la rejilla
tema.js              ← claro / oscuro (el tema se aplica en un <script> del <head>)
buscador.js          ← paleta global: materias + maestros + grupos (/ o Ctrl+K)
comparador.js        ← abrirComparador(s,i) y abrirGrupo(codigo); dueño de los modales
compartir.js         ← horario dentro del enlace (#h=), sin servidor
atajos.js            ← atajos de teclado
portada.js           ← pantalla de entrada; elegir carrera
init.js              ← arranque + registro del service worker

— PÁGINA PÚBLICA —
favicon.svg          ← icono (SVG inline, sin PNG que mantener)
manifest.webmanifest ← instalable como app
sw.js                ← service worker: abre sin internet

— HERRAMIENTAS —
build-data.ps1       ← genera planes.js + schedule.js + calendario.js desde data/ y los CSV
build.ps1            ← genera metrics.js + maestros_manual.js + cupos.js desde los CSV (UTF-8)
validate.ps1         ← audita choques, horas, profes sin métrica, links y cobertura por carrera
auditoria/pdf2png.sh ← renderiza un PDF a PNG (pdf.js + Edge headless)
```

**Quién genera qué** (no los cruces): `build-data.ps1` manda sobre `planes.js`, `schedule.js` y `calendario.js`; `build.ps1` sobre `metrics.js`, `maestros_manual.js` y `cupos.js`.

### Carga diferida (`lazy.js`)

`index.html` cargaba 639 KB de JS antes de pintar un pixel. Ahora el arranque son 392 KB de JS (462 KB con el CSS y el HTML) y el resto llega solo:

| | Cuándo | Por qué |
|---|---|---|
| `cupos.js` · `maestros_manual.js` (85 KB) | prefetch en `requestIdleCallback`, desde `init.js` | los usan casi todas las pestañas, Mi avance incluida, así que no conviene esperar al clic |
| `historial.js` (187 KB) | a demanda: al abrir la pestaña Historial o la ficha de un maestro | nada más lo toca eso |

Reglas al tocar esto:
- **Todo lo diferido se lee con `typeof X !== "undefined"`.** `cupoDe()` devuelve `null` y la etiqueta de cupo simplemente no se pinta hasta que llega el archivo.
- Lo que haya que rehacer cuando un dato aterriza va en **`alLlegarDato()`** de `lazy.js` (hoy: reindexar cupos y recargar métricas manuales).
- `repintarActiva()` vuelve a pintar la pestaña abierta y la ficha de maestro encima. `refreshAfterManual()` ya no hace más que llamarla.
- Son `<script>`, no `fetch`: sigue funcionando en `file://`.
- Si agregas un `.js` de datos grande que solo use una pestaña, va diferido, no en `index.html`.
- **`schedule.js` (174 KB) no se puede diferir**: `core.js` lo necesita al cargar para armar
  `TEACHERS`, `NOMBRE_PROF` y `ALL_MATERIAS`, y la portada lo usa para sus cifras. Es la
  siguiente ganancia grande y llega sola con la BD, pidiendo por carrera y semestre.

### La portada y el resto de la página pública

- **La portada no tiene cifras escritas a mano.** `ptCifras()` y `ptDatosCarrera()` las sacan de
  `PLANES` y `SCHEDULE`, así que no pueden quedar desfasadas cuando cambie el periodo. Si pones
  un número a mano ahí, mentirá en cuanto se regeneren los datos.
- Se muestra una vez (`localStorage["escom_portada_vista"]`) y luego solo con 🏠 o la tecla `H`.
  Un enlace con horario compartido la salta.
- **El tema se aplica en un `<script>` inline del `<head>`**, antes del primer pintado. Si eso se
  mueve a `tema.js`, la página parpadea en claro antes de ponerse oscura.
- **Los colores viven en `:root`.** El tema oscuro es redefinirlos, nada más. Los únicos hex
  sueltos que quedan en `styles.css` son texto blanco sobre un fondo de color, que es blanco en
  los dos temas. Si metes un color nuevo, hazlo token.
- Los chips pastel (dificultad, cupo, turnos, calendario) se apagan en bloque con un `filter`
  en oscuro, en vez de reescribir 30 reglas.
- **`[hidden] { display: none !important }` no es decorativo.** Los overlays usan `display:flex`,
  que le gana al `hidden` del navegador: sin esa regla el buscador y los modales salen abiertos.
- **El service worker va a red primero**, no caché primero. Caché primero es más rápido pero
  sirve archivos viejos tras editar, y este proyecto se edita a diario. Sin conexión la caché
  entra igual. Al cambiar algo que importe, sube `VERSION` en `sw.js`.
- **El enlace compartido lleva el horario en el fragmento (`#h=`)**, que nunca se manda al
  servidor. Solo viajan `[sid, grupo, maestro, materia]` y el resto se reconstruye de
  `schedule.js` al abrirlo. El avance y las calificaciones **no** viajan: eso es del usuario.
- **El `<select>` "+ Materia" de la pestaña Maestros se llena al abrirlo** (`llenarAddMat`).
  Tenerlo lleno de entrada eran 276 maestros × ~140 opciones ≈ 38,600 nodos reconstruidos en
  cada repintado — o sea en cada letra del buscador. Así la pestaña pasó de 40,026 a 5,007 nodos.

**Carrera activa:** `carreraActiva()` vive en `data.js` (tiene que cargar antes que todo lo demás) y lee `localStorage["escom_carrera"]`, default `ISC`. De ahí salen, **en tiempo de carga**:

```
CARRERA        "ISC" | "IA" | "LCD"
PLAN_ACTIVO    PLANES[CARRERA]
PLAN           [{ sem, materias: [[nombre, créditos], …] }]  ← forma heredada, derivada
OPT_SLOTS      posición de cada slot; cambia por carrera (ISC sem 6 tiene 5 obligatorias, IA 4)
TOTAL          387 / 351 / 366
MAX_CRED       55 en las tres
KEY            "avanceISC_v2" para ISC · "avance_<CAR>_v1" para las otras
```

Como todo eso se calcula al cargar, **cambiar de carrera recarga la página** (`carrera-ui.js`). No intentes recalcularlo en caliente.

Todo lo que lea `SCHEDULE` debe pasar por **`schedActual()`** (en `core.js`), que filtra por `CARRERA`; si lees `SCHEDULE` directo, se cuelan las ofertas de las otras dos carreras.

**El orden del plan importa.** Los ids de materia son `s{semestre0}-{índice0}` y el avance guardado en `localStorage` se indexa por ellos. Ese orden sale del **orden de las filas de `nombres.csv`**, no de la clave. Reordenar ese CSV le mueve el avance al usuario.

### Fuentes canónicas (CSVs editables a mano)

```
AESTR_CORREGIDO_3.csv           ← Mat ISC, calificaciones por maestro, IS LA VERDAD para metrics.js (parte M)
AESTR_VESPERTINO_plantilla.csv  ← Vesp ISC, calificaciones 105 maestros, YA en metrics.js (parte V)
maestros_manual.csv             ← nombre,link_fuente (links de MisProfesores). IS LA VERDAD para maestros_manual.js
cupos.csv                       ← grupo,codigo,materia,semestre,cupo,inscritos,disponibles. IS LA VERDAD para cupos.js
calendario.csv                  ← inicio,fin,tipo,periodo. Calendario académico del IPN. IS LA VERDAD para calendario.js
nombres.csv                     ← carrera,clave,nombre,nombre_saes. Cómo se ve cada materia en la app
                                   y en qué orden va dentro de su semestre. IS LA VERDAD para planes.js
```

**`calendario.csv`:** el calendario del IPN (`data/calendarioipn-escolarizada.pdf`) marca las fechas con **colores sobre la rejilla**, no con texto, así que no hay forma de parsearlo: está transcrito a mano. De ahí salen los periodos escolares (27/1 del 24 ago al 18 dic 2026; 27/2 del 25 ene al 22 jun 2027; 28/1 arranca el 16 ago 2027) y los días sin clase. `calendario-ui.js` pinta la franja de arriba — periodo, semana N de M y cuenta regresiva al próximo hito — y marca los días inhábiles en la cabecera de la rejilla del horario. Un día puede caer en dos cosas a la vez (el 25 de diciembre es vacaciones *y* descanso obligatorio): gana el motivo más específico, según `CAL_PRIORIDAD`.

**`nombres.csv`:** el gestor escribe todo en mayúsculas, a veces sin acentos, y las optativas de ISC vienen como `RAMA|NOMBRE EN INGLÉS`. Este CSV traduce clave → nombre legible. Se generó una vez (ISC desde el `PLAN` que estaba a mano en `data.js` y desde `optativas.js`; IA y LCD desde los PDFs oficiales y un diccionario de acentos) y de ahí en adelante **se edita a mano**. `nombre_saes` es la llave para cruzar con `schedule.js`: no la toques.

### Fuentes oficiales en `data/` (HTML de SAES + PDFs del plan)

Todo lo que viene de ESCOM vive aquí, en HTML tal cual se copió de SAES. **Es la matriz**: los CSV y los `.js` se derivan de esto. Editable a mano en cualquier editor.

```
data/isc/mp.html          ← mapa curricular: No periodo · Clave · Nombre · Tipo · Créditos · Hrs teoría · Hrs práctica
data/isc/opta.html        ← página de optativas (nombre + link al PDF del programa)
data/isc/horario-m.html   ← horario matutino: Grupo · Asignatura · Profesor · Edificio · Salón · Lun–Sáb
data/isc/horario-v.html   ← horario vespertino
data/isc/*.pdf            ← mapa curricular oficial + mapa de optativas (aquí vive la SERIACIÓN)
data/ia/   …  igual, sin opta.html (las optativas de IA salen del mp + el PDF)
data/lcd/  …  igual
data/_descartados/        ← fuentes redundantes o incompletas; no usar
```

**Regla:** el HTML de `data/` manda. Si SAES cambia, se reemplaza el HTML y se regenera todo. Los `deepseek_csv_*.txt` que venían con estos datos estaban truncados — están en `_descartados/`.

**Cupos (ocupabilidad):** se cruzan con `schedule.js` por **grupo + norm(materia)** (`cupoDe()` en core.js). 429/430 ofertas cruzan (grupos `XCX` de Trabajo Terminal/optativas mixtas no tienen horario, no aplican). La etiqueta `cupoBadge()` muestra "N lugares" (verde >5 · amarillo ≤5) · "Lleno" (disp 0) · "Sobrecupo" (disp <0), en las tarjetas de oferta y en la rejilla del horario. Es una **foto** del momento: cuando el usuario mande datos nuevos, actualizar `cupos.csv` y correr `build.ps1`.

**Regla:** si el usuario corrige un CSV, hay que **regenerar** el `.js` correspondiente. Los `.js` son artefactos derivados. Ya no es ad-hoc: corre **`build.ps1`** (regenera los 3 `.js` en UTF-8, aplica correcciones conocidas, respeta coma decimal española) y luego **`validate.ps1`** (0 choques, horas válidas, profes/links). Detalles no obvios que `build.ps1` maneja:
- Los CSV de métricas usan **coma decimal** entrecomillada (`"5,9"`) → se normaliza a punto.
- Merge M+V con **dedup por nombre, matutino gana** (por eso TELLEZ BARRERA sale correcto pese a tener columnas invertidas en el CSV vespertino).
- Corrección explícita en `$METRIC_FIX`: BARRALES recomiendan `1.4→14`.
- Maestros sin ningún dato (calidad/rec/dif vacíos) se omiten de `metrics.js`.

### Convención de IDs

- Cada materia del plan tiene un id `s{semestre0}-{índice0}` (ej. Cálculo de 1.er sem = `s0-0`).
- Cada grupo se codifica `[1-8][A-Z][MV][1-9]`:
  - 1.º carácter: semestre (1-8)
  - 2.º carácter: **carrera** — `C`=ISC, `B`=Ing. en IA, `A`=Lic. Cs. Datos
  - 3.º carácter: **turno** — `M`=matutino, `V`=vespertino
  - 4.º+: # de grupo (1-10)
- Ej: `6CV3` = 6.º sem, ISC, vespertino, grupo 3. `1BM1` = 1.er sem, IA, matutino, grupo 1. `7AV2` = 7.º sem, LCD, vespertino, grupo 2.

> ⚠️ **`A` y `B` estaban invertidas en versiones anteriores de este archivo.** Lo correcto es `B`=IA y `A`=LCD; lo confirman las claves de materia del mapa curricular oficial (`B101` para IA, `A101` para LCD) y los grupos reales (`1BM1` en IA, `1AM1` en LCD).

- La **clave oficial de materia** es el identificador primario: `C###` (ISC), `B###` (IA), `A###` (LCD). Viene del mapa curricular (`data/<carrera>/mp.html`). El nombre normalizado con `norm()` se usa solo para cruzar fuentes que no traen clave (horarios, métricas).

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
8. **Criterios de orden:** Maestro/Calidad/Recomiendan/Dificultad/Grupo/Semestre/Materia, más
   **Imparte más / menos materias** y **Más materias que ya no da** (2026-11-03).
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
- **`schedule.js`** (de `data/isc/horario-*.html`) usa nombre de rama: `"CRIPTOGRAFIA|INTRODUCTION TO CRYPTOGRAPHY"`, `"BIG DATA|NON-RELATIONAL DATABASES"`, etc.

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
- Plan estudios ISC completo (46 obligatorias + 4 slots de optativa = 50 entradas, 387 créditos)
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

- **MULTI-CARRERA**: selector en el header, plan/créditos/slots/optativas por carrera, 665 ofertas de las 3 con 0 choques. ISC 387 cr · IA 351 · LCD 366.

### ⏳ Pendiente
1. Métricas, links y cupos de los profes de IA/LCD (el usuario los trae; ver `PROFES-SIN-METRICA.md`).
2. `SUBJECT_DIFFICULTY` sigue siendo de ISC; en IA/LCD solo aparece donde el nombre coincide.

---

## 7. Convenciones de comunicación con el usuario

- **Idioma:** español informal.
- **Tono:** conciso, directo. Nada de saludos largos, ni resúmenes innecesarios al final.
- **Para correcciones iterativas:** primero reportar en tabla, esperar confirmación, después aplicar. Nunca aplicar y luego avisar.
- **Cuando hay ambigüedad:** preguntar punto por punto antes de actuar (el usuario lo pide explícito: "PUNTO POR PUNTO").
- **Para tareas grandes (3+ pasos):** usar `TaskCreate` y mantener actualizado.

---

## 8. No tocar / no asumir

- **No "modernizar" a un framework.** Es vanilla por diseño. Sigue siéndolo en la fase BD: el front no cambia.
- ~~No agregar un backend ni base de datos~~ — **derogado el 2026-11-02.** El proyecto pasa a **Postgres 17 + PHP 8.2/Apache en Docker**, con login de alumnos del IPN y reseñas de maestros. Entrega: primera semana de diciembre de 2026. El acuerdo completo (esquema de ~18 tablas, decisiones cerradas, orden de trabajo) está en **`MEMORIA-FASE-BD.md`**, que manda sobre esta sección. Hasta que eso aterrice, el estado del alumno sigue en `localStorage`.
- **No borrar `roster.js`** aunque parezca duplicado con `schedule.js` — sigue siendo necesario para resolver optativas.
- **No suponer profes** para los grupos del vespertino — el usuario los validará uno a uno.
- **No agregar features no pedidas.** Las 17 reglas (+ rediseño status) son el alcance acordado.
  El 2026-11-03 el usuario pidió explícitamente "agrega funciones que crees que sirvan" y de ahí
  salieron portada, buscador global, comparador, vista de grupo, tema oscuro, atajos, compartir
  por enlace y PWA. Eso fue para esa ronda: **no lo tomes como permiso permanente.**

---

## 9. Decisiones multi-carrera (confirmadas por el usuario, 2026-11-02)

**Arquitectura**

- **Una sola app** con selector de carrera, no páginas separadas.
- Cada oferta y cada materia llevan **campo `carrera` explícito** (`ISC` / `IA` / `LCD`), aunque el grupo también lo codifique. No derivarlo en caliente.
- **La clave oficial es el identificador primario** de materia (`C101`, `B101`, `A101`), no el nombre normalizado.
- `localStorage`: **una clave por carrera**. Un usuario lleva **una sola carrera activa**; si cambia de carrera, vuelve a capturar su avance a mano (no se migra entre carreras).
- Las **métricas de profesores son globales por profesor**, no por carrera: un profe da clase en 2 o 3 carreras (de 261 profes, muchos se comparten).
- `historial.js` (periodos) sí se separa **por carrera**. Sus 780 entradas llevan `carrera:"ISC"`
  explícito desde el 2026-11-03, y la pestaña Historial filtra con `historialDe(periodo)`. Antes
  no filtraba nadie: como el historial es 100 % de ISC, **IA y LCD mostraban los grupos de ISC**.
  Mientras no lleguen los periodos de esas dos, su pestaña muestra un aviso que dice justo eso,
  en vez de datos ajenos. Hay un `carreraDeGrupo()` en `core.js` que deduce la carrera de la 2.ª
  letra del grupo, pero es **respaldo para datos viejos sin campo**, no la fuente.
- El HTML de `data/` es la fuente; de ahí se derivan los `.js`. A futuro todo esto migra a **PostgreSQL (pgAdmin)** — por eso el modelo debe quedar normalizado y con claves oficiales.

**Planes de estudio (derivado de `data/<carrera>/mp.html` + los PDFs oficiales)**

Las tres carreras tienen la **misma estructura**: 4 slots de optativa de 7.5 cr (2 en sem 6, 2 en sem 7) = 30 cr.

| Carrera | Obligatorias | Créd. oblig. | Slots optativa | **Total** | Semestre más pesado |
|---|---|---|---|---|---|
| ISC | 46 | 357 | A1, B1 (sem 6) · A2, B2 (sem 7) | **387** | sem 4 = 55.5 cr |
| IA | 41 | 321 | A, B (sem 6) · C, D (sem 7) | **351** | sem 1 = 51 cr |
| LCD | 40 | 336 | A, B (sem 6) · C, D (sem 7) | **366** | sem 4 y sem 7 = 52.5 cr |

- `MAX_CRED` = **55 créditos, igual para las tres carreras.** Es un tope **institucional** de ESCOM, no sale del plan. La columna "semestre más pesado" de la tabla es solo informativa — nota que ISC sem 4 pide 55.5 cr, o sea que un 4.º semestre completo ya no cabe en una sola reinscripción.
- **En la UI:** la pestaña Optativas muestra las 14 rutas `6.° → 7.°` solo en ISC (`rutasPorRama()`); en IA y LCD muestra el catálogo plano en tarjetas (`catalogoPlano()`). Y `scheduleFor()` resuelve los slots de IA/LCD por **nombre de optativa del semestre**, no por `ROSTER` ni por el `|` de la rama.

**Pestaña Maestros**

- **La lista NO se separa por carrera.** `TEACHERS` sale de **todo** `SCHEDULE` (las tres carreras) más `ROSTER`, que aporta los profes con métrica que no dan clase este periodo. Las calificaciones son globales por profesor y un maestro da donde da, así que separarlos escondía información. El selector de carrera manda sobre el plan y sobre las ofertas del horario, **no** sobre quién aparece aquí.
- Cada maestro lleva badges de en qué carreras da (`carreraBadges()`), con la carrera activa resaltada. Y `ofertasDeMaestro()` devuelve su horario completo, de las tres carreras: así se ve que `HURTADO AVILÉS GABRIEL` da 4 grupos de ISC y 1 de IA.
- **Las etiquetas de materia se llaman "Imparte" (verde) y "Ya no" (rojo).** Son una nota del
  usuario, no un dato de ESCOM: arrancan con lo que dice `ROSTER` y se guardan en
  `state.teacherMats`. Los textos viven en `MAT_ESTADO` (`maestros.js`) — si los cambias,
  cámbialos también en la leyenda de `index.html`. Hay un selector **Materias**
  (`todas · imparte · yano`) que filtra las etiquetas **y** saca de la lista a los maestros que
  se quedan sin ninguna, porque una fila sin etiquetas no dice nada. Cuando la lista queda
  vacía, `renderProfs()` explica por qué: "Solo las que ya no" sale vacío hasta que marcas tu
  primera materia, y sin ese aviso parece que la app está rota.
- "Materias por periodo" en la ficha **sigue siendo de las tres carreras a propósito** (un maestro
  da donde da), pero el historial guardado es solo de ISC. Por eso la sección lleva la etiqueta
  "solo ISC" y, cuando sale vacía, lo dice: si no, un maestro que solo da IA parecería no haber
  dado clase nunca.
- **Cuidado con los acentos.** `schedule.js` guarda los nombres normalizados y `metrics.js` / `roster.js` / `maestros_manual.csv` los conservan: 25 de los 202 maestros con métrica traen acento. Por eso el cruce va siempre por `norm()` — `TEACHER_METRICS_NORM` para la métrica, `NOMBRE_PROF` para elegir el nombre que se muestra (gana el acentuado) y la llave normalizada en `allTeachers()`. Si lo cruzas por nombre crudo, el mismo profe sale dos veces y pierde su calificación.
- **Optativas de IA y LCD NO tienen ramas A/B como ISC.** En ISC cada rama es una pareja sem 6 → sem 7 de materias **distintas** (14 ramas, 28 materias, 28 claves). En IA y LCD es un **catálogo plano disponible en los dos semestres**: las 14 optativas de IA tienen clave de sem 6 (`B640`–`B653`) *y* de sem 7 (`B740`–`B753`); las 13 de LCD igual (`A620`–`A632` y `A720`–`A732`). Por eso `roster.js` no necesita extenderse a IA/LCD.
- **Fuente de verdad: el gestor de la escuela (`mp.html`), no el PDF.** El PDF de optativas reparte el catálogo de IA y LCD en dos columnas (6.º y 7.º semestre) como si cada optativa perteneciera a un solo semestre; eso es **solo informativo**. Lo que vale es SAES: cada optativa existe en ambos semestres con su propia clave. (El PDF sí es la fuente para la **seriación**, porque SAES no la trae.)
- **`mp.html` de IA tiene el bloque de 7.º semestre duplicado** (`B701`, `B702`, `B703` y `B740`–`B753` salen dos veces). Hay que deduplicar al parsear, o IA parece tener 44 obligatorias y 348 cr en vez de 41 y 321.

**Seriación: solo ISC la tiene**

- El mapa oficial de ISC **dibuja ~21 flechas** de prerrequisito; de ahí salió la `SERIACION` de `auto.js`.
- Los mapas de **IA y LCD no dibujan ninguna flecha**, y SAES tampoco trae columna de prerrequisito. **No existe seriación oficial para esas dos carreras.** Lo que hay en `planes.js` (12 pares para IA, 11 para LCD) es una **propuesta por encadenamiento de nombres, aprobada por el usuario el 2026-11-02**, no un dato de ESCOM. Si ESCOM publica la oficial, manda ella. No agregues pares nuevos sin preguntar.
- La seriación vive **solo** en `planes.js`, como `PLANES[carrera].seriacion`, con **clave → [claves]**. `auto.js` ya no tiene su propia copia. El puente entre la clave oficial y el id de posición del plan (`s1-2`) son `ID_DE_CLAVE` / `CLAVE_DE_ID`, en `data.js`.
- `prereqsAprobados(id)` y `prereqFaltante(id)` reciben el **id de la materia**, no su nombre: por nombre no se podía distinguir entre carreras.
- Para ver un mapa hay que renderizarlo: `auditoria/pdf2png.sh data/<carrera>/<pdf> <salida.png> [ancho]` usa pdf.js + Edge headless (en esta máquina no hay `pdftoppm` ni `pdftocairo`, y `pdftotext` saca el texto pero no los trazos). Los PNG ya renderizados se borraron el 2026-11-02 por ser derivados; los PDF siguen en `data/<carrera>/`.

**Datos que el usuario traerá después**

- Calificaciones de los profes sin métrica (ver `PROFES-SIN-METRICA.md`) → se integran a `metrics.js` y sus links a `maestros_manual.csv`.
- Cupos de IA y LCD. Mientras no estén, sus ofertas se muestran **sin badge de cupo**.
- Historial de periodos de IA y LCD.

**Casos especiales ya acordados**

- **Trabajo Terminal es especial, igual que en ISC**: `grupo + norm(materia)` no es llave única (en IA, `8BM1 TRABAJO TERMINAL II` tiene 3 asesores distintos y `8BM2` tiene 2). Para TT hay que meter el profesor en la llave.
- **IA viene casi sin salón**: 79 de 85 ofertas matutinas y 44 de 54 vespertinas traen `Edificio = X` y `Salón = X`. Se deja **vacío**, no es error.
- **Grupo número ≥ 6 = grupo de recurse.** Los regulares son 1–5. Así se leen `1CM7`–`1CM9`, `1CV6`, `1CV7`, `2CM6`, `2CV6`, `4CM6`.
- **No hay grupo `1CM6`** en este periodo. No es un dato perdido.
- **La rejilla de grupos del HTML es la realidad del periodo**, no una extracción incompleta. IA y LCD abren 1 o 2 grupos por semestre, y de 4.º en adelante casi siempre 1 solo. `validate.ps1` no debe marcar como error un grupo ausente — se toma lo que haya en el HTML, directo.
- Las **horas de teoría/práctica** del mapa se guardan como dato informativo (recomendación de carga), no se usan para validar.
- Ventanas del modo Auto (`M = 07:00–15:00`, `V = 12:00–21:30`) aplican igual a las tres carreras.

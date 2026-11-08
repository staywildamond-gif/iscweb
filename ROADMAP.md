# ROADMAP — Tracker académico ESCOM (iscweb)

> Memoria de trabajo: qué hay, qué falta y en qué orden. Actualizado: 2026-11-02.
> Complementa a `CLAUDE.md` (reglas de negocio, flujo de datos, decisiones multi-carrera §9). Leer ambos antes de empezar.

---

## 1. Objetivo general

Convertir el tracker de ISC en un tracker **multi-carrera de ESCOM** (ISC + Ing. en IA + Lic. en Ciencia de Datos), manteniendo:
- Sin backend, sin framework, archivos estáticos (`localhost:8123`).
- HTML oficial de `data/` → CSV canónico → `.js` derivados vía `build.ps1` → auditoría con `validate.ps1`.
- 0 choques de horario por grupo.

Objetivo secundario: que la app sirva como base del **proyecto propio de la Práctica 2 de Bases de Datos** (equipo Catscoms). A futuro los datos migran a **PostgreSQL / pgAdmin**, así que el modelo debe quedar normalizado y con claves oficiales.

---

## 2. Lo que YA se tiene (ISC)

**Repo:** `main` = `origin/main`, último merge PR #5.

**Datos**
- Plan ISC-2020: 46 obligatorias + 4 slots de optativa, 387 créditos.
- `schedule.js`: 350 ofertas ISC (M+V), 0 choques.
- `metrics.js`: 202 profes (M+V) con calidad / recomiendan / dificultad.
- `roster.js`: 331 entradas profe → materia → grupos; resuelve OPTATIVA A1/B1/A2/B2.
- `maestros_manual.js`: 205 links a MisProfesores.
- `cupos.js`: `CUPOS` (periodo vigente 27/1) + `CUPOS_HIST` (26/2) por grupo+materia.
- `historial.js`: historial de periodos (27/1 vigente).
- `optativas.js`: 14 especializaciones ISC (pareja sem 6 → sem 7).

**Funcionalidad**
- Mi avance: status derivado de calif + veces cursada (pendiente / recurse / aprobada / reprobada / bloqueada), barra continua.
- Maestros: paleta 6 colores, dropdown de orden, filtro Ambos/M/V, ficha de maestro con horario y fuentes.
- Generar horario: rejilla con recesos, detección de choques, tope 55 cr menos créditos bloqueados, badges de cupo.
- Modo Auto: cascada multi-semestre, completa sin sobrescribir, 600 pasadas aleatorias, "Otra opción".
- Optativas: rutas 6.° → 7.° de las 14 ramas.
- Exportar horario a JPG / XLSX.

**Código** (modularizado, ya NO existe `app.js`):
`data.js · core.js · avance.js · maestros.js · horario.js · optativas-ui.js · auto.js · export.js · historial-ui.js · init.js`
Herramientas: `build.ps1`, `validate.ps1`.

---

## 3. Datos oficiales de las 3 carreras (ya en el repo)

`data/<isc|ia|lcd>/` con `mp.html` (mapa curricular), `horario-m.html`, `horario-v.html`, `opta.html` (ISC y LCD) y los PDFs oficiales. Auditado el 2026-11-02:

| Fuente | Ofertas | Choques | Grupos | Sems | Profes | Salón `X`/vacío |
|---|---|---|---|---|---|---|
| ISC-M | 217 | 0 | 44 | 1–8 | 125 | 3 |
| ISC-V | 192 | 0 | 39 | 1–8 | 109 | 0 |
| IA-M | 85 | 0 | 15 | 1–8 | 68 | 79 |
| IA-V | 54 | 0 | 11 | 1–8 | 44 | 44 |
| LCD-M | 61 | 0 | 13 | 1–8 | 52 | 5 |
| LCD-V | 51 | 0 | 12 | 1–8 | 38 | 6 |
| **Total** | **660** | **0** | **134** | | **261 únicos** | |

- **73 de los 261 profes no tienen métrica.** Lista en `PROFES-SIN-METRICA.md`; el usuario las conseguirá.
- Planes: ISC 387 cr · IA 351 cr · LCD 366 cr. Las tres con 4 slots de optativa de 7.5 cr. Detalle en `CLAUDE.md` §9.
- Sin cupos ni historial de periodos para IA/LCD todavía.

---

## 4. Lo que FALTA (en orden)

### Fase 0 — Limpieza
- [x] `git config core.autocrlf true` (ya estaba puesto; el árbol está limpio).
- [x] `Nueva carpeta/` → renombrada a `auditoria/` (tiene los PNG de SAES, los scripts y los CSV intermedios; `tools/` habría mentido sobre el contenido).
- [ ] Borrar rama remota ya integrada `feat/dificultad-seriacion-inscrita` — **pendiente: requiere permiso del usuario** (`git push origin --delete`).
- [x] `CLAUDE.md`: quitado `app.js`, documentados los módulos y el orden de carga, corregidas las letras de carrera, agregada la sección `data/` y §9 con las decisiones multi-carrera.
- [x] **Borrado lo muerto (2026-11-02): el árbol pasó de 22 MB a 3.8 MB**, 214 archivos menos. Se fueron `auditoria/` menos `pdf2png.sh` (5.1 MB de evidencia de una auditoría terminada y dos scripts de Python, que ni siquiera está instalado), `data/_descartados/` (100 KB), los tres `data/*/mapa.png` (1.1 MB, se regeneran del PDF), `horarios.csv` + `IMG/VESP/horario_completo1.csv` —que dejaron de alimentar nada cuando `schedule.js` pasó a salir del HTML— e `IMG/` completa (12 MB de capturas de SAES y scripts de Python de la transcripción original de ISC). **Todo sigue en el historial de git**; `git show <commit>:IMG/MAT/1ER.jpg > x.jpg` lo recupera. Ahora la única fuente es el HTML oficial de `data/`.

### Fase 1 — Datos de IA y LCD
- [x] Mover las fuentes oficiales al repo: `data/isc/`, `data/ia/`, `data/lcd/`, `data/_descartados/`.
- [x] Identificar qué trae cada HTML y auditarlo (tabla de §3).
- [x] Planes de estudio: materias, claves, créditos y semestre de IA y LCD (desde `mp.html` + PDFs).
- [x] Optativas de IA/LCD: catálogo plano por semestre, sin ramas A/B (ver `CLAUDE.md` §9).
- [x] **Seriación de IA y LCD**: no existe oficialmente (sus mapas no dibujan flechas y SAES no trae el dato). El usuario aprobó la propuesta por nombres: 12 pares IA, 11 LCD, ya en `planes.js`.
- [x] Planes de IA y LCD extraídos y deduplicados → `PLANES-IA-LCD.md` (pendientes de que el usuario los revise) y `planes.js`.
- [x] Parser de `data/*/horario-*.html` y `data/*/mp.html` → `build-data.ps1`.
- [ ] Métricas de los 73 profes nuevos → `metrics.js`, y sus links → `maestros_manual.csv` (el usuario los trae).
- [ ] Cupos de IA/LCD cuando el usuario los consiga.

### Fase 2 — Build y validación
- [x] `build-data.ps1`: lee el HTML de `data/`, deduplica y genera `planes.js` + `schedule.js` con campo `carrera`. **665 ofertas, 0 choques.**
- [x] `build.ps1` ya no genera `schedule.js` (se habría comido el multi-carrera); queda con `metrics.js`, `maestros_manual.js` y `cupos.js`.
- [x] Correcciones aplicadas al parsear: 17 filas duplicadas en `data/ia/mp.html`, `1CM4 10:00-12:00` → `10:30-12:00`, y `1BV2`/`2AV2`/`4AV1` `13:30-16:30` → dos bloques.
- [x] `validate.ps1` lee el campo `carrera` y reporta cobertura del plan por carrera. 0 errores.

### Fase 3 — App multi-carrera
- [x] `carreraActiva()` en `data.js` + `schedActual()` en `core.js`; `scheduleFor()` y `ofertasDeMaestro()` filtran por carrera.
- [x] Selector de carrera en el header (`carrera-ui.js`), persistido en `localStorage["escom_carrera"]`. Cambiarlo recarga la página y avisa que el avance no se migra.
- [x] Una clave de `localStorage` por carrera; ISC conserva `avanceISC_v2` para no perder lo capturado.
- [x] Mi avance y tope de créditos según el plan elegido: 387/351/366 créditos, 50/45/44 entradas, `MAX_CRED` 55.
- [x] Optativas: rutas `6.° → 7.°` en ISC, catálogo plano en IA y LCD.
- [x] `nombres.csv` como fuente de los nombres legibles y del orden del plan.
- [x] Verificado en preview: las 3 carreras cargan sin errores de consola, con screenshot.
- [x] Maestros: la lista salía de `roster.js` (solo ISC), así que en IA y LCD mostraba profes de ISC. Ahora sale de las ofertas de **las tres carreras** + roster, sin separar, con badges de carrera; la ficha muestra el horario completo del maestro. De paso, el cruce por nombre se volvió insensible a acentos: 25 maestros con acento salían duplicados, sin calificación y con el horario vacío (el caso `HURTADO AVILÉS GABRIEL`).
- [x] Modo Auto revisado en las tres carreras. La cascada y la ventana de turno ya eran genéricas; lo que estaba mal era la seriación: `auto.js` tenía su propia copia de la de ISC, por nombre, así que en IA y LCD aplicaba reglas de ISC donde el nombre coincidía e ignoraba las suyas. Ahora lee `PLAN_ACTIVO.seriacion` por clave. Probado en blanco: ISC 6 materias/51 cr, IA 6/51, LCD 7/54, todas con grupos de su carrera y bajo el tope de 55.
- [ ] `SUBJECT_DIFFICULTY` es de ISC y se reusa por nombre normalizado: en IA/LCD aparece en las materias que comparten nombre y queda vacía en el resto.

### Fase 3.5 — Calendario académico
- [x] `calendario.csv` transcrito a mano del PDF del IPN (las fechas son colores, no texto) → `calendario.js` vía `build-data.ps1`. 3 periodos, 48 eventos.
- [x] Franja arriba: periodo, semana N de M, aviso si hoy no hay clase y cuenta regresiva al próximo hito.
- [x] Días inhábiles marcados en la cabecera de la rejilla del horario, con la fecha de cada día de la semana en curso.
- [x] Pestaña **Calendario**: tarjetas de los 3 periodos (la vigente resaltada, con su semana) y la rejilla de 13 meses con los días pintados por tipo de evento, igual que el PDF, más la leyenda.
- [ ] Que `historial.js` derive el periodo vigente del calendario en vez de tenerlo a mano.
- [ ] Marcar las semanas de evaluación (ordinaria, extraordinaria, ETS) en la franja.

### Fase 3.6 — Carga diferida
- [x] `lazy.js`: `cargarDato()` (promesa, un `<script>` por archivo), `prefetchDatos()` y `repintarActiva()`.
- [x] `cupos.js` + `maestros_manual.js` salen de `index.html` y entran por prefetch en cuanto el navegador queda libre; `indexarCupos()` y `loadManualMetrics()` corren al aterrizar y repintan.
- [x] `historial.js` (187 KB) se pide a demanda: al abrir la pestaña Historial o la ficha de un maestro, con placeholder mientras llega.
- [x] **Arranque: 639 KB → 366 KB (−42 %).** Verificado en las tres carreras, las 6 pestañas y la ficha de maestro, 0 errores de consola.

### Fase 3.7 — Página pública (2026-11-03)
El usuario pidió dejar el proyecto listo "como landing page final" y agregar funciones a criterio.

**Portada** (`portada.js`): pantalla de entrada con las cifras reales (3 carreras · 139 materias ·
134 grupos · 665 ofertas · 276 maestros), las tres carreras en tarjetas con sus créditos y grupos
abiertos, y qué puedes hacer. Ninguna cifra está escrita a mano: salen de `PLANES` y `SCHEDULE`.
Se muestra una vez y después solo con 🏠 o la tecla `H`.

**Funciones nuevas**
- [x] **Buscador global** (`buscador.js`, tecla `/` o `Ctrl+K`): materias del plan, maestros de las
      tres carreras y grupos, en una sola caja. El índice se arma al primer uso.
- [x] **Comparador de maestros** (`comparador.js`): todos los que dan una materia, lado a lado, con
      sus tres métricas, grupos, horario y cupo. Marca el mejor calificado y dice cuántos no tienen
      calificación todavía, para no confundir "sin datos" con "malo".
- [x] **Vista de grupo**: desde el buscador, la rejilla semanal completa de `3CM2` y con quién.
- [x] **Tema claro / oscuro** (`tema.js`): sigue al sistema hasta que elijas; se aplica en el
      `<head>` para que no parpadee.
- [x] **Atajos** (`atajos.js`): `1`–`6` pestañas, `/` buscar, `T` tema, `H` portada, `?` ayuda, `Esc`.
- [x] **Compartir horario por enlace** (`compartir.js`): el horario viaja en el fragmento de la URL,
      que no se manda al servidor. Quien lo abre puede verlo o tomarlo. El avance no viaja.
- [x] **Instalable y sin internet** (`sw.js`, `manifest.webmanifest`, `favicon.svg`).
- [x] Meta tags, Open Graph y `theme-color` para cuando se publique.

**Rendimiento**
- [x] La pestaña Maestros pasó de **40,026 a 5,007 nodos**: el `<select>` "+ Materia" de cada fila
      traía las ~140 materias ya puestas (276 × 140 ≈ 38,600 `<option>`) y se reconstruía en cada
      repintado, o sea en cada letra del buscador. Ahora se llena al abrirlo.
- [x] Colores movidos a tokens de `:root`; en `styles.css` ya casi no quedan hex sueltos.
- [ ] `schedule.js` (174 KB) sigue en el arranque: `core.js` lo necesita para `TEACHERS` y la
      portada para sus cifras. Se resuelve con la BD, pidiendo por carrera y semestre.

### Fase 3.8 — Corrección: el Historial se colaba entre carreras (2026-11-03)
Reportado por el usuario: en IA y LCD la pestaña Historial mostraba los grupos de ISC.

- Causa: `historial.js` es 100 % de ISC (780 entradas) y **nadie filtraba por carrera**. El plan,
  las ofertas y los cupos sí filtran; el historial se quedó fuera cuando se hizo multi-carrera.
- [x] Las 780 entradas llevan ahora `carrera:"ISC"` explícito, como manda `CLAUDE.md` §9.
- [x] `carreraDeGrupo()` / `carreraDeOferta()` en `core.js` como respaldo para datos sin campo.
- [x] `historialDe(periodo)` filtra, y el selector de periodo solo lista los que tienen algo de
      la carrera activa.
- [x] Sin datos, la pestaña dice por qué ("Todavía no hay historial de IA; los guardados son de
      ISC") y esconde los selectores, en vez de enseñar los de otra carrera.
- [x] En la ficha del maestro, "Materias por periodo" lleva etiqueta **solo ISC** y explica el
      vacío: un maestro que solo da IA no es un maestro sin clases.

### Fase 3.9 — Materias de maestro: nombre, filtro y orden (2026-11-03)
Las etiquetas verde/roja de cada maestro no decían en ningún lado qué significaban —solo en el
tooltip— y no se podía ni filtrar ni ordenar por ellas.

- [x] Se llaman **Imparte** (verde) y **Ya no** (rojo). Textos centralizados en `MAT_ESTADO`.
- [x] **Leyenda** bajo la barra de herramientas, con las dos etiquetas y la aclaración de que es
      una nota tuya que arranca del registro oficial y vive en este navegador.
- [x] Selector **Materias**: `Todas · Solo las que imparte · Solo las que ya no`. Filtra las
      etiquetas y saca de la lista a los maestros sin ninguna que encaje.
- [x] Tres criterios nuevos en **Ordenar por**: imparte más materias, imparte menos, y más
      materias que ya no da. A igualdad, alfabético, para que la lista no baile.
- [x] El contador de arriba dice qué está contando según el filtro, y la tabla vacía explica el
      porqué en vez de quedarse en blanco.

### Fase 4 — Base de datos (ya NO es "aparte de la app")
**Derogada la regla de "sin backend".** Ver `MEMORIA-FASE-BD.md`, que es el acuerdo completo: Postgres 17 + PHP 8.2/Apache en Docker, esquema OLTP de ~18 tablas, login de alumnos del IPN, reseñas con rúbricas y moderación. **Entrega: primera semana de diciembre de 2026.**

- [x] Esquema propuesto, decisiones cerradas y orden de trabajo → `MEMORIA-FASE-BD.md`.
- [ ] Preguntas al profesor (miércoles): si la entrega exige modelo dimensional, si PHP es obligatorio, si la autenticación debe ser propia, y si pide procedimientos/triggers/vistas. De la primera depende si el esquema es solo OLTP o OLTP + vistas materializadas en estrella.
- [ ] Esquema SQL + seed con los datos de hoy, numerado como en Seismic.
- [ ] `docker compose` con Postgres + pgAdmin + PHP, sin el `trust` ni la contraseña por defecto del ejemplo.
- [ ] Los `.ps1` emiten SQL; los `.js` de datos se generan desde la BD.
- [ ] Login, avance en la BD, y después reseñas.
- [ ] Definir alcance con el equipo Catscoms.

---

## 5. Decisiones cerradas

Todas en `CLAUDE.md` §9. Resumen de las que estaban abiertas:

- **Una sola app** con selector de carrera. ✅
- **Tope de 55 créditos, institucional, igual para las tres carreras.** ✅
- **IA y LCD no tienen slots A/B.** Catálogo plano, disponible en sem 6 y sem 7. ✅
- **`B` = IA, `A` = LCD** (la doc anterior las tenía invertidas). ✅
- Métricas **globales por profesor**; historial **por carrera**; una sola carrera activa por usuario. ✅
- **Manda el gestor de la escuela (`mp.html`)**; el PDF es informativo, salvo para la seriación, que SAES no trae. ✅
- **Grupo número ≥ 6 = recurse.** La rejilla del HTML es la realidad del periodo. ✅
- El título se queda como está ("ISC"), no se cambia a "ESCOM". ✅
- El modelo EER de la Práctica 2 **sí sale de este esquema** (ver §4 Fase 4). ✅

## 6. Reglas que no cambian
- Nunca asumir un cambio sin datos oficiales (SAES/SAESPEED o el PDF del mapa curricular).
- El HTML de `data/` manda. Si se edita → `build.ps1` → `validate.ps1` → preview.
- Ver `CLAUDE.md` para reglas de negocio 1–17, excepciones de grupos y decisiones multi-carrera.

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

### Fase 4 — Práctica 2 de BD (aparte de la app)
- [ ] Modelo EER con las entidades del tracker (Carrera, Materia, Grupo, Oferta, Maestro, Métrica, Cupo, Periodo, Alumno/Avance).
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

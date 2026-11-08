# Memoria — Fase BD, usuarios y reseñas

> Escrito 2026-11-02. **Entrega: primera semana de diciembre de 2026.**
> Esta fase rompe a propósito dos reglas viejas de `CLAUDE.md` §8 ("no backend, no base de datos")
> y de `ROADMAP.md` Fase 4 ("la BD va aparte"). Las dos quedan derogadas por decisión del usuario.
> Nada de aquí está implementado todavía: es el acuerdo antes de escribir código.

---

## 1. El stack sale del proyecto de Seismic

El usuario tiene que entregar algo "del tipo SQL basado en el de Seismic-Data-Visualization-System".
Ese repo usa, y por eso lo copiamos:

| | Seismic | Lo que haremos |
|---|---|---|
| Base | `postgres:17` en Docker | igual |
| Backend | `php:8.2-apache`, PDO + `pdo_pgsql` | igual |
| Carga inicial | `.sql` numerados montados en `/docker-entrypoint-initdb.d/` | igual |
| Front | `.php` sueltos en `src/` | **no**: se queda el vanilla JS que ya existe |
| Esquema | estrella (4 dimensiones + 1 tabla de hechos) | **no**: ver §2 |

**Por qué PHP y no Node:** era mi recomendación inicial por tener un solo lenguaje con el front,
pero si lo que se evalúa es "como el de Seismic", el stack lo manda el profesor, no la elegancia.

**Dos cosas de ese patrón que hay que arreglar, no copiar:**

1. `docker-entrypoint-initdb.d` **solo corre la primera vez**, con el volumen vacío. Sirve para
   sembrar, no para evolucionar. En cuanto haya avance de alumnos reales, cambiar el esquema
   borrando el volumen es perder datos. Hace falta una carpeta `migrations/` aparte.
2. El compose de Seismic trae `POSTGRES_PASSWORD=postgres` y `POSTGRES_HOST_AUTH_METHOD=trust`,
   y publica el puerto de Postgres. Local da igual; **expuesto a un dominio es una BD abierta
   a internet**. Antes de desplegar: contraseña real por variable de entorno, sin `trust`, y
   el puerto de Postgres sin publicar.

---

## 2. El esquema NO puede ser de estrella

Seismic es un **data warehouse**: se carga una vez y solo se consulta. El tracker es lo contrario
— alumnos escribiendo su avance y sus reseñas todo el tiempo. Un esquema dimensional ahí da
anomalías de actualización y no tiene dónde poner una llave foránea de usuario.

**Esto es lo primero que hay que preguntarle al profesor** (§6): si la entrega exige un modelo
dimensional, se hacen los dos — OLTP normalizado para la app, y unas vistas materializadas en
estrella encima para la parte analítica. No es mucho trabajo extra y cubre ambas cosas.

### Tablas (propuesta, ~18)

**Catálogo — lo que viene de ESCOM**

```
carrera              codigo PK (ISC/IA/LCD) · letra · nombre · creditos_totales · max_cred
materia              clave PK (C101/B101/A101) · carrera FK · nombre · nombre_saes · tipo
                     · semestre · creditos · horas_teoria · horas_practica · orden
seriacion            materia FK · requisito FK            (N:M recursiva sobre materia)
especializacion      id PK · carrera FK · nombre · icono   (solo ISC tiene ramas)
rama_materia         especializacion FK · materia FK
periodo              codigo PK (27/1) · carrera FK · inicio · fin · reins_ini · reins_fin
calendario_evento    id PK · inicio · fin · tipo · periodo FK
grupo                codigo PK (6CV3) · carrera FK · semestre · turno · numero · es_recurse
maestro              id PK · nombre_norm UNIQUE · nombre
maestro_metrica      maestro FK PK · calidad · recomiendan · dificultad · link_fuente
oferta               id PK · periodo FK · grupo FK · materia FK · maestro FK · edificio · salon
sesion               oferta FK · dia · hora_ini · hora_fin
cupo                 oferta FK PK · cupo · inscritos · disponibles
```

**Usuario**

```
alumno               id PK · email UNIQUE · nombre · carrera FK · rol (alumno|admin)
                     · creado · ultimo_acceso
avance               alumno FK · materia FK · calif · veces · slot_optativa   (PK compuesta)
inscripcion          alumno FK · oferta FK · tipo (nueva|recurse)             (el horario armado)
```

**Reseñas**

```
resena               id PK · alumno FK · oferta FK · calidad · recomienda · dificultad
                     · calif_obtenida · texto · publica_anonima · creada · editable_hasta
resena_rubrica       resena FK · concepto · porcentaje        (cómo evalúa: examen 60, proyecto 40)
reporte              id PK · resena FK · alumno FK · motivo · estado · resuelto_por FK
```

### Lo que ya sabemos que es trampa, y cómo queda resuelto

- **`grupo + materia` no es llave única.** En IA, `8BM1 TRABAJO TERMINAL II` tiene 3 asesores.
  Por eso `oferta` lleva id propio y el maestro va en la llave natural.
- **Un día del calendario cae en varias cosas** (25 dic es vacaciones *y* descanso obligatorio):
  `calendario_evento` permite solapes y la precedencia se resuelve al consultar.
- **El slot de optativa (A1/B1/A2/B2 o A/B/C/D) vive en `avance`, no en `materia`**: qué slot
  ocupaste es decisión tuya, no propiedad de la materia.
- **Acentos.** `nombre_norm` es la llave de cruce (sin acentos) y `nombre` es para mostrar.
  Es el bug que duplicaba 25 maestros y los dejaba sin calificación.
- **El orden del plan importa**: `materia.orden` reemplaza al orden de filas de `nombres.csv`.
  Los ids `s{sem}-{i}` del front se derivan de ahí, y el avance se indexa por ellos.

---

## 3. Decisiones ya cerradas

| # | Qué | Decisión |
|---|---|---|
| 1 | Backend | PHP 8.2 + Apache, como Seismic |
| 2 | Base | Postgres 17 en Docker, `.sql` numerados en initdb |
| 3 | Front | Sigue vanilla JS, sin framework ni bundler |
| 4 | Fuente de verdad | **Pasa a ser la BD.** El HTML de `data/` queda como insumo de carga |
| 5 | Los `.js` de datos | Se siguen generando, pero **desde SQL**, no desde el HTML |
| 6 | Los `.ps1` | Se quedan como herramienta de Windows del usuario; ahora emiten SQL |
| 7 | CSVs canónicos | Se vuelven tablas, editables con SQL desde pgAdmin |
| 8 | Registro | Solo correo institucional del IPN |
| 9 | Carrera | Una sola activa por usuario, igual que hoy |
| 10 | Admin | El usuario, con rol en `alumno.rol` |
| 11 | Anonimato | Solo frente a otros alumnos. **El admin siempre ve al autor** |
| 12 | Quién reseña | Solo quien cursó esa materia con ese maestro (lo tiene en su `avance`) |
| 13 | Editar / borrar | La propia reseña, dentro de **24 h** |
| 14 | Moderación | Reportes de usuarios + revisión del admin |
| 15 | Despliegue | Docker, en un sitio con dominio. Dónde: sin definir |
| 16 | Escala supuesta | Todos los grupos llenos: **134 grupos × 36 ≈ 4,800 alumnos** |

### Las que respondí yo porque pediste recomendación

- **A qué se ata la reseña:** siempre a la **oferta** (periodo + grupo + materia + maestro).
  Agrupar por maestro para mostrar es un `GROUP BY`; al revés se pierde el contexto y la
  verificación. Además deja responder "¿cómo evalúa en 3CV2 contra 3CV4?".
- **Qué se califica:** los mismos tres ejes de MisProfesores para que sean comparables —
  calidad 0–10, recomienda sí/no (se agrega a %), dificultad 0–6 — más la calificación que
  sacó el alumno y la rúbrica. **Nunca promediar lo de los alumnos con lo de MisProfesores**:
  3 reseñas contra un promedio de 200 opiniones no es el mismo dato. Se muestran lado a lado.
- **La rúbrica es lo que de verdad agrega valor.** MisProfesores no sabe cómo evalúa cada
  profesor; `resena_rubrica` sí. Es la razón para que esta app exista además de aquélla.
- **Respaldos:** `pg_dump` diario a un volumen, y copia fuera del servidor. 7 diarios + 4
  semanales. Y **probar una restauración una vez**, porque un respaldo que nunca se restauró
  no es un respaldo.
- **Dónde viven los datos del usuario:** en el mismo Postgres. No hace falta otro servicio.

---

## 4. Lo que se borró ✅ (hecho el 2026-11-02)

| Qué | Peso | Por qué |
|---|---|---|
| `auditoria/` menos `pdf2png.sh` | 5.1 MB | Evidencia de una auditoría terminada. No la usa nada en runtime. Se conservó `pdf2png.sh`, que es la única forma de leer los PDF del mapa curricular en esta máquina |
| `data/_descartados/` | 87 KB | Muertos por definición |
| `data/*/mapa.png` | 1.1 MB | Se regeneran con `auditoria/pdf2png.sh` |
| `horarios.csv` + `IMG/VESP/horario_completo1.csv` | ~40 KB | Ya no alimentan nada desde que se parsea el HTML |
| `IMG/` completa | 12 MB | Capturas de SAES y scripts de Python de la transcripción original de ISC. Nada del código las lee; la fuente es el HTML de `data/` |

Son 214 archivos y ~18 MB: el árbol pasó de **22 MB a 3.8 MB**. **Siguen en el historial de git
de todos modos**: borrarlos no encoge el `.git` (17 MB), solo el árbol de trabajo. Para
recuperar cualquiera, `git show <commit>:<ruta> > destino`.

Con esto **la única fuente de datos que queda es el HTML oficial de `data/`** más los seis CSV
canónicos. No hay ya dos caminos para el mismo dato, que era el problema de fondo: las capturas
de SAES y el HTML describían lo mismo y podían discrepar sin que nadie se enterara.

Redundancia conceptual que se disuelve sola al pasar a SQL: `roster.js` contra `schedule.js`
(la misma tripleta profe-materia-grupo), `optativas.js` contra `planes.js` (las mismas 28 claves),
la columna `nombre_saes` de `nombres.csv` (copia de `mp.html`), y `SUBJECT_DIFFICULTY` en
`data.js`, que es un `AVG()` escrito a mano.

---

## 5. Carga diferida ✅ (hecha el 2026-11-02)

`index.html` cargaba **639 KB** de JS antes de pintar un pixel. Ahora arranca con **366 KB
(−42 %)**, con `lazy.js` repartiendo lo demás:

- `cupos.js` + `maestros_manual.js` (85 KB) → prefetch en cuanto el navegador queda libre.
  Los usan casi todas las pestañas, Mi avance incluida, así que esperar al clic no tenía sentido.
- `historial.js` (187 KB) → a demanda, al abrir la pestaña Historial o la ficha de un maestro.

Detalles en `CLAUDE.md` §1. Verificado en las tres carreras, las 6 pestañas y la ficha de
maestro: 0 errores de consola, los cupos y las métricas manuales aparecen al aterrizar.

Lo que **no** se pudo diferir: `schedule.js` (174 KB) lo necesita `core.js` al cargar para
armar `TEACHERS`, `NOMBRE_PROF` y `ALL_MATERIAS`, y lo usan las seis pestañas. Esa es la
siguiente ganancia grande y llega sola con la BD: con un backend se pide por carrera y
semestre en vez de mandar las 665 ofertas de las tres carreras a todo el mundo.

---

## 6. Preguntas para el profesor (miércoles)

De estas depende el resto. Van ordenadas por cuánto cambian el plan.

1. **¿La entrega exige un modelo dimensional (estrella), o acepta un OLTP normalizado?**
   La app necesita OLTP. Si pide estrella, se hacen los dos: OLTP para la app + vistas
   materializadas en estrella para la parte analítica. Es la pregunta más importante.
2. **¿PHP + Apache es obligatorio, o solo es el ejemplo?** Si da igual, hay opciones con menos
   fricción; si es requisito, se copia el patrón de Seismic tal cual.
3. **¿La autenticación tiene que ser propia (tabla de usuarios y contraseñas) o se vale
   delegar?** Es lo que más tiempo consume del proyecto. Ver la pregunta 4.
4. **¿`@alumno.ipn.mx` está en Microsoft 365 o en Google Workspace?** No lo sé y cambia todo:
   si es Microsoft, el botón es "Entrar con Microsoft" (Entra ID); si es Google, "Entrar con
   Google". Si la autenticación debe ser propia, hay que montar envío de correo para verificar,
   y eso es un servicio más.
5. **¿Se evalúa el despliegue con dominio, o basta con que corra en `docker compose up`?**
6. **¿Hay requisito de normalización explícito (3FN, BCNF) o de entregar el diagrama EER?**
7. **¿Pide procedimientos almacenados, triggers o vistas?** Si sí, los metemos desde el diseño
   y no pegados al final. Candidatos naturales: trigger que recalcule `cupo.disponibles`,
   vista de avance por alumno, procedimiento que valide el tope de 55 créditos.
8. **¿Tiene que haber datos de prueba o sirven los reales?** Hay 665 ofertas y 276 maestros
   reales; sembrar eso es más vistoso que datos inventados.

---

## 7. Orden de trabajo hasta la primera semana de diciembre

| | Qué | Depende de |
|---|---|---|
| 1 | ~~Limpieza de lo muerto + carga diferida por pestaña~~ ✅ **hecho** | nada |
| 2 | Esquema SQL + seed con los datos de hoy, numerado como Seismic | pregunta 1 y 6 |
| 3 | `docker compose` con Postgres 17 + pgAdmin + PHP | pregunta 2 |
| 4 | Los `.ps1` emiten SQL en vez de `.js`; los `.js` se generan desde la BD | 2 y 3 |
| 5 | Login + avance del alumno en la BD | preguntas 3 y 4 |
| 6 | Reseñas, rúbricas y reportes | 5 |
| 7 | Despliegue con dominio, con las correcciones de seguridad de §1 | pregunta 5 |

Los puntos 1 y 2 se pueden empezar sin esperar al miércoles. El 5 es el que más riesgo tiene
de crecer, y el 6 es lo primero que se recorta si el plazo aprieta.

---

## 8. Lo que sigue pendiente de la fase anterior

No bloquea nada de esto, pero sigue abierto: las calificaciones y links de los **73 maestros**
sin métrica (`PROFES-SIN-METRICA.md`), los **cupos e historial de IA y LCD**, y revisar los
nombres de materias de esas dos carreras en `nombres.csv`, que los generé yo.

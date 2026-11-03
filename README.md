# Tracker académico ISC — ESCOM-IPN

Aplicación web para llevar el avance en el plan de estudios de **Ingeniería en
Sistemas Computacionales** (ESCOM, IPN): registrar calificaciones, consultar
métricas de profesores, explorar optativas por especialización y armar el
horario de reinscripción.

**Sin backend, sin framework, sin build.** Vanilla JS puro. Todo tu avance se
guarda únicamente en `localStorage` de tu navegador: nada se envía a ningún
servidor.

---

## Qué incluye

| Pestaña | Qué hace |
|---|---|
| **Mi avance** | Las 50 materias del plan (387 créditos) con barra de progreso continua, calificación por materia y estado derivado automáticamente |
| **Maestros** | 211 maestros listados (202 con métricas de calidad, dificultad y % de recomendación); filtro por turno y 8 criterios de orden |
| **Generar horario** | Rejilla semanal con detección de choques, conteo de créditos (máx. 55), cupos por grupo y modo automático |
| **Optativas** | Las 14 especializaciones con su ruta 6.º → 7.º semestre |
| **Historial** | Horarios oficiales de periodos pasados (2026/2 y 2027/1), solo lectura |

**Modo automático:** completa tu horario sin sobrescribir lo que metiste a
mano. Recorre los semestres de menor a mayor, respeta tu ventana de horario y
el tope de créditos, y busca combinaciones sin horas muertas mediante búsqueda
aleatoria. El botón 🎲 baraja otra opción igual de compacta.

**Exportación:** el horario se descarga como JPG (dibujado en canvas) o XLSX
(armado a mano como ZIP). Sin librerías externas.

---

## Datos

| Conjunto | Registros |
|---|---|
| Plan de estudios | 8 semestres · 50 materias · 387 créditos |
| Ofertas de horario | 350 (187 matutino + 163 vespertino), 0 choques |
| Maestros listados | 211 (202 con métricas) |
| Links de fuente por profesor | 205 |
| Especializaciones (optativas) | 14 |
| Cupos por grupo + materia | 350 |

Los datos viven como literales JavaScript (`const X = [...]`) cargados con
`<script>`. No hay `fetch()` ni peticiones en tiempo de ejecución.

### Procedencia y advertencias

- **Horarios, grupos y cupos** se transcribieron de **SAESPEED** (ESCOM-IPN).
  Son una foto del momento y solo informativos: **la fuente oficial es siempre
  SAESPEED**. Verifica ahí antes de reinscribirte.
- **Las métricas de profesores** (calidad, dificultad, % de recomendación)
  provienen de **[MisProfesores.com](https://www.misprofesores.com)**, un sitio
  público de terceros donde los estudiantes califican de forma anónima. **No
  son juicio, opinión ni evaluación de este proyecto ni de su autor**, y no
  constituyen una valoración profesional. Cada profesor incluye el link a su
  página de origen para que consultes el contexto completo.

Proyecto **no oficial**, sin afiliación con el IPN, ESCOM ni MisProfesores.com.

---

## Correr en local

No necesita instalación ni dependencias. Cualquier servidor estático sirve:

```bash
npx serve .
```

O con el script incluido (Windows):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/serve.ps1
```

Levanta en `http://localhost:8123`.

> También abre con `file://` directamente, porque los datos no se cargan por
> `fetch()`.

---

## Estructura

```
index.html              UI + sistema de pestañas
styles.css              visual

Datos (literales, generados):
  schedule.js           350 ofertas de horario (M + V)
  metrics.js            métricas de 202 profesores
  roster.js             mapeo profesor → materia (resuelve OPTATIVA A1/B1)
  cupos.js              cupo / inscritos / disponibles por grupo+materia
  maestros_manual.js    links de fuente por profesor
  optativas.js          14 especializaciones y sus materias
  historial.js          horarios oficiales de periodos pasados

App (modularizada; el orden de carga en index.html importa):
  data.js               plan de estudios, constantes, clave de localStorage
  core.js               estado, helpers, normalización
  avance.js             pestaña Mi avance
  maestros.js           pestaña Maestros
  horario.js            rejilla y validación de horario
  optativas-ui.js       pestaña Optativas
  auto.js               generación automática de horario
  export.js             exportar JPG (canvas) y XLSX (ZIP a mano)
  historial-ui.js       pestaña Historial
  init.js               arranque y pestañas

Fuentes canónicas (editables a mano):
  horarios.csv                    horarios matutino
  horarios_vespertino.csv         horarios vespertino
  AESTR_CORREGIDO_3.csv           calificaciones de profesores (matutino)
  AESTR_VESPERTINO_plantilla.csv  calificaciones de profesores (vespertino)
  maestros_manual.csv             nombre → link de MisProfesores
  cupos.csv / cupos_2026_2.csv    cupos por grupo+materia

Scripts:
  build.ps1             regenera los .js derivados desde los CSV
  validate.ps1          audita choques, horas, profesores y links
```

Los `.js` de datos son **artefactos derivados**. Si corriges un CSV, hay que
regenerar: `build.ps1` y luego `validate.ps1`.

### Convención de grupos

`[1-8][A-Z][MV][1-9]` — semestre, carrera (`C`=ISC, `A`=IA, `B`=Cs. Datos),
turno (`M`/`V`) y número de grupo. Ejemplo: `6CV3` = 6.º semestre, ISC,
vespertino, grupo 3.

---

## Publicación

Publicado en **https://pablo140706.github.io/iscweb/** con GitHub Pages desde la raíz de `main`. Todas las
rutas son relativas, así que funciona igual en local, en `file://` y en un
subdirectorio de Pages. El archivo `.nojekyll` desactiva el procesado de
Jekyll.

El repositorio contiene solo lo necesario para correr y mantener el proyecto:
los archivos de la app, los CSV canónicos y los scripts de build. El material
fuente del que se transcribieron los datos (capturas de SAESPEED) ya no forma
parte del proyecto.

---

## Licencia

Código bajo [MIT](LICENSE). Los datos tienen su propia procedencia — ver la
nota en `LICENSE` y la sección de arriba.

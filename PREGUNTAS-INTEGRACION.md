# Integración multi-carrera — estado de las preguntas

> Actualizado 2026-11-02. **Las 43 preguntas de la primera ronda están cerradas.**
> Dónde quedó cada cosa:
> - Decisiones de diseño → `CLAUDE.md` §9
> - Orden de trabajo → `ROADMAP.md` §4
> - Planes de IA y LCD para validar → `PLANES-IA-LCD.md`
> - Profes sin calificación → `PROFES-SIN-METRICA.md`

---

## Lo único abierto

### Seriación de IA y LCD

Los mapas oficiales de IA y LCD **no dibujan flechas de prerrequisito** (el de ISC sí, con ~21), y SAES tampoco trae ese dato. O sea: no existe seriación oficial para esas dos carreras.

- **Opción A — sin seriación.** Modo Auto no bloquea por prerrequisito en IA/LCD; la cascada multi-semestre ya ordena por semestre. Cero riesgo.
- **Opción B — propuesta mía, validada por ti.** 12 pares para IA y 11 para LCD, armados por nombre. La tabla está en `PLANES-IA-LCD.md`.

---

## Cerradas en la segunda ronda

| # | Pregunta | Respuesta |
|---|---|---|
| 1.1 | ¿La rejilla de grupos es la realidad? | Sí. Se toma directo del HTML, tal cual está. Grupo número ≥ 6 = recurse. |
| 1.2 | ¿El modelo EER sale de este esquema? | Sí. Diagrama entregado; 14 entidades con `OFERTA` al centro. |
| 1.3 | ¿Tope de créditos por carrera o institucional? | **Institucional: 55 para las tres.** |
| 1.4 | ¿Cambiar el branding a "ESCOM"? | No, se queda como está. |

## Datos que vas a traer

| Qué | Dónde se integra | Mientras no esté |
|---|---|---|
| Calificaciones de **73 profes** (`PROFES-SIN-METRICA.md`) | `metrics.js` | se muestran sin métrica |
| Links de MisProfesores de **65 profes** | `maestros_manual.csv` | ficha sin link de fuente |
| **Cupos de IA y LCD** | `cupos.csv` → `cupos.js` | ofertas sin badge de cupo |
| **Historial de periodos** de IA y LCD | `historial.js` | solo ISC tiene historial |

## Correcciones que voy a aplicar al parsear

| Qué | Dónde |
|---|---|
| Bloque de 7.º semestre duplicado (`B701`–`B703`, `B740`–`B753`) | `data/ia/mp.html` |
| `1CM4` Análisis vectorial Lun `10:00-12:00` → `10:30-12:00` | `data/isc/horario-m.html` |
| `1BV2`, `2AV2`, `4AV1` con `13:30-16:30` → dos bloques (`13:30-15:00` + `15:00-16:30`) | horarios de IA y LCD |

// ============================================================
//  PESTAÑA 5 · HISTORIAL DE HORARIOS (solo lectura)
//  Muestra los horarios oficiales de periodos pasados por grupo,
//  con la misma rejilla semanal del resto de la app.
// ============================================================
const histPeriodoEl = document.getElementById("histPeriodo");
const histGrupoEl = document.getElementById("histGrupo");
const histGridEl = document.getElementById("histGrid");
const histToolbarEl = document.getElementById("histToolbar");

// Ofertas de un periodo que son de la carrera activa.
//
// Sin este filtro, en IA y LCD la pestaña mostraba los grupos de ISC: el
// historial es 100 % de ISC y nadie estaba separando por carrera. Las ofertas
// traen campo `carrera`; carreraDeOferta() lo deduce del grupo si falta.
function historialDe(periodo) {
  return (HISTORIAL[periodo] || []).filter((e) => carreraDeOferta(e) === CARRERA);
}

// Solo los periodos que tienen algo DE ESTA CARRERA
function historialPeriodos() {
  if (typeof HISTORIAL === "undefined" || !HISTORIAL) return [];
  return Object.keys(HISTORIAL).filter((p) => historialDe(p).length > 0);
}

function historialGrupos(periodo) {
  const set = new Set(historialDe(periodo).map((e) => e.grupo));
  // orden natural: semestre, turno (M antes que V), número
  return [...set].sort((a, b) => {
    const pa = a.match(/^(\d)([A-Z])([A-Z])(\d+)$/), pb = b.match(/^(\d)([A-Z])([A-Z])(\d+)$/);
    if (!pa || !pb) return a.localeCompare(b);
    return (pa[1] - pb[1]) || pa[3].localeCompare(pb[3]) || (parseInt(pa[4]) - parseInt(pb[4]));
  });
}

function renderHistorial() {
  // historial.js son 190 KB y solo los usa esta pestaña: se piden al abrirla.
  if (typeof HISTORIAL === "undefined") {
    histGridEl.innerHTML = `<div class="drop-empty">Cargando historial…</div>`;
    cargarDato("historial.js")
      .then(renderHistorial)
      .catch(() => {
        histGridEl.innerHTML = `<div class="drop-empty">No se pudo cargar el historial.</div>`;
      });
    return;
  }
  const periodos = historialPeriodos();
  if (!periodos.length) {
    // Decir POR QUÉ está vacío. Antes esto no pasaba nunca porque se colaba
    // el historial de ISC en las tres carreras.
    const conDatos = Object.keys(HISTORIAL || {}).length
      ? Object.values(HISTORIAL).flat().map(carreraDeOferta).filter(Boolean)
      : [];
    const otras = [...new Set(conDatos)].filter((c) => c !== CARRERA);
    histToolbarEl.hidden = true;
    histGridEl.innerHTML = `<div class="drop-empty big">
        Todavía no hay historial de <b>${esc(CARRERA)}</b>.<br>
        ${otras.length
          ? `Los periodos pasados que hay guardados son de ${esc(otras.join(" y "))}.
             Los de ${esc(CARRERA)} están pendientes de conseguirse.`
          : "No hay periodos guardados."}
      </div>`;
    return;
  }
  histToolbarEl.hidden = false;

  // Las listas se repueblan si la carrera cambió desde el último pintado:
  // los grupos de una carrera no valen para otra.
  if (!histPeriodoEl.options.length || histPeriodoEl.dataset.car !== CARRERA) {
    histPeriodoEl.dataset.car = CARRERA;
    histPeriodoEl.innerHTML = periodos.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
  }
  const periodo = periodos.includes(histPeriodoEl.value) ? histPeriodoEl.value : periodos[0];
  histPeriodoEl.value = periodo;

  // poblar grupos del periodo (conserva selección si sigue existiendo)
  const grupos = historialGrupos(periodo);
  const prev = histGrupoEl.value;
  histGrupoEl.innerHTML = grupos.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
  if (grupos.includes(prev)) histGrupoEl.value = prev;

  const grupo = histGrupoEl.value || grupos[0];
  const ofertas = historialDe(periodo).filter((e) => e.grupo === grupo);

  if (!ofertas.length) {
    histGridEl.innerHTML = `<div class="drop-empty">Sin materias registradas para ${esc(grupo)} en ${esc(periodo)}.</div>`;
    return;
  }

  // cupo del periodo: histórico si está en CUPOS_HIST, si no el vigente
  const cupoPeriodo = (o) => cuposHistIndex[periodo]
    ? cupoHistDe(o.grupo, o.materia, periodo)
    : cupoDe(o.grupo, o.materia);

  // lista de materias + rejilla (reutiliza la rejilla de la ficha del maestro)
  const lista = ofertas.map((o) => {
    const c = cupoPeriodo(o);
    return `
    <div class="hist-item">
      <b>${esc(titleCase(o.materia))}</b>
      <span class="hist-prof">${esc(o.profesor || "")}</span>
      <span class="hist-meta">Ed. ${esc(String(o.edificio || "—"))} · Salón ${esc(String(o.salon || "—"))}${c ? " · " + cupoHistTag(c) : ""}</span>
    </div>`;
  }).join("");

  histGridEl.innerHTML = `
    <div class="hist-head-row">
      <h3 class="pd-section">${esc(grupo)} · ${esc(periodo)} · ${ofertas.length} materias</h3>
    </div>
    ${renderProfSchedGrid(ofertas)}
    <h3 class="pd-section" style="margin-top:22px">Materias y profesores</h3>
    <div class="hist-list">${lista}</div>
  `;
}

histPeriodoEl.addEventListener("change", renderHistorial);
histGrupoEl.addEventListener("change", renderHistorial);

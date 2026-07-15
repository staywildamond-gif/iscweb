// ============================================================
//  PESTAÑA 5 · HISTORIAL DE HORARIOS (solo lectura)
//  Muestra los horarios oficiales de periodos pasados por grupo,
//  con la misma rejilla semanal del resto de la app.
// ============================================================
const histPeriodoEl = document.getElementById("histPeriodo");
const histGrupoEl = document.getElementById("histGrupo");
const histGridEl = document.getElementById("histGrid");

function historialPeriodos() {
  return (typeof HISTORIAL !== "undefined" && HISTORIAL) ? Object.keys(HISTORIAL) : [];
}

function historialGrupos(periodo) {
  const sched = (HISTORIAL[periodo] || []);
  const set = new Set(sched.map((e) => e.grupo));
  // orden natural: semestre, turno (M antes que V), número
  return [...set].sort((a, b) => {
    const pa = a.match(/^(\d)([A-Z])([A-Z])(\d+)$/), pb = b.match(/^(\d)([A-Z])([A-Z])(\d+)$/);
    if (!pa || !pb) return a.localeCompare(b);
    return (pa[1] - pb[1]) || pa[3].localeCompare(pb[3]) || (parseInt(pa[4]) - parseInt(pb[4]));
  });
}

function renderHistorial() {
  const periodos = historialPeriodos();
  if (!periodos.length) {
    histGridEl.innerHTML = `<div class="drop-empty">No hay periodos guardados en el historial.</div>`;
    return;
  }
  // poblar periodo si está vacío
  if (!histPeriodoEl.options.length) {
    histPeriodoEl.innerHTML = periodos.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
  }
  const periodo = histPeriodoEl.value || periodos[0];

  // poblar grupos del periodo (conserva selección si sigue existiendo)
  const grupos = historialGrupos(periodo);
  const prev = histGrupoEl.value;
  histGrupoEl.innerHTML = grupos.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
  if (grupos.includes(prev)) histGrupoEl.value = prev;

  const grupo = histGrupoEl.value || grupos[0];
  const ofertas = (HISTORIAL[periodo] || []).filter((e) => e.grupo === grupo);

  if (!ofertas.length) {
    histGridEl.innerHTML = `<div class="drop-empty">Sin materias registradas para ${esc(grupo)} en ${esc(periodo)}.</div>`;
    return;
  }

  // lista de materias + rejilla (reutiliza la rejilla de la ficha del maestro)
  const lista = ofertas.map((o) => `
    <div class="hist-item">
      <b>${esc(titleCase(o.materia))}</b>
      <span class="hist-prof">${esc(o.profesor || "")}</span>
      <span class="hist-meta">Ed. ${esc(String(o.edificio || "—"))} · Salón ${esc(String(o.salon || "—"))}</span>
    </div>`).join("");

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

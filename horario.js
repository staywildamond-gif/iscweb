// ============================================================
//  PESTAÑA 3 · GENERAR HORARIO
// ============================================================
const horarioListEl = document.getElementById("horarioList");
const credSummaryEl = document.getElementById("credSummary");

function renderHorario() {
  const inscritos = state.horario.reduce((a, h) => a + h.cred, 0);
  const credBloq = creditosBloqueados();
  const nMaterias = state.horario.length;
  const maxEfectivo = MAX_CRED - credBloq;
  const over = inscritos > maxEfectivo;

  // P12: promedios de calidad y dificultad (simples, sin ponderar)
  let sumCal = 0, sumDif = 0, nCal = 0, nDif = 0;
  state.horario.forEach((h) => {
    const m = getMetric(h.maestro);
    if (m.calidad !== "" && m.calidad != null) { sumCal += Number(m.calidad); nCal++; }
    if (m.dificultad !== "" && m.dificultad != null) { sumDif += Number(m.dificultad); nDif++; }
  });
  const promCal = nCal ? (sumCal / nCal) : null;
  const promDif = nDif ? (sumDif / nDif) : null;

  credSummaryEl.innerHTML = `
    <div class="cs-card ${over ? "danger" : ""}">
      <div class="cs-val">${fmt(inscritos)} <span class="cs-max">/ ${fmt(maxEfectivo)}</span></div>
      <div class="cs-label">Créditos inscritos${credBloq ? ` <span class="cs-bloq">(${fmt(credBloq)} cr bloq.)</span>` : ""}</div>
    </div>
    <div class="cs-card">
      <div class="cs-val">${nMaterias}</div>
      <div class="cs-label">Materias inscritas</div>
    </div>
    <div class="cs-card">
      <div class="cs-val ${promCal != null ? "color-" + metricColor(promCal.toFixed(1), "cal") : ""}">${promCal != null ? promCal.toFixed(1) : "—"}</div>
      <div class="cs-label">Calidad promedio</div>
    </div>
    <div class="cs-card">
      <div class="cs-val ${promDif != null ? "color-" + metricColor(promDif.toFixed(1), "dif") : ""}">${promDif != null ? promDif.toFixed(1) : "—"}</div>
      <div class="cs-label">Dificultad promedio</div>
    </div>`;

  if (over) {
    const warn = document.createElement("div");
    warn.className = "over-warn";
    warn.textContent = `⚠️ Llevas ${fmt(inscritos)} créditos inscritos; tu máximo efectivo es ${fmt(maxEfectivo)}${credBloq ? ` (55 − ${fmt(credBloq)} bloqueados)` : ""}. Quita ${fmt(inscritos - maxEfectivo)} créditos.`;
    credSummaryEl.appendChild(warn);
  }

  // Rejilla semanal
  document.getElementById("horarioTable").innerHTML = renderHorarioTable();

  if (state.horario.length === 0) {
    horarioListEl.innerHTML = `<div class="drop-empty big">Tu horario está vacío.<br>Ve a <b>Mi avance</b>, abre <b>Maestros</b> en una materia pendiente o reprobada y pulsa <b>+ Horario</b>.</div>`;
    return;
  }

  // ¿Quiénes chocan con quién?
  const conflictWith = state.horario.map(() => new Set());
  for (let a = 0; a < state.horario.length; a++) {
    for (let b = a + 1; b < state.horario.length; b++) {
      if (itemsConflict(state.horario[a], state.horario[b])) {
        conflictWith[a].add(b);
        conflictWith[b].add(a);
      }
    }
  }
  const totalConflicts = conflictWith.reduce((n, s) => n + s.size, 0) / 2;
  if (totalConflicts > 0) {
    const warn = document.createElement("div");
    warn.className = "over-warn";
    warn.textContent = `⚠️ Hay ${totalConflicts} choque${totalConflicts === 1 ? "" : "s"} de horario. Las materias en rojo coinciden en el mismo día y hora.`;
    credSummaryEl.appendChild(warn);
  }

  horarioListEl.innerHTML = state.horario.map((h, idx) => {
    const m = getMetric(h.maestro);
    const hasConflict = conflictWith[idx].size > 0;
    const aula = h.edificio ? `Ed. ${esc(h.edificio)} · Salón ${esc(h.salon)}` : "";
    return `
    <div class="hcard ${hasConflict ? "conflict" : ""}">
      <div class="hcard-info">
        <div class="hcard-top">
          <span class="hcard-mat">${esc(h.materia)}</span>
          <span class="tipo-tag ${h.tipo}">${h.tipo === "recurse" ? "Recursamiento" : "Nueva"}</span>
          <span class="hcard-cred">${fmt(h.cred)} cr</span>
          ${hasConflict ? `<span class="conflict-tag">⚠ Choque</span>` : ""}
        </div>
        <div class="hcard-prof"><a href="#" class="prof-link" data-prof="${esc(h.maestro)}">${esc(h.maestro)}</a> · <span class="hcard-grupo">${esc(h.grupo || "")}${aula ? " · " + aula : ""}</span></div>
        ${h.sesiones && h.sesiones.length ? `<div class="hcard-ses">${esc(sesionesText(h.sesiones))}</div>` : ""}
        ${miniMetrics(m)}
      </div>
      <button class="hdel" data-idx="${idx}" title="Quitar del horario">✕</button>
    </div>`;
  }).join("");

  horarioListEl.querySelectorAll(".prof-link").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); showProfDetail(a.dataset.prof); };
  });

  horarioListEl.querySelectorAll(".hdel").forEach((btn) => {
    btn.onclick = () => {
      state.horario.splice(parseInt(btn.dataset.idx), 1);
      save();
      renderHorario();
      // refrescar botones del plan si el drop está abierto
      planEl.querySelectorAll(".drop.open").forEach((d) => {
        const subj = d.closest(".subject");
        const [, s, i] = subj.dataset.id.match(/^s(\d+)-(\d+)$/).map(Number);
        renderDrop(d, s, i);
      });
    };
  });
}

function fmt(n) { return n % 1 ? n.toFixed(1) : String(n); }

// Acorta el nombre de la materia para la celda de la rejilla
function shortMat(s) {
  return s.replace(/^Optativa /i, "Opt. ");
}

// Genera la rejilla semanal del horario
function renderHorarioTable() {
  if (state.horario.length === 0) return "";

  // Mapear materias a color (estable por sid)
  const colorOf = new Map();
  state.horario.forEach((h) => {
    if (!colorOf.has(h.sid)) {
      colorOf.set(h.sid, SCHED_COLORS[colorOf.size % SCHED_COLORS.length]);
    }
  });

  // Bloques ocupados
  const blockIdx = (ini) => TIME_BLOCKS.findIndex((b) => b.ini === ini);
  const occupied = new Set();
  state.horario.forEach((h) =>
    (h.sesiones || []).forEach((s) => {
      const k = blockIdx(s.ini);
      if (k >= 0) occupied.add(k);
    })
  );
  if (occupied.size === 0) return "";

  const minIdx = Math.min(...occupied);
  const maxIdx = Math.max(...occupied);

  let html = `<table class="sched-table"><thead><tr>
    <th class="sched-hora">Hora</th>
    ${DIAS.map((d) => `<th>${d}</th>`).join("")}
  </tr></thead><tbody>`;

  for (let i = minIdx; i <= maxIdx; i++) {
    const b = TIME_BLOCKS[i];
    html += `<tr><th class="sched-hora">${b.ini}<br>${b.fin}</th>`;
    DIAS.forEach((d) => {
      const items = state.horario.filter((h) =>
        (h.sesiones || []).some((s) => s.dia === d && s.ini === b.ini)
      );
      const conflict = items.length > 1;
      if (items.length === 0) {
        html += `<td class="sched-empty"></td>`;
      } else {
        const inner = items
          .map((h) => {
            const c = colorOf.get(h.sid);
            return `<div class="sched-cell" style="background:${c.bg};color:${c.fg};border-color:${c.bd}" title="${esc(h.materia)} · ${esc(h.maestro)}">
              <div class="sched-mat">${esc(shortMat(h.materia))}</div>
              <div class="sched-meta">${esc(h.grupo || "")}${h.salon ? " · S." + esc(h.salon) : ""}</div>
              ${cupoBadge(h.grupo, h.matReal || h.materia)}
            </div>`;
          })
          .join("");
        html += `<td class="${conflict ? "sched-conflict" : ""}">${inner}</td>`;
      }
    });
    html += `</tr>`;
    // Receso matutino después del bloque 08:30–10:00
    if (b.ini === "08:30" && maxIdx > i) {
      html += `<tr class="sched-receso"><td colspan="${DIAS.length + 1}">☕ Receso 10:00 – 10:30</td></tr>`;
    }
    // Receso vespertino después del bloque 16:30–18:00
    if (b.ini === "16:30" && maxIdx > i) {
      html += `<tr class="sched-receso"><td colspan="${DIAS.length + 1}">☕ Receso 18:00 – 18:30</td></tr>`;
    }
  }

  html += `</tbody></table>`;
  return html;
}


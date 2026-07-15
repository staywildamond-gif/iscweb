// ============================================================
//  PESTAÑAS
// ============================================================
const tabsEl = document.getElementById("tabs");
tabsEl.querySelectorAll(".tab").forEach((btn) => {
  btn.onclick = () => {
    tabsEl.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tabpane").forEach((p) => {
      p.classList.toggle("active", p.id === "pane-" + tab);
    });
    if (tab === "plan") render();
    if (tab === "maestros") renderProfs();
    if (tab === "horario") renderHorario();
    if (tab === "optativas") renderOptativas();
    if (tab === "historial") renderHistorial();
  };
});

// ============================================================
//  PESTAÑA 1 · AVANCE
// ============================================================
const chipDefs = [
  ["todas", "Todas"], ["aprobada", "Aprobadas"],
  ["reprobada", "Reprobadas"], ["pendiente", "Pendientes"],
];
let filter = "todas";
const chipsEl = document.getElementById("chips");
chipDefs.forEach(([k, label]) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.dataset.k = k;
  b.setAttribute("aria-pressed", k === "todas");
  b.innerHTML = `<span class="dot ${k}"></span>${label} <span class="n num" data-c="${k}">0</span>`;
  b.onclick = () => { filter = k; render(); };
  chipsEl.appendChild(b);
});

const planEl = document.getElementById("plan");

PLAN.forEach((blk, s) => {
  const sec = document.createElement("section");
  sec.className = "sem";
  sec.dataset.sem = s;
  const total = blk.materias.reduce((a, m) => a + m[1], 0);
  sec.innerHTML = `
    <div class="semhead">
      <span class="semtitle">${blk.sem}</span>
      <span class="semmeta">
        <span><b class="semOk">0</b>/${blk.materias.length} aprobadas</span>
        <span class="minibar"><i class="semFill"></i></span>
        <span><b>${total}</b> cr</span>
      </span>
    </div>
    <div class="rows"></div>`;
  const rowsEl = sec.querySelector(".rows");

  blk.materias.forEach(([name, cred], i) => {
    const id = idOf(s, i);
    const rec = getSub(id, name);
    const isOpt = !!OPT_SLOTS[id];

    const subj = document.createElement("div");
    subj.className = "subject";
    subj.dataset.id = id;

    subj.innerHTML = `
      <div class="row">
        <span class="name">${esc(rec.name)}${isOpt ? `<span class="opttag">${OPT_SLOTS[id].label}</span>` : ""}${difBadge(name)}</span>
        <span class="cred">${cred}</span>
        <div class="row-controls">
          <select class="veces" aria-label="Veces cursada de ${esc(name)}">
            <option value="1">1ª vez</option>
            <option value="2">2ª (recurse)</option>
          </select>
          <input class="calif" type="number" min="0" max="10" step="1" placeholder="Cal"
                 value="${esc(rec.calif)}" aria-label="Calificación de ${esc(name)}">
          <span class="status-badge" data-st="${rec.status}" data-blocked="${rec.status === "reprobada" && rec.veces >= 2 ? "1" : "0"}" data-recurse="${esEnRecurse(rec) ? "1" : "0"}" data-inscrita="${rec.status === "pendiente" && estaInscrita(id) ? "1" : "0"}">${statusBadgeText(rec, estaInscrita(id))}</span>
          <button class="profsBtn" type="button">Maestros <span class="caret">▾</span></button>
        </div>
      </div>
      <div class="drop"></div>`;

    const vecesSel = subj.querySelector("select.veces");
    const calif = subj.querySelector(".calif");
    const badge = subj.querySelector(".status-badge");
    const profsBtn = subj.querySelector(".profsBtn");
    const drop = subj.querySelector(".drop");

    vecesSel.value = String(rec.veces);
    applyRowMode(subj, rec);

    vecesSel.onchange = () => {
      const newVeces = Number(vecesSel.value);
      setSub(id, { veces: newVeces });
      rec.veces = newVeces;
      rec.status = deriveStatus(rec.calif);
      applyRowMode(subj, rec);
      // Si quedó bloqueada (reprobada + veces=2), quitar del horario
      if (!canInscribir(rec)) {
        const antes = state.horario.length;
        state.horario = state.horario.filter((h) => h.sid !== id);
        if (state.horario.length !== antes) save();
        drop.classList.remove("open");
      }
      render();
    };

    calif.onchange = () => {
      const raw = calif.value.trim();
      if (raw === "") {
        calif.value = "";
        setSub(id, { calif: "" });
        rec.calif = ""; rec.status = "pendiente";
        applyRowMode(subj, rec);
        render();
        return;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 10) {
        alert("Error: la calificación debe ser un entero del 0 al 10.");
        calif.value = rec.calif;
        return;
      }
      const v = String(n);
      calif.value = v;
      setSub(id, { calif: v });
      rec.calif = v;
      rec.status = deriveStatus(v);
      applyRowMode(subj, rec);
      // P1: al quedar aprobada → quitar del horario
      if (rec.status === "aprobada") {
        const antes = state.horario.length;
        state.horario = state.horario.filter((h) => h.sid !== id);
        if (state.horario.length !== antes) save();
        drop.classList.remove("open");
      }
      // Si reprobada + veces=2 → bloqueada, quitar del horario
      if (!canInscribir(rec)) {
        const antes = state.horario.length;
        state.horario = state.horario.filter((h) => h.sid !== id);
        if (state.horario.length !== antes) save();
        drop.classList.remove("open");
      }
      render();
    };

    profsBtn.onclick = () => {
      const willOpen = !drop.classList.contains("open");
      if (willOpen) {
        renderDrop(drop, s, i);
        drop.classList.add("open");
        profsBtn.classList.add("active");
      } else {
        drop.classList.remove("open");
        profsBtn.classList.remove("active");
      }
    };

    rowsEl.appendChild(subj);
  });

  planEl.appendChild(sec);
});

// Muestra calif (aprobada/reprobada) u oculta; el botón Maestros aparece en pendiente y reprobada
function applyRowMode(subj, rec) {
  const id = subj.dataset.id;
  const inscrita = rec.status === "pendiente" && estaInscrita(id);
  const profsBtn = subj.querySelector(".profsBtn");
  const badge = subj.querySelector(".status-badge");
  const isBlocked = rec.status === "reprobada" && rec.veces >= 2;
  badge.dataset.st = rec.status;
  badge.dataset.blocked = isBlocked ? "1" : "0";
  badge.dataset.recurse = esEnRecurse(rec) ? "1" : "0";
  badge.dataset.inscrita = inscrita ? "1" : "0";
  badge.textContent = statusBadgeText(rec, inscrita);
  // Profes solo visible si se puede inscribir
  const inscribible = canInscribir(rec);
  profsBtn.classList.toggle("hidden", !inscribible);
  if (!inscribible) {
    const drop = subj.querySelector(".drop");
    drop.classList.remove("open");
    profsBtn.classList.remove("active");
  }
}

// Despliega la lista de ofertas reales (SCHEDULE) con días/horas, salón y métricas
function renderDrop(drop, s, i) {
  const id = idOf(s, i);
  const list = scheduleFor(s, i);
  const cred = PLAN[s].materias[i][1];
  const isOpt = !!OPT_SLOTS[id];

  if (list.length === 0) {
    drop.innerHTML = `<div class="drop-empty">No hay grupos abiertos este semestre para esta materia.</div>`;
    return;
  }

  drop.innerHTML = `
    <div class="drop-head">${list.length} ofert${list.length === 1 ? "a" : "as"} este semestre · elige una para sumarla a tu horario</div>
    <div class="drop-list">
      ${list.map((e, k) => {
        const m = getMetric(e.profesor);
        const inH = state.horario.some(
          (h) => h.sid === id && h.maestro === e.profesor && (h.grupo || "") === e.grupo
        );
        const rama = e.materia.includes("|") ? e.materia.split("|")[0].trim() : "";
        const turno = turnoDeGrupo(e.grupo);
        const turnoChip = turno === "V"
          ? `<span class="tchip tv">🌙 Vesp</span>`
          : `<span class="tchip tm">☀️ Mat</span>`;
        return `
        <div class="tcard">
          <div class="tcard-main">
            <div class="tcard-name"><a href="#" class="prof-link" data-prof="${esc(e.profesor)}">${esc(e.profesor)}</a> ${turnoChip}</div>
            <div class="tcard-grupo">${esc(e.grupo)} · Ed. ${esc(e.edificio)} · Salón ${esc(e.salon)}${rama ? ` · <b>${esc(titleCase(rama))}</b>` : ""} ${cupoBadge(e.grupo, e.materia)}</div>
            <div class="tcard-sesiones">${esc(sesionesText(e.sesiones))}</div>
            ${miniMetrics(m)}
          </div>
          <button class="addBtn ${inH ? "added" : ""}" data-k="${k}">
            ${inH ? "✓ En horario" : "+ Horario"}
          </button>
        </div>`;
      }).join("")}
    </div>`;

  drop.querySelectorAll(".prof-link").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); showProfDetail(a.dataset.prof); };
  });

  drop.querySelectorAll(".addBtn").forEach((btn) => {
    btn.onclick = () => {
      const entry = list[parseInt(btn.dataset.k)];
      const adding = !state.horario.some(
        (h) => h.sid === id && h.maestro === entry.profesor && (h.grupo || "") === entry.grupo
      );

      // Si es optativa y se está agregando, fija el nombre con la rama
      if (isOpt && adding) {
        const rama = entry.materia.includes("|") ? entry.materia.split("|")[0].trim() : "";
        if (rama) {
          setSub(id, { name: "Optativa " + OPT_SLOTS[id].label + " · " + titleCase(rama) });
          const nameEl = drop.closest(".subject").querySelector(".name");
          nameEl.innerHTML = esc(getSub(id, "").name) + `<span class="opttag">${OPT_SLOTS[id].label}</span>`;
        }
      }

      const subRec = getSub(id, "");
      toggleHorario({
        sid: id,
        materia: subjectName(s, i),
        matReal: entry.materia,   // materia del schedule (con rama) para cruzar cupos
        maestro: entry.profesor,
        grupo: entry.grupo,
        edificio: entry.edificio,
        salon: entry.salon,
        sesiones: entry.sesiones,
        cred: cred,
        tipo: subRec.veces >= 2 || subRec.status === "reprobada" ? "recurse" : "nueva",
      }, btn);
    };
  });
}

function miniMetrics(m) {
  return `<div class="tcard-metrics">
    ${metricCell(m.calidad, "cal")}
    ${metricCell(m.recomiendan, "rec")}
    ${metricCell(m.dificultad, "dif")}
  </div>`;
}

// ============================================================
//  HORARIO (estado compartido)
// ============================================================
function toggleHorario(item, btn) {
  const idx = state.horario.findIndex(
    (h) =>
      h.sid === item.sid &&
      h.maestro === item.maestro &&
      (h.grupo || "") === (item.grupo || "")
  );
  if (idx >= 0) {
    state.horario.splice(idx, 1);
    if (btn) { btn.classList.remove("added"); btn.textContent = "+ Horario"; }
  } else {
    // P13: bloquear materia duplicada (mismo sid con otro grupo/profesor)
    const dup = state.horario.find((h) => h.sid === item.sid);
    if (dup) {
      alert(`Ya tienes "${dup.materia}" en tu horario (con ${dup.maestro}, ${dup.grupo}). Solo puedes inscribir una vez la misma materia.`);
      return;
    }
    state.horario.push(item);
    if (btn) { btn.classList.add("added"); btn.textContent = "✓ En horario"; }
  }
  save();
  // Refrescar el badge de la materia en la pestaña Mi avance (Pendiente ⇄ Inscrita)
  const subj = planEl.querySelector(`.subject[data-id="${item.sid}"]`);
  if (subj) applyRowMode(subj, getSub(item.sid));
}

// ============================================================
//  RENDER PRINCIPAL (avance)
// ============================================================
const ribbon = document.getElementById("ribbon");

function render() {
  const counts = { todas: 0, pendiente: 0, aprobada: 0, reprobada: 0 };
  let creditosOk = 0;
  let sumCalif = 0, nCalif = 0;
  ribbon.innerHTML = "";

  PLAN.forEach((blk, s) => {
    const sec = planEl.querySelector(`.sem[data-sem="${s}"]`);
    let semOk = 0;
    blk.materias.forEach(([name, cred], i) => {
      const id = idOf(s, i);
      const rec = getSub(id, name);
      counts[rec.status]++; counts.todas++;
      if (rec.status === "aprobada") { creditosOk += cred; semOk++; }
      if ((rec.status === "aprobada" || rec.status === "reprobada") && rec.calif !== "") {
        sumCalif += parseFloat(rec.calif); nCalif++;
      }
    });
    sec.querySelector(".semOk").textContent = semOk;
    sec.querySelector(".semFill").style.width = (semOk / blk.materias.length) * 100 + "%";
  });

  // P10: barra continua. Solo cuenta aprobadas. Color cambia según %.
  const pct = Math.min(100, (creditosOk / TOTAL) * 100);
  const fill = ribbon.querySelector(".ribbon-fill") || (() => {
    ribbon.innerHTML = '<div class="ribbon-fill"></div>';
    return ribbon.querySelector(".ribbon-fill");
  })();
  fill.style.width = pct.toFixed(1) + "%";
  // Paleta progresiva: rojo→naranja→amarillo→verde
  let fillColor;
  if (pct >= 80) fillColor = "#15803d";        // verde fuerte
  else if (pct >= 60) fillColor = "#84cc16";   // verde claro
  else if (pct >= 40) fillColor = "#facc15";   // amarillo
  else if (pct >= 20) fillColor = "#f97316";   // naranja
  else fillColor = "#dc2626";                  // rojo
  fill.style.background = fillColor;

  document.getElementById("creditosOk").textContent = creditosOk % 1 ? creditosOk.toFixed(1) : creditosOk;
  document.getElementById("pctOk").textContent = Math.round((creditosOk / TOTAL) * 100);
  document.getElementById("promedio").textContent = nCalif ? (sumCalif / nCalif).toFixed(2) : "—";

  Object.keys(counts).forEach((k) => {
    const el = document.querySelector(`.num[data-c="${k}"]`);
    if (el) el.textContent = counts[k];
  });
  document.querySelectorAll(".chip").forEach((c) => {
    c.setAttribute("aria-pressed", c.dataset.k === filter);
  });

  refreshBadges();
  applyFilters();
}

// Re-aplica el estado de cada fila (incluye el badge Pendiente ⇄ Inscrita)
function refreshBadges() {
  planEl.querySelectorAll(".subject").forEach((subj) => {
    const id = subj.dataset.id;
    const m = id && id.match(/^s(\d+)-(\d+)$/);
    if (!m) return;
    const name = PLAN[+m[1]].materias[+m[2]][0];
    applyRowMode(subj, getSub(id, name));
  });
}

// ---- Filtros ----
const searchEl = document.getElementById("search");
function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  planEl.querySelectorAll(".sem").forEach((sec) => {
    let visible = 0;
    sec.querySelectorAll(".subject").forEach((subj) => {
      const badge = subj.querySelector(".status-badge");
      const st = badge ? badge.dataset.st : "pendiente";
      const nm = subj.querySelector(".name").textContent.toLowerCase();
      const okFilter = filter === "todas" || st === filter;
      const okSearch = !q || nm.includes(q);
      const show = okFilter && okSearch;
      subj.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    sec.classList.toggle("hidden", visible === 0);
  });
}
searchEl.addEventListener("input", applyFilters);


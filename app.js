// ============================================================
//  PLAN DE ESTUDIOS — ISC
// ============================================================
const PLAN = [
  { sem: "1.er semestre", materias: [
    ["Cálculo", 7.5], ["Análisis vectorial", 7.5], ["Matemáticas discretas", 10.5],
    ["Comunicación oral y escrita", 7.5], ["Fundamentos de programación", 7.5],
  ]},
  { sem: "2.º semestre", materias: [
    ["Algoritmos y estructura de datos", 7.5], ["Álgebra lineal", 9], ["Cálculo aplicado", 7.5],
    ["Mecánica y electromagnetismo", 10.5], ["Ingeniería, ética y sociedad", 9], ["Fundamentos económicos", 7.5],
  ]},
  { sem: "3.er semestre", materias: [
    ["Análisis y diseño de algoritmos", 7.5], ["Paradigmas de programación", 7.5], ["Ecuaciones diferenciales", 9],
    ["Fundamentos de diseño digital", 7.5], ["Circuitos eléctricos", 7.5], ["Bases de datos", 7.5], ["Finanzas empresariales", 7.5],
  ]},
  { sem: "4.º semestre", materias: [
    ["Teoría de la computación", 7.5], ["Probabilidad y estadística", 9], ["Matemáticas avanzadas para la ingeniería", 9],
    ["Diseño de sistemas digitales", 7.5], ["Electrónica analógica", 7.5],
    ["Tecnologías para desarrollo de aplicaciones web", 7.5], ["Sistemas operativos", 7.5],
  ]},
  { sem: "5.º semestre", materias: [
    ["Compiladores", 7.5], ["Procesamiento digital de señales", 7.5], ["Arquitectura de computadoras", 7.5],
    ["Instrumentación y control", 7.5], ["Análisis y diseño de sistemas", 7.5],
    ["Formulación y evaluación de proyectos informáticos", 6], ["Redes de computadoras", 7.5],
  ]},
  { sem: "6.º semestre", materias: [
    ["Inteligencia artificial", 7.5], ["Sistemas en chip", 7.5], ["Métodos cuantitativos para la toma de decisiones", 7.5],
    ["Ingeniería de software", 7.5], ["Aplicaciones para comunicaciones en red", 7.5],
    ["Optativa A1", 7.5], ["Optativa B1", 7.5],
  ]},
  { sem: "7.º semestre", materias: [
    ["Trabajo terminal I", 12], ["Sistemas distribuidos", 7.5], ["Desarrollo de aplicaciones móviles nativas", 7.5],
    ["Administración de servicios en red", 7.5], ["Optativa A2", 7.5], ["Optativa B2", 7.5],
  ]},
  { sem: "8.º semestre", materias: [
    ["Trabajo terminal II", 12], ["Liderazgo personal", 7.5], ["Gestión empresarial", 7.5],
    ["Estancia profesional", 3], ["Desarrollo de habilidades sociales para la alta dirección", 3],
  ]},
];

// ============================================================
//  CONSTANTES
// ============================================================
const STATES = { pendiente: "Pendiente", aprobada: "Aprobada", reprobada: "Reprobada" };
const ORDER = ["aprobada", "reprobada", "pendiente"];
const TOTAL = 387;
const MAX_CRED = 55;
const KEY = "avanceISC_v2";

const OPT_SLOTS = {
  "s5-5": { label: "A1", sem: 6, defName: "Optativa A1" },
  "s5-6": { label: "B1", sem: 6, defName: "Optativa B1" },
  "s6-4": { label: "A2", sem: 7, defName: "Optativa A2" },
  "s6-5": { label: "B2", sem: 7, defName: "Optativa B2" },
};

// Bloques de horario (clases de 1:30, recesos 10:00–10:30 y 18:00–18:30)
const TIME_BLOCKS = [
  { ini: "07:00", fin: "08:30" },
  { ini: "08:30", fin: "10:00" },
  // receso 10:00–10:30
  { ini: "10:30", fin: "12:00" },
  { ini: "12:00", fin: "13:30" },
  { ini: "13:30", fin: "15:00" },
  { ini: "15:00", fin: "16:30" },
  { ini: "16:30", fin: "18:00" },
  // receso 18:00–18:30
  { ini: "18:30", fin: "20:00" },
  { ini: "20:00", fin: "21:30" },
];
const DIAS = ["Lun", "Mar", "Mie", "Jue", "Vie"];

// Paleta para colorear cada materia en la rejilla
const SCHED_COLORS = [
  { bg: "#dbeafe", fg: "#1e3a8a", bd: "#93c5fd" },
  { bg: "#dcfce7", fg: "#14532d", bd: "#86efac" },
  { bg: "#fef3c7", fg: "#78350f", bd: "#fcd34d" },
  { bg: "#fce7f3", fg: "#831843", bd: "#f9a8d4" },
  { bg: "#e0e7ff", fg: "#312e81", bd: "#a5b4fc" },
  { bg: "#ccfbf1", fg: "#134e4a", bd: "#5eead4" },
  { bg: "#fed7aa", fg: "#7c2d12", bd: "#fdba74" },
  { bg: "#fae8ff", fg: "#581c87", bd: "#d8b4fe" },
  { bg: "#cffafe", fg: "#164e63", bd: "#67e8f9" },
];

// ============================================================
//  PERSISTENCIA
// ============================================================
let memFallback = null;

function blankState() {
  return { subjects: {}, metrics: {}, horario: [], teacherMats: {} };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw) return blankState();
    return {
      subjects: raw.subjects || {},
      metrics: raw.metrics || {},
      horario: raw.horario || [],
      teacherMats: raw.teacherMats || {},
    };
  } catch (e) {
    return memFallback || blankState();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    memFallback = state;
  }
}

let state = load();

// ============================================================
//  HELPERS
// ============================================================
function idOf(s, i) { return "s" + s + "-" + i; }

function norm(s) {
  return String(s).toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Status se DERIVA de calif (no se setea manualmente).
// pendiente = sin calif · aprobada = calif >= 6 · reprobada = calif < 6
function deriveStatus(calif) {
  if (calif === "" || calif == null) return "pendiente";
  const n = Number(calif);
  if (!Number.isFinite(n)) return "pendiente";
  return n >= 6 ? "aprobada" : "reprobada";
}

function getSub(id, defName) {
  const r = state.subjects[id] || {};
  const calif = r.calif || "";
  return {
    calif,
    veces: Number(r.veces || 1),
    status: deriveStatus(calif),
    name: r.name || defName,
  };
}

function setSub(id, patch) {
  const cur = state.subjects[id] || {};
  state.subjects[id] = Object.assign({}, cur, patch);
  save();
}

// ¿La materia puede inscribirse al horario? No si está aprobada, ni reprobada en 2da vuelta.
function canInscribir(rec) {
  if (rec.status === "aprobada") return false;
  if (rec.status === "reprobada" && rec.veces >= 2) return false;
  return true;
}

// Texto del badge de estado
function statusBadgeText(rec) {
  if (rec.status === "aprobada") return rec.veces === 2 ? "Aprobada (recurse)" : "Aprobada";
  if (rec.status === "reprobada") return rec.veces === 2 ? "🔒 Bloqueada" : "Reprobada";
  return "Pendiente";
}

function getMetric(name) {
  const seed = (typeof TEACHER_METRICS !== "undefined" && TEACHER_METRICS[name]) || {};
  const o = state.metrics[name] || {};
  const pick = (k) =>
    o[k] !== undefined && o[k] !== null ? o[k]
    : seed[k] !== undefined && seed[k] !== null ? seed[k]
    : "";
  return { calidad: pick("calidad"), recomiendan: pick("recomiendan"), dificultad: pick("dificultad") };
}

function setMetric(name, patch) {
  state.metrics[name] = Object.assign(getMetric(name), patch);
  save();
}

// Nombre legible de la materia para un slot (incluye optativa elegida)
function subjectName(s, i) {
  const id = idOf(s, i);
  const def = PLAN[s].materias[i][0];
  if (OPT_SLOTS[id]) return getSub(id, def).name;
  return def;
}

// ---- Índice del roster por materia normalizada ----
const rosterBySubject = {};
ROSTER.forEach((e) => {
  const k = norm(e.m);
  (rosterBySubject[k] = rosterBySubject[k] || []).push(e);
});

// Lista de maestros que imparten el slot dado (materia normal u optativa)
function teachersFor(s, i) {
  const id = idOf(s, i);
  const def = PLAN[s].materias[i][0];
  if (OPT_SLOTS[id]) {
    // Para optativas, juntar todos los maestros de OPTATIVA <label>
    return rosterBySubject[norm("OPTATIVA " + OPT_SLOTS[id].label)] || [];
  }
  return rosterBySubject[norm(def)] || [];
}

// Ofertas reales (SCHEDULE) que aplican a un slot del plan
function scheduleFor(s, i) {
  const id = idOf(s, i);
  const slot = OPT_SLOTS[id];
  const sched = typeof SCHEDULE !== "undefined" ? SCHEDULE : [];
  if (slot) {
    const profs = new Set(
      ROSTER.filter((e) => e.m === "OPTATIVA " + slot.label).map((e) => e.t)
    );
    const semChar = String(slot.sem);
    return sched.filter(
      (e) => profs.has(e.profesor) && e.materia.includes("|") && e.grupo.startsWith(semChar)
    );
  }
  const def = PLAN[s].materias[i][0];
  const k = norm(def);
  return sched.filter((e) => norm(e.materia) === k);
}

function sesionesText(sesiones) {
  if (!sesiones || sesiones.length === 0) return "";
  return sesiones.map((s) => `${s.dia} ${s.ini}-${s.fin}`).join(" · ");
}

// Conflictos entre dos items con sesiones
function sessionsOverlap(a, b) {
  if (a.dia !== b.dia) return false;
  return a.ini < b.fin && b.ini < a.fin;
}
function itemsConflict(a, b) {
  if (!a.sesiones || !b.sesiones) return false;
  for (const sa of a.sesiones) for (const sb of b.sesiones) {
    if (sessionsOverlap(sa, sb)) return true;
  }
  return false;
}

// Lista única de maestros (para la pestaña Maestros)
function allTeachers() {
  // Índice rápido: materia → primer índice de semestre del plan
  const matToSem = new Map();
  PLAN.forEach((blk, sIdx) => blk.materias.forEach(([mat]) => {
    const k = norm(mat);
    if (!matToSem.has(k)) matToSem.set(k, sIdx + 1);
  }));

  const map = {};
  ROSTER.forEach((e) => {
    if (!map[e.t]) map[e.t] = { name: e.t, materias: new Set(), grupos: new Set(), semestres: new Set() };
    map[e.t].materias.add(e.m);
    // Extraer grupos del campo g (ej: "1CM1, 1CM5" o "6CM3 (Big Data)")
    (e.g || "").split(",").forEach((gp) => {
      const m = gp.trim().match(/^[1-8][A-Z]{2}\d+/);
      if (m) map[e.t].grupos.add(m[0]);
    });
    // Semestre desde SCHEDULE (más confiable) o desde matToSem
    const semFromMat = matToSem.get(norm(e.m));
    if (semFromMat) map[e.t].semestres.add(semFromMat);
  });
  // Para optativas, derivar semestre del slot (OPTATIVA A1/B1 → 6, A2/B2 → 7)
  ROSTER.forEach((e) => {
    const optMatch = e.m.match(/OPTATIVA\s+([AB])([12])/);
    if (optMatch && map[e.t]) {
      map[e.t].semestres.add(optMatch[2] === "1" ? 6 : 7);
    }
  });

  return Object.values(map).map((x) => ({
    name: x.name,
    materias: [...x.materias],
    grupos: [...x.grupos].sort(),
    semestres: [...x.semestres].sort((a, b) => a - b),
  }));
}
const TEACHERS = allTeachers();

// Catálogo de todas las materias (para el menú "Agregar materia")
const ALL_MATERIAS = [...new Set(ROSTER.map((e) => e.m))].sort((a, b) => a.localeCompare(b));

function titleCase(s) {
  return String(s).toLowerCase().replace(/(^|\s|\()([a-záéíóúñ])/g, (m) => m.toUpperCase());
}

// Materias roster (las que imparte este semestre) de un maestro
function rosterMatsOf(name) {
  return [...new Set(ROSTER.filter((e) => e.t === name).map((e) => e.m))];
}

// Lista de materias del maestro con su estado activo (verde) / inactivo (rojo)
function teacherMaterias(name) {
  const rmats = rosterMatsOf(name);
  const tm = state.teacherMats[name] || {};
  const all = new Set(rmats);
  Object.keys(tm).forEach((m) => all.add(m));
  return [...all].sort((a, b) => a.localeCompare(b)).map((mat) => {
    const inRoster = rmats.includes(mat);
    const active = mat in tm ? tm[mat] : inRoster; // roster: verde por defecto; agregada: lo guardado
    return { mat, active, added: !inRoster };
  });
}

function toggleMat(name, mat) {
  const tm = (state.teacherMats[name] = state.teacherMats[name] || {});
  const cur = mat in tm ? tm[mat] : rosterMatsOf(name).includes(mat);
  tm[mat] = !cur;
  save();
  renderProfs();
}

function addMat(name, mat) {
  const tm = (state.teacherMats[name] = state.teacherMats[name] || {});
  tm[mat] = false; // se agrega como inactiva (roja); haz clic para activarla
  save();
  renderProfs();
}

function removeMat(name, mat) {
  const tm = state.teacherMats[name];
  if (tm && mat in tm) { delete tm[mat]; save(); renderProfs(); }
}

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
    if (tab === "maestros") renderProfs();
    if (tab === "horario") renderHorario();
    if (tab === "optativas") renderOptativas();
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
        <span class="name">${esc(rec.name)}${isOpt ? `<span class="opttag">${OPT_SLOTS[id].label}</span>` : ""}</span>
        <span class="cred">${cred}</span>
        <div class="row-controls">
          <select class="veces" aria-label="Veces cursada de ${esc(name)}">
            <option value="1">1ª vez</option>
            <option value="2">2ª (recurse)</option>
          </select>
          <input class="calif" type="number" min="0" max="10" step="1" placeholder="Cal"
                 value="${esc(rec.calif)}" aria-label="Calificación de ${esc(name)}">
          <span class="status-badge" data-st="${rec.status}" data-blocked="${rec.status === "reprobada" && rec.veces >= 2 ? "1" : "0"}">${statusBadgeText(rec)}</span>
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
  const profsBtn = subj.querySelector(".profsBtn");
  const badge = subj.querySelector(".status-badge");
  const isBlocked = rec.status === "reprobada" && rec.veces >= 2;
  badge.dataset.st = rec.status;
  badge.dataset.blocked = isBlocked ? "1" : "0";
  badge.textContent = statusBadgeText(rec);
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
        return `
        <div class="tcard">
          <div class="tcard-main">
            <div class="tcard-name">${esc(e.profesor)}</div>
            <div class="tcard-grupo">${esc(e.grupo)} · Ed. ${esc(e.edificio)} · Salón ${esc(e.salon)}${rama ? ` · <b>${esc(titleCase(rama))}</b>` : ""}</div>
            <div class="tcard-sesiones">${esc(sesionesText(e.sesiones))}</div>
            ${miniMetrics(m)}
          </div>
          <button class="addBtn ${inH ? "added" : ""}" data-k="${k}">
            ${inH ? "✓ En horario" : "+ Horario"}
          </button>
        </div>`;
      }).join("")}
    </div>`;

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

  applyFilters();
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

// ============================================================
//  PESTAÑA 2 · MAESTROS
// ============================================================
let profSort = { key: "name", dir: "asc" };
const profsHead = document.getElementById("profsHead");
const profsBody = document.getElementById("profsBody");
const searchProf = document.getElementById("searchProf");
document.getElementById("profCount").textContent = TEACHERS.length;

const PROF_COLS = [
  { key: "name", label: "Maestro", type: "text" },
  { key: "calidad", label: "Calidad general", type: "num" },
  { key: "recomiendan", label: "Lo recomiendan", type: "num" },
  { key: "dificultad", label: "Nivel de dificultad", type: "num" },
];

function renderProfsHead() {
  profsHead.innerHTML = `<tr>${PROF_COLS.map(
    (c) => `<th><div class="th-label">${c.label}</div></th>`
  ).join("")}</tr>`;
}

function renderProfs() {
  renderProfsHead();
  const q = searchProf.value.trim().toLowerCase();

  let rows = TEACHERS.map((t) => {
    const m = getMetric(t.name);
    return {
      ...t,
      ...m,
      _grupo: t.grupos[0] || "",
      _semestre: t.semestres[0] || 99,
      _materia: t.materias[0] || "",
    };
  });

  if (q) {
    rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.materias.some((m) => m.toLowerCase().includes(q))
    );
  }

  const { key, dir } = profSort;
  rows.sort((a, b) => {
    // Texto (alfabético): name, grupo, materia
    if (key === "name" || key === "grupo" || key === "materia") {
      const fld = key === "name" ? "name" : (key === "grupo" ? "_grupo" : "_materia");
      return dir === "asc" ? a[fld].localeCompare(b[fld]) : b[fld].localeCompare(a[fld]);
    }
    // Semestre (numérico simple)
    if (key === "semestre") {
      return dir === "asc" ? a._semestre - b._semestre : b._semestre - a._semestre;
    }
    // Métricas numéricas
    const av = a[key] === "" || a[key] == null ? null : Number(a[key]);
    const bv = b[key] === "" || b[key] == null ? null : Number(b[key]);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return dir === "asc" ? av - bv : bv - av;
  });

  profsBody.innerHTML = rows.map((r) => `
    <tr>
      <td>
        <div class="pname">${esc(r.name)}</div>
        ${matsCellHTML(r.name)}
      </td>
      <td>${metricCell(r.calidad, "cal")}</td>
      <td>${metricCell(r.recomiendan, "rec")}</td>
      <td>${metricCell(r.dificultad, "dif")}</td>
    </tr>`).join("");

  // etiquetas de materia: clic = activa/inactiva (verde/rojo)
  profsBody.querySelectorAll(".mtag").forEach((tag) => {
    tag.onclick = (e) => {
      if (e.target.classList.contains("mx")) {
        removeMat(tag.dataset.name, tag.dataset.mat);
      } else {
        toggleMat(tag.dataset.name, tag.dataset.mat);
      }
    };
  });

  // agregar materia desde el menú desplegable
  profsBody.querySelectorAll("select.addmat").forEach((sel) => {
    sel.onchange = () => {
      if (sel.value) addMat(sel.dataset.name, sel.value);
    };
  });
}

// Celda de materias: etiquetas verde (activa) / roja (inactiva) + menú "Agregar materia"
function matsCellHTML(name) {
  const mats = teacherMaterias(name);
  const tags = mats.map((x) =>
    `<span class="mtag ${x.active ? "on" : "off"}" data-name="${esc(name)}" data-mat="${esc(x.mat)}" title="${x.active ? "Activa este semestre — clic para desactivar" : "Inactiva — clic para activar"}">${esc(titleCase(x.mat))}${x.added ? `<i class="mx" data-rm="1" title="Quitar">×</i>` : ""}</span>`
  ).join("");
  const taken = new Set(mats.map((x) => x.mat));
  const opts = ALL_MATERIAS.filter((m) => !taken.has(m))
    .map((m) => `<option value="${esc(m)}">${esc(titleCase(m))}</option>`).join("");
  const sel = `<select class="addmat" data-name="${esc(name)}" aria-label="Agregar materia">
      <option value="">+ Materia</option>${opts}</select>`;
  return `<div class="pmats">${tags}${sel}</div>`;
}

// P5: paleta de 6 colores aplicada a las 3 métricas
function metricColor(val, kind) {
  if (val === "" || val == null) return "na";
  const n = Number(val);
  if (!Number.isFinite(n)) return "na";
  if (kind === "cal") {
    if (n >= 9) return "g1"; if (n >= 8) return "g2"; if (n >= 7) return "y1";
    if (n >= 6) return "o1"; if (n >= 4.9) return "r1"; return "r2";
  }
  if (kind === "rec") {
    if (n >= 90) return "g1"; if (n >= 80) return "g2"; if (n >= 70) return "y1";
    if (n >= 60) return "o1"; if (n >= 50) return "r1"; return "r2";
  }
  // dificultad invertida: bajo = bueno (verde), alto = malo (rojo)
  if (n < 1) return "g1"; if (n < 2) return "g2"; if (n < 3) return "y1";
  if (n < 4) return "o1"; if (n < 5) return "r1"; return "r2";
}

function metricCell(val, kind) {
  const cls = metricColor(val, kind);
  const has = val !== "" && val != null;
  const text = !has ? "—" : (kind === "rec" ? val + "%" : val);
  return `<span class="metric-pill ${cls}">${esc(text)}</span>`;
}

searchProf.addEventListener("input", renderProfs);

// P7+P8: dropdown único de orden
const sortProfEl = document.getElementById("sortProf");
sortProfEl.addEventListener("change", () => {
  const [key, dir] = sortProfEl.value.split("|");
  profSort = { key, dir };
  renderProfs();
});

// ============================================================
//  PESTAÑA 3 · GENERAR HORARIO
// ============================================================
const horarioListEl = document.getElementById("horarioList");
const credSummaryEl = document.getElementById("credSummary");

function renderHorario() {
  // P9: materias reprobadas en el plan que aún no tienen profe en el horario
  const reprobadasSinProfe = [];
  PLAN.forEach((blk, s) => blk.materias.forEach(([name], i) => {
    const id = idOf(s, i);
    if (getSub(id, name).status === "reprobada" && !state.horario.some((h) => h.sid === id)) {
      reprobadasSinProfe.push(name);
    }
  }));

  const inscritos = state.horario.reduce((a, h) => a + h.cred, 0);
  const nMaterias = state.horario.length;
  const over = inscritos > MAX_CRED;

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
      <div class="cs-val">${fmt(inscritos)} <span class="cs-max">/ ${MAX_CRED}</span></div>
      <div class="cs-label">Créditos inscritos</div>
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
    warn.textContent = `⚠️ Llevas ${fmt(inscritos)} créditos inscritos; el máximo es ${MAX_CRED}. Quita ${fmt(inscritos - MAX_CRED)} créditos.`;
    credSummaryEl.appendChild(warn);
  }

  // P9: bloqueo si hay reprobadas sin profe asignado
  if (reprobadasSinProfe.length > 0) {
    const warn = document.createElement("div");
    warn.className = "over-warn block-warn";
    warn.innerHTML = `🚫 No puedes inscribir hasta agregar profe a las materias reprobadas pendientes de recurse:<br><b>${reprobadasSinProfe.map(esc).join(" · ")}</b>`;
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
        <div class="hcard-prof">${esc(h.maestro)} · <span class="hcard-grupo">${esc(h.grupo || "")}${aula ? " · " + aula : ""}</span></div>
        ${h.sesiones && h.sesiones.length ? `<div class="hcard-ses">${esc(sesionesText(h.sesiones))}</div>` : ""}
        ${miniMetrics(m)}
      </div>
      <button class="hdel" data-idx="${idx}" title="Quitar del horario">✕</button>
    </div>`;
  }).join("");

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

// ============================================================
//  RESPALDO / RESTAURAR / REINICIAR
// ============================================================
// ============================================================
//  PESTAÑA 4 · OPTATIVAS — Rutas de especialización (P15)
// ============================================================
const rutasOptEl = document.getElementById("rutasOpt");

// Devuelve qué rama tiene elegida cada slot ('A1','B1','A2','B2'), o null
function ramaElegidaDeSlot(slotLabel) {
  const entry = Object.entries(OPT_SLOTS).find(([, info]) => info.label === slotLabel);
  if (!entry) return null;
  const [id] = entry;
  const rec = state.subjects[id];
  if (!rec || !rec.name) return null;
  // Nombre guardado es "Optativa A1 · <Rama>" (cuando hay elección via dropdown)
  const m = rec.name.match(/·\s*(.+)$/);
  return m ? m[1].trim() : null;
}

function renderOptativas() {
  // Mapa de elecciones (rama elegida por slot)
  const elecciones = {
    A1: ramaElegidaDeSlot("A1"),
    B1: ramaElegidaDeSlot("B1"),
    A2: ramaElegidaDeSlot("A2"),
    B2: ramaElegidaDeSlot("B2"),
  };

  // Resumen
  const elegidas = Object.entries(elecciones).filter(([, v]) => v);
  const resumen = elegidas.length === 0
    ? `<div class="opt-resumen empty">Aún no has elegido ninguna optativa. Ve a <b>Mi avance</b>, ubica las materias <b>Optativa A1/B1/A2/B2</b> y pulsa <b>Maestros</b> para elegir una rama.</div>`
    : `<div class="opt-resumen">
        <div class="opt-count">${elegidas.length} de 4 optativas elegidas</div>
        <div class="opt-pills">${elegidas.map(([slot, rama]) =>
          `<span class="opt-pill"><b>${slot}</b> ${esc(rama)}</span>`
        ).join("")}</div>
      </div>`;

  // Cada rama es una "ruta" horizontal: nombre · A1/B1 → A2/B2
  const ramas = ESPECIALIZACIONES.map((esp) => {
    const norm = (s) => String(s).toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const elig = (ramaName) => norm(ramaName) === norm(esp.nombre);
    const enA1 = elig(elecciones.A1);
    const enB1 = elig(elecciones.B1);
    const enA2 = elig(elecciones.A2);
    const enB2 = elig(elecciones.B2);
    const enRama = enA1 || enB1 || enA2 || enB2;

    const sem6 = esp.materias.find((m) => m.sem === 6);
    const sem7 = esp.materias.find((m) => m.sem === 7);

    const slot6 = enA1 ? "A1" : (enB1 ? "B1" : "");
    const slot7 = enA2 ? "A2" : (enB2 ? "B2" : "");

    return `
      <article class="ruta ${enRama ? "elegida" : ""}">
        <header class="ruta-head">
          <span class="ruta-badge">${esc(esp.icono)}</span>
          <span class="ruta-name">${esc(esp.nombre)}</span>
          ${enRama ? `<span class="ruta-chip">✓ Elegida</span>` : ""}
        </header>
        <div class="ruta-pasos">
          <div class="ruta-paso sem6 ${slot6 ? "active" : ""}">
            <div class="ruta-paso-tag">6.° SEM · ${esc(sem6.clave)}${slot6 ? ` · ${slot6}` : ""}</div>
            <div class="ruta-paso-name">${esc(sem6.nombre)}</div>
            <div class="ruta-paso-en">${esc(sem6.en)}</div>
          </div>
          <div class="ruta-flecha">→</div>
          <div class="ruta-paso sem7 ${slot7 ? "active" : ""}">
            <div class="ruta-paso-tag">7.° SEM · ${esc(sem7.clave)}${slot7 ? ` · ${slot7}` : ""}</div>
            <div class="ruta-paso-name">${esc(sem7.nombre)}</div>
            <div class="ruta-paso-en">${esc(sem7.en)}</div>
          </div>
        </div>
      </article>`;
  }).join("");

  rutasOptEl.innerHTML = resumen + `<div class="rutas-grid">${ramas}</div>`;
}

// ============================================================
//  P17 · MODO AUTOMÁTICO
// ============================================================
document.querySelectorAll(".auto-tab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".auto-tab").forEach((b) => b.classList.toggle("active", b === btn));
    const mode = btn.dataset.mode;
    document.querySelector(".auto-config[data-mode='auto']").hidden = (mode !== "auto");
  };
});

// Detecta el "semestre actual": el más bajo donde haya pendientes (no todas aprobadas).
function detectarSemestreActual() {
  for (let s = 0; s < PLAN.length; s++) {
    const blk = PLAN[s];
    const todasAprobadas = blk.materias.every(([name], i) => {
      return getSub(idOf(s, i), name).status === "aprobada";
    });
    if (!todasAprobadas) return s;
  }
  return PLAN.length - 1; // todo aprobado: regresa el último
}

function hhmmToMin(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }

function ofertaCaeEnVentana(sesiones, iniMin, finMin) {
  return sesiones.every((s) => hhmmToMin(s.ini) >= iniMin && hhmmToMin(s.fin) <= finMin);
}

// Detecta conflicto entre dos arrays de sesiones
function sesionesChocan(a, b) {
  for (const sa of a) for (const sb of b) {
    if (sa.dia === sb.dia && sa.ini < sb.fin && sb.ini < sa.fin) return true;
  }
  return false;
}

// Puntaje de una oferta: calidad alta + dificultad baja
function puntajeOferta(profesor) {
  const m = getMetric(profesor);
  const cal = Number(m.calidad) || 0;
  const dif = Number(m.dificultad) || 0;
  return cal * 2 - dif; // pondera calidad un poco más
}

document.getElementById("autoGenBtn").onclick = () => {
  const entrada = document.getElementById("autoEntrada").value;
  const salida = document.getElementById("autoSalida").value;
  const maxMat = Math.max(1, Math.min(9, parseInt(document.getElementById("autoMax").value) || 7));
  const resultEl = document.getElementById("autoResult");

  if (!entrada || !salida) { alert("Captura hora de entrada y salida."); return; }
  const iniMin = hhmmToMin(entrada);
  const finMin = hhmmToMin(salida);
  if (iniMin >= finMin) { alert("La hora de salida debe ser mayor que la de entrada."); return; }

  const semIdx = detectarSemestreActual();
  const semNombre = PLAN[semIdx].sem;

  // Pendientes del semestre actual que se pueden inscribir
  const pendientes = [];
  PLAN[semIdx].materias.forEach(([name, cred], i) => {
    const id = idOf(semIdx, i);
    const rec = getSub(id, name);
    if (rec.status === "pendiente" && canInscribir(rec)) {
      pendientes.push({ id, name, cred, i, s: semIdx });
    }
  });

  if (pendientes.length === 0) {
    resultEl.innerHTML = `<div class="auto-warn">No hay materias pendientes en <b>${semNombre}</b>.</div>`;
    return;
  }

  // Para cada pendiente, obtener ofertas que caigan en la ventana, ordenadas por puntaje
  const candidatos = pendientes.map((p) => {
    const ofertas = scheduleFor(p.s, p.i)
      .filter((e) => ofertaCaeEnVentana(e.sesiones, iniMin, finMin))
      .sort((a, b) => puntajeOferta(b.profesor) - puntajeOferta(a.profesor));
    return { ...p, ofertas };
  });

  // Greedy: por orden, tomar la mejor oferta que no choque con lo ya seleccionado
  const elegidas = [];
  const sinFit = [];
  candidatos.forEach((p) => {
    if (elegidas.length >= maxMat) return;
    const compatible = p.ofertas.find((of) => {
      return !elegidas.some((e) => sesionesChocan(e.sesiones, of.sesiones));
    });
    if (compatible) {
      elegidas.push({
        sid: p.id, materia: p.name, maestro: compatible.profesor, grupo: compatible.grupo,
        edificio: compatible.edificio, salon: compatible.salon, sesiones: compatible.sesiones,
        cred: p.cred, tipo: "nueva",
      });
    } else {
      sinFit.push(p.name);
    }
  });

  if (elegidas.length === 0) {
    resultEl.innerHTML = `<div class="auto-warn">⚠️ No se pudo armar ninguna materia en esa ventana. Amplía hora de entrada/salida.</div>`;
    return;
  }

  // Sobrescribe el horario con la propuesta
  state.horario = elegidas;
  save();
  renderHorario();

  const totalCred = elegidas.reduce((a, e) => a + e.cred, 0);
  let html = `<div class="auto-ok">✅ Se inscribieron <b>${elegidas.length}</b> de <b>${pendientes.length}</b> materias de ${semNombre} (${fmt(totalCred)} créditos).</div>`;
  if (sinFit.length > 0) {
    html += `<div class="auto-warn">⚠️ No cupieron por choque/ventana: <b>${sinFit.map(esc).join(" · ")}</b>. Agrégalas manualmente o amplía tu ventana de tiempo.</div>`;
  }
  if (elegidas.length < pendientes.length && elegidas.length === maxMat) {
    html += `<div class="auto-hint">Llegaste al máximo de ${maxMat} materias. Si quieres más, sube el tope.</div>`;
  }
  resultEl.innerHTML = html;
};

// P14: Borrar todo el horario
document.getElementById("clearHorarioBtn").onclick = () => {
  if (state.horario.length === 0) { alert("Tu horario ya está vacío."); return; }
  if (confirm(`¿Borrar las ${state.horario.length} materia(s) que tienes en el horario? Esta acción no se puede deshacer.`)) {
    state.horario = [];
    save();
    renderHorario();
    // refresca botones del plan
    planEl.querySelectorAll(".drop.open").forEach((d) => {
      const subj = d.closest(".subject");
      const m = subj.dataset.id.match(/^s(\d+)-(\d+)$/);
      if (m) renderDrop(d, parseInt(m[1]), parseInt(m[2]));
    });
  }
};

document.getElementById("backupBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "avance_carrera.json";
  a.click();
  URL.revokeObjectURL(a.href);
};
document.getElementById("restoreBtn").onclick = () => document.getElementById("fileInput").click();
document.getElementById("fileInput").onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const parsed = JSON.parse(r.result);
      state = {
        subjects: parsed.subjects || {},
        metrics: parsed.metrics || {},
        horario: parsed.horario || [],
        teacherMats: parsed.teacherMats || {},
      };
      save();
      location.reload();
    } catch (err) {
      alert("Ese archivo no se pudo leer. Usa el respaldo .json que descargaste.");
    }
  };
  r.readAsText(f);
};
document.getElementById("resetBtn").onclick = () => {
  if (confirm("¿Borrar todo tu avance, calificaciones, métricas y horario?")) {
    state = blankState();
    save();
    location.reload();
  }
};

// ============================================================
//  ARRANQUE
// ============================================================
try {
  localStorage.setItem("__t", "1");
  localStorage.removeItem("__t");
} catch (e) {
  document.getElementById("saveState").textContent =
    'Aviso: este navegador no guarda el avance. Usa "Guardar respaldo" para no perder tus datos.';
}

render();

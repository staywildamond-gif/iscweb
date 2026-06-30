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
//  DIFICULTAD POR MATERIA (promedio real de profes M+V, escala 0–6 → 1–10)
// ============================================================
const SUBJECT_DIFFICULTY = {
  "CALCULO": 6.5, "ANALISIS VECTORIAL": 6.6, "MATEMATICAS DISCRETAS": 6.9,
  "COMUNICACION ORAL Y ESCRITA": 2.6, "FUNDAMENTOS DE PROGRAMACION": 5.9,
  "ALGORITMOS Y ESTRUCTURA DE DATOS": 5.2, "ALGEBRA LINEAL": 6.5,
  "CALCULO APLICADO": 6.6, "MECANICA Y ELECTROMAGNETISMO": 5.5,
  "INGENIERIA ETICA Y SOCIEDAD": 4.0, "FUNDAMENTOS ECONOMICOS": 4.5,
  "ECUACIONES DIFERENCIALES": 5.8, "CIRCUITOS ELECTRICOS": 6.0,
  "FUNDAMENTOS DE DISENO DIGITAL": 6.0, "BASES DE DATOS": 5.2,
  "FINANZAS EMPRESARIALES": 4.4, "PARADIGMAS DE PROGRAMACION": 4.5,
  "ANALISIS Y DISENO DE ALGORITMOS": 4.9,
  "TEORIA DE LA COMPUTACION": 4.1, "PROBABILIDAD Y ESTADISTICA": 5.7,
  "MATEMATICAS AVANZADAS PARA LA INGENIERIA": 6.9,
  "DISENO DE SISTEMAS DIGITALES": 8.0, "ELECTRONICA ANALOGICA": 6.5,
  "TECNOLOGIAS PARA DESARROLLO DE APLICACIONES WEB": 4.6,
  "SISTEMAS OPERATIVOS": 5.2, "COMPILADORES": 5.6,
  "PROCESAMIENTO DIGITAL DE SENALES": 5.9,
  "ARQUITECTURA DE COMPUTADORAS": 6.8, "INSTRUMENTACION Y CONTROL": 5.6,
  "ANALISIS Y DISENO DE SISTEMAS": 4.6,
  "FORMULACION Y EVALUACION DE PROYECTOS INFORMATICOS": 5.2,
  "REDES DE COMPUTADORAS": 5.6, "INTELIGENCIA ARTIFICIAL": 4.6,
  "SISTEMAS EN CHIP": 5.7,
  "METODOS CUANTITATIVOS PARA LA TOMA DE DECISIONES": 2.8,
  "INGENIERIA DE SOFTWARE": 3.8,
  "APLICACIONES PARA COMUNICACIONES EN RED": 5.5,
  "OPTATIVA A1": 5.5, "OPTATIVA B1": 4.1,
  "TRABAJO TERMINAL I": 5.0, "SISTEMAS DISTRIBUIDOS": 5.5,
  "DESARROLLO DE APLICACIONES MOVILES NATIVAS": 5.2,
  "ADMINISTRACION DE SERVICIOS EN RED": 4.0,
  "OPTATIVA A2": 5.3, "OPTATIVA B2": 6.1,
  "TRABAJO TERMINAL II": 5.5, "LIDERAZGO PERSONAL": 2.6,
  "GESTION EMPRESARIAL": 3.5, "ESTANCIA PROFESIONAL": 2.0,
  "DESARROLLO DE HABILIDADES SOCIALES PARA LA ALTA DIRECCION": 2.8,
};

function difLevel(d) {
  if (d >= 8)   return "brutal";
  if (d >= 6.5) return "pesada";
  if (d >= 5)   return "moderada";
  if (d >= 3.5) return "llevadera";
  return "relajada";
}

function difBadge(name) {
  const k = norm(name);
  const d = SUBJECT_DIFFICULTY[k];
  if (d == null) return "";
  return `<span class="diftag" data-dif="${difLevel(d)}">${d.toFixed(1)}</span>`;
}

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

function creditosBloqueados() {
  let total = 0;
  for (let s = 0; s < PLAN.length; s++) {
    PLAN[s].materias.forEach(([, cred], i) => {
      const rec = getSub(idOf(s, i), "");
      if (rec.status === "reprobada" && rec.veces >= 2) total += cred;
    });
  }
  return total;
}

// Texto del badge de estado
function statusBadgeText(rec, inscrita) {
  if (rec.status === "aprobada") return rec.veces === 2 ? "Aprobada (recurse)" : "Aprobada";
  if (rec.status === "reprobada") return rec.veces >= 2 ? "🔒 Bloqueada · sin 3.er intento" : "Reprobada";
  // pendiente: si ya está en el horario, mostrar "Inscrita"
  if (inscrita) return rec.veces >= 2 ? "🔁 Inscrita (recurse)" : "Inscrita";
  // pendiente sin inscribir: distingue 1ª vez de recurse en curso (2ª vez sin calif)
  return rec.veces >= 2 ? "🔁 En recurse" : "Pendiente";
}
// ¿La materia está en recurse en curso? (2ª vez, aún sin calificar)
function esEnRecurse(rec) {
  return rec.status === "pendiente" && rec.veces >= 2;
}
// ¿La materia (por id) está inscrita en el horario?
function estaInscrita(id) {
  return state.horario.some((h) => h.sid === id);
}

// CSV manual de maestros (gana sobre TEACHER_METRICS, pero si falta cae al seed).
// Se llena con fetch() de maestros_manual.csv al cargar la página.
const MANUAL_METRICS = {};      // nombre exacto → {calidad, recomiendan, dificultad, link}
const MANUAL_METRICS_NORM = {}; // norm(nombre) → mismo objeto (fallback por normalización)

function manualMetricFor(name) {
  return MANUAL_METRICS[name] || MANUAL_METRICS_NORM[norm(name)] || null;
}

function getMetric(name) {
  const seed = (typeof TEACHER_METRICS !== "undefined" && TEACHER_METRICS[name]) || {};
  const man = manualMetricFor(name) || {};
  const o = state.metrics[name] || {};
  const pick = (k) =>
    o[k] !== undefined && o[k] !== null && o[k] !== "" ? o[k]
    : man[k] !== undefined && man[k] !== null && man[k] !== "" ? man[k]
    : seed[k] !== undefined && seed[k] !== null && seed[k] !== "" ? seed[k]
    : "";
  return { calidad: pick("calidad"), recomiendan: pick("recomiendan"), dificultad: pick("dificultad") };
}

// Parser CSV mínimo (soporta campos entrecomillados con comas adentro).
function parseCSVLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (c === '"') { q = false; }
      else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ""; }
      else if (c === '"') { q = true; }
      else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Registra un override manual; mergea si ya existía (gana lo que traiga dato)
function registerManual(name, obj) {
  if (obj.calidad === "" && obj.recomiendan === "" && obj.dificultad === "" && !obj.link) return;
  const prev = MANUAL_METRICS[name] || {};
  const merged = {
    calidad:     obj.calidad     !== "" ? obj.calidad     : (prev.calidad ?? ""),
    recomiendan: obj.recomiendan !== "" ? obj.recomiendan : (prev.recomiendan ?? ""),
    dificultad:  obj.dificultad  !== "" ? obj.dificultad  : (prev.dificultad ?? ""),
    link:        obj.link || prev.link || "",
  };
  MANUAL_METRICS[name] = merged;
  MANUAL_METRICS_NORM[norm(name)] = merged;
}

function refreshAfterManual() {
  if (document.querySelector("#pane-maestros.active")) renderProfs();
  if (document.querySelector("#pane-plan.active") && typeof render === "function") render();
  if (currentProfDetail && profDetailEl && !profDetailEl.hidden) showProfDetail(currentProfDetail);
}

function loadManualMetrics() {
  // 1) Fuente principal: maestros_manual.js (cargado con <script>).
  //    Funciona SIEMPRE, incluso abriendo el HTML sin servidor (file://).
  if (typeof MANUAL_LINKS !== "undefined" && MANUAL_LINKS) {
    Object.keys(MANUAL_LINKS).forEach((name) => {
      const v = MANUAL_LINKS[name];
      const link = typeof v === "string" ? v : (v && v.link) || "";
      const cal  = (v && v.calidad     != null) ? v.calidad     : "";
      const rec  = (v && v.recomiendan != null) ? v.recomiendan : "";
      const dif  = (v && v.dificultad  != null) ? v.dificultad  : "";
      registerManual(name, { calidad: cal, recomiendan: rec, dificultad: dif, link });
    });
    refreshAfterManual();
  }

  // 2) Mejora opcional: si se sirve por http, relee el CSV en vivo (sin regenerar el .js).
  //    En file:// esto falla y se ignora silenciosamente.
  if (!location.protocol.startsWith("http")) return;
  fetch("maestros_manual.csv?t=" + Date.now(), { cache: "no-store" })
    .then((r) => r.ok ? r.text() : "")
    .then((txt) => {
      if (!txt) return;
      const lines = txt.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
      if (lines.length < 2) return;
      const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
      const iName = header.indexOf("nombre");
      const iCal  = header.indexOf("calidad");
      const iRec  = header.indexOf("recomiendan");
      const iDif  = header.indexOf("dificultad");
      const iLnk  = header.indexOf("link_fuente");
      if (iName < 0) return;
      for (let li = 1; li < lines.length; li++) {
        const f = parseCSVLine(lines[li]);
        const name = (f[iName] || "").trim();
        if (!name) continue;
        const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? n : ""; };
        registerManual(name, {
          calidad:     iCal >= 0 ? num(f[iCal]) : "",
          recomiendan: iRec >= 0 ? num(f[iRec]) : "",
          dificultad:  iDif >= 0 ? num(f[iDif]) : "",
          link:        iLnk >= 0 ? (f[iLnk] || "").trim() : "",
        });
      }
      refreshAfterManual();
    })
    .catch(() => { /* silencioso: el CSV es opcional */ });
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
    return sched.filter((e) => {
      if (!e.materia.includes("|") || !e.grupo.startsWith(semChar)) return false;
      // Vespertino no tiene división A/B: mostrar todas las optativas del semestre.
      // Matutino conserva el filtro A/B exacto por roster.
      if (turnoDeGrupo(e.grupo) === "V") return true;
      return profs.has(e.profesor);
    });
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
      if (m) { map[e.t].grupos.add(m[0]); map[e.t].semestres.add(parseInt(m[0][0])); }
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
const ALL_MATERIAS = (() => {
  const seen = new Set(); const out = [];
  ROSTER.map((e) => e.m).sort((a, b) => a.localeCompare(b)).forEach((m) => {
    const k = norm(m); if (!seen.has(k)) { seen.add(k); out.push(m); }
  });
  return out;
})();

// Turno (M/V) a partir del código de grupo. 3.er char: M=matutino, V=vespertino.
function turnoDeGrupo(g) {
  const m = String(g).trim().match(/^[1-8][A-Z]([MV])/);
  return m ? m[1] : null;
}
function turnosDeGrupos(grupos) {
  const set = new Set();
  (grupos || []).forEach((g) => { const t = turnoDeGrupo(g); if (t) set.add(t); });
  return set;
}
function turnoBadges(grupos) {
  const set = turnosDeGrupos(grupos);
  let html = "";
  if (set.has("M")) html += `<span class="tbadge tm" title="Matutino">M</span>`;
  if (set.has("V")) html += `<span class="tbadge tv" title="Vespertino">V</span>`;
  return html;
}

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
    if (tab === "plan") render();
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

// ============================================================
//  PESTAÑA 2 · MAESTROS
// ============================================================
let profSort = { key: "name", dir: "asc" };
let profTurno = "ambos"; // P16: ambos | M | V
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

  // P16: filtro por turno (derivado de los grupos del maestro)
  if (profTurno !== "ambos") {
    rows = rows.filter((r) => turnosDeGrupos(r.grupos).has(profTurno));
  }
  document.getElementById("profCount").textContent = rows.length;

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
        <div class="pname"><a href="#" class="prof-link" data-prof="${esc(r.name)}">${esc(r.name)}</a>${turnoBadges(r.grupos)}</div>
        ${matsCellHTML(r.name)}
      </td>
      <td>${metricCell(r.calidad, "cal")}</td>
      <td>${metricCell(r.recomiendan, "rec")}</td>
      <td>${metricCell(r.dificultad, "dif")}</td>
    </tr>`).join("");

  profsBody.querySelectorAll(".prof-link").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); showProfDetail(a.dataset.prof); };
  });

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

// ----- Vista detalle de maestro (full-page dentro de pestaña Maestros) -----
const profDetailEl  = document.getElementById("profDetail");
const profsListWrap = document.getElementById("profsListWrap");
const profsPaneHead = document.querySelector("#pane-maestros .pane-head");
let currentProfDetail = null; // maestro cuyo detalle está abierto (para repintar al cargar el CSV)

function ofertasDeMaestro(name) {
  const sched = typeof SCHEDULE !== "undefined" ? SCHEDULE : [];
  return sched.filter((e) => e.profesor === name);
}

// Rejilla semanal del maestro: misma estructura que la del alumno,
// con TODOS los bloques 07:00–21:30 + recesos 10:00–10:30 y 18:00–18:30.
function renderProfSchedGrid(ofertas) {
  // Colores estables por materia/grupo
  const colorOf = new Map();
  const keyOf = (o) => `${o.materia}__${o.grupo}`;
  ofertas.forEach((o) => {
    const k = keyOf(o);
    if (!colorOf.has(k)) colorOf.set(k, SCHED_COLORS[colorOf.size % SCHED_COLORS.length]);
  });

  const blockIdx = (ini) => TIME_BLOCKS.findIndex((b) => b.ini === ini);

  // Recortar a los bloques realmente ocupados
  const occupied = new Set();
  ofertas.forEach((o) => (o.sesiones || []).forEach((s) => {
    const k = blockIdx(s.ini);
    if (k >= 0) occupied.add(k);
  }));
  if (occupied.size === 0) {
    return `<div class="drop-empty">Sin sesiones en bloques estándar.</div>`;
  }
  const minIdx = Math.min(...occupied);
  const maxIdx = Math.max(...occupied);

  let html = `<table class="sched-table"><thead><tr>
    <th class="sched-hora">Hora</th>
    ${DIAS.map((d) => `<th>${d.toUpperCase()}</th>`).join("")}
  </tr></thead><tbody>`;

  for (let i = minIdx; i <= maxIdx; i++) {
    const b = TIME_BLOCKS[i];
    html += `<tr><th class="sched-hora">${b.ini}<br>${b.fin}</th>`;
    DIAS.forEach((d) => {
      const items = [];
      ofertas.forEach((o) => {
        (o.sesiones || []).forEach((s) => {
          if (s.dia === d && s.ini === b.ini) items.push(o);
        });
      });
      const conflict = items.length > 1;
      if (items.length === 0) {
        html += `<td class="sched-empty"></td>`;
      } else {
        const inner = items.map((o) => {
          const c = colorOf.get(keyOf(o));
          const salonEd = `Ed.${esc(String(o.edificio || "—"))} · S.${esc(String(o.salon || "—"))}`;
          return `<div class="sched-cell" style="background:${c.bg};color:${c.fg};border-color:${c.bd}" title="${esc(titleCase(o.materia))} · ${esc(o.grupo)} · ${salonEd}">
            <div class="sched-mat">${esc(shortMat(o.materia))}</div>
            <div class="sched-meta"><b>${esc(o.grupo)}</b> · ${salonEd}</div>
          </div>`;
        }).join("");
        html += `<td class="${conflict ? "sched-conflict" : ""}">${inner}</td>`;
      }
    });
    html += `</tr>`;
    if (b.ini === "08:30" && i < maxIdx) {
      html += `<tr class="sched-receso"><td colspan="${DIAS.length + 1}">☕ Receso 10:00 – 10:30</td></tr>`;
    }
    if (b.ini === "16:30" && i < maxIdx) {
      html += `<tr class="sched-receso"><td colspan="${DIAS.length + 1}">☕ Receso 18:00 – 18:30</td></tr>`;
    }
  }
  html += `</tbody></table>`;
  return html;
}

const DIAS_ORDEN = { Lun:1, Mar:2, Mie:3, Mié:3, Jue:4, Vie:5, Sab:6, Sáb:6, Dom:7 };

function showProfDetail(name) {
  // Asegura que estemos en la pestaña Maestros
  document.querySelectorAll(".tab").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === "maestros"));
  document.querySelectorAll(".tabpane").forEach((p) =>
    p.classList.toggle("active", p.id === "pane-maestros"));

  if (profsPaneHead) profsPaneHead.hidden = true;
  if (profsListWrap) profsListWrap.hidden = true;
  profDetailEl.hidden = false;
  currentProfDetail = name;

  const m = getMetric(name);
  const man = manualMetricFor(name);
  const link = man && man.link ? man.link : "";

  const ofertas = ofertasDeMaestro(name);
  const turnos = new Set(ofertas.map((o) => turnoDeGrupo(o.grupo)).filter(Boolean));
  const turnoLabel = turnos.size === 0 ? "—"
    : turnos.has("M") && turnos.has("V") ? "Mixto (M + V)"
    : turnos.has("M") ? "☀️ Matutino" : "🌙 Vespertino";

  const tablaHTML = ofertas.length === 0
    ? `<div class="drop-empty">Este maestro no tiene clases registradas este semestre.</div>`
    : renderProfSchedGrid(ofertas);

  profDetailEl.innerHTML = `
    <div class="pd-head">
      <button class="btn pd-back" id="profBack">← Volver a la lista</button>
      <div class="pd-title-wrap">
        <h2 class="pd-title">${esc(name)}</h2>
        <div class="pd-sub">
          <span class="pd-turno">${turnoLabel}</span>
          ${link ? `· <a href="${esc(link)}" target="_blank" rel="noopener" class="pd-link">🔗 Fuente</a>` : ""}
          ${man ? `<span class="pd-tag manual" title="Calificaciones del CSV manual">manual</span>` : `<span class="pd-tag oficial" title="Calificaciones de metrics.js">oficial</span>`}
        </div>
      </div>
    </div>

    <div class="pd-metrics">
      <div class="pd-m"><div class="pd-m-label">Calidad</div>${metricCell(m.calidad, "cal")}</div>
      <div class="pd-m"><div class="pd-m-label">Lo recomiendan</div>${metricCell(m.recomiendan, "rec")}</div>
      <div class="pd-m"><div class="pd-m-label">Dificultad</div>${metricCell(m.dificultad, "dif")}</div>
    </div>

    <h3 class="pd-section">Horario semanal</h3>
    ${tablaHTML}

    <h3 class="pd-section">Fuentes</h3>
    ${fuentesHTML(link)}
  `;

  document.getElementById("profBack").onclick = hideProfDetail;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Nombre legible del sitio a partir del dominio del link
function siteLabel(link) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    if (/misprofesores/i.test(host)) return "MisProfesores.com";
    return host;
  } catch (e) { return "Fuente"; }
}

// Apartado "Fuentes": link completo y clickeable del maestro
function fuentesHTML(link) {
  if (!link) {
    return `<div class="drop-empty">Sin fuente registrada para este maestro.</div>`;
  }
  return `<ul class="pd-fuentes">
    <li>
      <a href="${esc(link)}" target="_blank" rel="noopener" class="pd-fuente">
        <span class="pd-fuente-ico">🔗</span>
        <span class="pd-fuente-txt">
          <b>${esc(siteLabel(link))}</b>
          <span class="pd-fuente-url">${esc(link)}</span>
        </span>
        <span class="pd-fuente-go">Abrir ↗</span>
      </a>
    </li>
  </ul>`;
}

function hideProfDetail() {
  currentProfDetail = null;
  profDetailEl.hidden = true;
  profDetailEl.innerHTML = "";
  if (profsPaneHead) profsPaneHead.hidden = false;
  if (profsListWrap) profsListWrap.hidden = false;
}

// Al cambiar de pestaña vía botones, si salimos de maestros, reset del detalle
tabsEl.querySelectorAll(".tab").forEach((btn) => {
  const prev = btn.onclick;
  btn.addEventListener("click", () => {
    if (btn.dataset.tab !== "maestros") hideProfDetail();
  });
});

// P16: filtro por turno (Ambos / Matutino / Vespertino)
document.getElementById("turnoFilter").addEventListener("click", (e) => {
  const btn = e.target.closest(".turno-btn");
  if (!btn) return;
  profTurno = btn.dataset.turno;
  document.querySelectorAll("#turnoFilter .turno-btn").forEach((b) =>
    b.classList.toggle("active", b === btn));
  renderProfs();
});

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

// Bloques de clase (horas de inicio). El índice mide huecos en la rejilla.
const BLOQUE_INI = ["07:00","08:30","10:30","12:00","13:30","15:00","16:30","18:30","20:00"];
function bloqueIdx(ini) {
  const i = BLOQUE_INI.indexOf(ini);
  if (i !== -1) return i;
  const min = hhmmToMin(ini); let best = 0;
  BLOQUE_INI.forEach((b, k) => { if (hhmmToMin(b) <= min) best = k; });
  return best;
}
// Horas muertas: bloques vacíos entre la 1.ª y la última clase de cada día
function contarHuecos(items) {
  const byDay = {};
  items.forEach((it) => (it.sesiones || []).forEach((s) => {
    (byDay[s.dia] = byDay[s.dia] || []).push(bloqueIdx(s.ini));
  }));
  let huecos = 0;
  Object.values(byDay).forEach((idxs) => {
    idxs.sort((a, b) => a - b);
    huecos += (idxs[idxs.length - 1] - idxs[0] + 1) - idxs.length;
  });
  return huecos;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Semestre que estás armando: el más alto entre las materias "nuevas" ya puestas a mano;
// si no hay, el más bajo con pendientes inscribibles.
function detectarSemestreObjetivo(base) {
  const sems = base.filter((h) => h.tipo !== "recurse")
    .map((h) => { const m = String(h.sid).match(/^s(\d+)-/); return m ? parseInt(m[1]) : null; })
    .filter((x) => x != null);
  if (sems.length) return Math.max(...sems);
  for (let s = 0; s < PLAN.length; s++) {
    const hayPend = PLAN[s].materias.some(([name], i) => {
      const id = idOf(s, i);
      const r = getSub(id, name);
      return r.status === "pendiente" && canInscribir(r) && !OPT_SLOTS[id];
    });
    if (hayPend) return s;
  }
  return detectarSemestreActual();
}

// ============================================================
//  SERIACIÓN (linealidad del plan, según la imagen del mapa curricular)
//  dependiente → [prerequisito(s)]. La dependiente SOLO se puede meter en
//  modo Auto si TODOS sus prerequisitos están APROBADOS (si alguno está
//  reprobado o pendiente, se bloquea). Excepción del usuario marcada (★).
// ============================================================
const SERIACION = {
  "CALCULO APLICADO": ["CALCULO"],
  "ALGEBRA LINEAL": ["ANALISIS VECTORIAL"],                                   // ★ excepción (no Mecánica)
  "ALGORITMOS Y ESTRUCTURA DE DATOS": ["FUNDAMENTOS DE PROGRAMACION"],
  "ECUACIONES DIFERENCIALES": ["CALCULO APLICADO"],
  "CIRCUITOS ELECTRICOS": ["MECANICA Y ELECTROMAGNETISMO"],
  "ANALISIS Y DISENO DE ALGORITMOS": ["ALGORITMOS Y ESTRUCTURA DE DATOS"],
  "PARADIGMAS DE PROGRAMACION": ["ALGORITMOS Y ESTRUCTURA DE DATOS"],
  "ELECTRONICA ANALOGICA": ["CIRCUITOS ELECTRICOS"],
  "DISENO DE SISTEMAS DIGITALES": ["FUNDAMENTOS DE DISENO DIGITAL"],
  "TEORIA DE LA COMPUTACION": ["ANALISIS Y DISENO DE ALGORITMOS"],
  "TECNOLOGIAS PARA DESARROLLO DE APLICACIONES WEB": ["BASES DE DATOS"],
  "MATEMATICAS AVANZADAS PARA LA INGENIERIA": ["ECUACIONES DIFERENCIALES"],
  "ARQUITECTURA DE COMPUTADORAS": ["DISENO DE SISTEMAS DIGITALES"],
  "COMPILADORES": ["ANALISIS Y DISENO DE ALGORITMOS"],
  "INSTRUMENTACION Y CONTROL": ["ELECTRONICA ANALOGICA"],
  "SISTEMAS EN CHIP": ["ARQUITECTURA DE COMPUTADORAS"],
  "PROCESAMIENTO DIGITAL DE SENALES": ["MATEMATICAS AVANZADAS PARA LA INGENIERIA"],
  "INGENIERIA DE SOFTWARE": ["ANALISIS Y DISENO DE SISTEMAS"],
  "APLICACIONES PARA COMUNICACIONES EN RED": ["REDES DE COMPUTADORAS"],
  "ADMINISTRACION DE SERVICIOS EN RED": ["REDES DE COMPUTADORAS"],
  "SISTEMAS DISTRIBUIDOS": ["SISTEMAS OPERATIVOS"],
};
const VENTANA_SEM = 3; // máximo de semestres que puede abarcar el horario auto

function buscarMateriaPlan(normName) {
  for (let s = 0; s < PLAN.length; s++) {
    const arr = PLAN[s].materias;
    for (let i = 0; i < arr.length; i++) {
      if (norm(arr[i][0]) === normName) return { s, i, id: idOf(s, i), name: arr[i][0] };
    }
  }
  return null;
}

// ¿Los prerequisitos de la materia están todos aprobados? (sin prereq = libre)
function prereqsAprobados(name) {
  const reqs = SERIACION[norm(name)];
  if (!reqs || !reqs.length) return true;
  return reqs.every((rn) => {
    const mt = buscarMateriaPlan(rn);
    if (!mt) return true; // prereq no hallado en el plan: no bloquear
    return getSub(mt.id, mt.name).status === "aprobada";
  });
}

// Nombre legible del/los prereq(s) que faltan por aprobar (para el mensaje)
function prereqFaltante(name) {
  const reqs = SERIACION[norm(name)];
  if (!reqs) return null;
  for (const rn of reqs) {
    const mt = buscarMateriaPlan(rn);
    if (mt && getSub(mt.id, mt.name).status !== "aprobada") return mt.name;
  }
  return null;
}

// Ajusta la ventana horaria sugerida según el turno elegido
document.getElementById("autoTurno").addEventListener("change", (e) => {
  const v = e.target.value;
  const ent = document.getElementById("autoEntrada");
  const sal = document.getElementById("autoSalida");
  if (v === "M") { ent.value = "07:00"; sal.value = "15:00"; }
  else if (v === "V") { ent.value = "12:00"; sal.value = "21:30"; }
  else { ent.value = "07:00"; sal.value = "21:30"; }
});

// Estado del generador (para el botón "Otra opción")
let autoPool = [];        // soluciones distintas, todas con el máximo de materias colocadas
let autoLastKey = null;   // última combinación mostrada (para no repetir)
let autoCtx = null;       // { semNombre, totalFaltantes }

function keyDeSol(sol) { return sol.elegidas.map((e) => e.sid + ":" + e.grupo).sort().join("|"); }

function generarHorarioAuto() {
  const entrada = document.getElementById("autoEntrada").value;
  const salida = document.getElementById("autoSalida").value;
  const turno = document.getElementById("autoTurno").value;
  const maxMat = Math.max(1, Math.min(9, parseInt(document.getElementById("autoMax").value) || 7));
  const resultEl = document.getElementById("autoResult");
  const otraBtn = document.getElementById("autoOtraBtn");

  if (!entrada || !salida) { alert("Captura hora de entrada y salida."); return; }
  const iniMin = hhmmToMin(entrada);
  const finMin = hhmmToMin(salida);
  if (iniMin >= finMin) { alert("La hora de salida debe ser mayor que la de entrada."); return; }

  const base = state.horario.filter((h) => !h._auto);
  const credBloq = creditosBloqueados();
  const credBase = base.reduce((a, h) => a + h.cred, 0);
  const credDisponibles = MAX_CRED - credBloq - credBase;

  // 1) Todas las pendientes inscribibles que no estén ya en el horario
  const pendientes = [];
  for (let s = 0; s < PLAN.length; s++) {
    PLAN[s].materias.forEach(([name, cred], i) => {
      const id = idOf(s, i);
      if (OPT_SLOTS[id]) return;
      const rec = getSub(id, name);
      if (rec.status === "pendiente" && canInscribir(rec) && !base.some((h) => h.sid === id)) {
        pendientes.push({ id, name, cred, i, s, recurse: rec.veces >= 2 });
      }
    });
  }

  if (pendientes.length === 0) {
    autoPool = []; autoLastKey = null; autoCtx = null;
    if (otraBtn) otraBtn.hidden = true;
    resultEl.innerHTML = `<div class="auto-warn">No faltan materias por inscribir (o ya las tienes en el horario).</div>`;
    return;
  }

  // 2) Seriación: la dependiente solo entra si su prerequisito está aprobado
  const bloqueadasSer = pendientes.filter((f) => !prereqsAprobados(f.name));
  let faltantes = pendientes.filter((f) => prereqsAprobados(f.name));

  if (faltantes.length === 0) {
    autoPool = []; autoLastKey = null; autoCtx = null;
    if (otraBtn) otraBtn.hidden = true;
    const ejemplo = bloqueadasSer[0];
    const req = ejemplo ? prereqFaltante(ejemplo.name) : null;
    resultEl.innerHTML = `<div class="auto-warn">Todas las pendientes están bloqueadas por seriación` +
      (req ? ` (ej.: <b>${esc(ejemplo.name)}</b> necesita aprobar <b>${esc(req)}</b>)` : "") +
      `. Aprueba/captura los prerequisitos primero o agrégalas a mano.</div>`;
    return;
  }

  // 3) Ventana de semestres: ancla en el semestre más bajo con pendientes
  //    colocables y permite a lo más VENTANA_SEM semestres (ej. 1 → 1,2,3).
  const minSem = Math.min(...faltantes.map((f) => f.s));
  const maxSem = minSem + (VENTANA_SEM - 1);
  const fueraVentana = faltantes.filter((f) => f.s > maxSem);
  faltantes = faltantes.filter((f) => f.s <= maxSem);

  if (credDisponibles <= 0) {
    autoPool = []; if (otraBtn) otraBtn.hidden = true;
    resultEl.innerHTML = `<div class="auto-warn">No hay créditos disponibles (${fmt(credBase)} inscritos + ${fmt(credBloq)} bloqueados = ${fmt(credBase + credBloq)} de ${MAX_CRED}).</div>`;
    return;
  }

  const addMax = Math.max(0, maxMat - base.length);
  if (addMax === 0) {
    if (otraBtn) otraBtn.hidden = true;
    resultEl.innerHTML = `<div class="auto-warn">Ya tienes ${base.length} materias en el horario (tu tope es ${maxMat}). Sube el tope para agregar más.</div>`;
    return;
  }

  const cand = faltantes.map((f) => {
    const ofs = scheduleFor(f.s, f.i)
      .filter((e) => turno === "ambos" || (turnoDeGrupo(e.grupo) || "M") === turno)
      .filter((e) => ofertaCaeEnVentana(e.sesiones, iniMin, finMin))
      .filter((e) => !base.some((h) => sesionesChocan(h.sesiones, e.sesiones)));
    return { ...f, ofs };
  });

  const bySem = {};
  for (const f of cand) (bySem[f.s] = bySem[f.s] || []).push(f);
  const semKeys = Object.keys(bySem).sort((a, b) => a - b);

  const soluciones = [];
  const seen = new Set();
  for (let iter = 0; iter < 600; iter++) {
    const orden = [];
    for (const s of semKeys) orden.push(...shuffle([...bySem[s]]));

    const elegidas = [];
    let credAcum = 0;
    for (const f of orden) {
      if (elegidas.length >= addMax) break;
      if (credAcum + f.cred > credDisponibles) continue;
      const ops = shuffle(f.ofs).filter((of) => !elegidas.some((e) => sesionesChocan(e.sesiones, of.sesiones)));
      if (ops.length) {
        const of = ops[0];
        elegidas.push({
          sid: f.id, materia: f.name, maestro: of.profesor, grupo: of.grupo,
          edificio: of.edificio, salon: of.salon, sesiones: of.sesiones,
          cred: f.cred, tipo: f.recurse ? "recurse" : "nueva", _auto: true,
        });
        credAcum += f.cred;
      }
    }
    if (!elegidas.length) continue;
    const key = elegidas.map((e) => e.sid + ":" + e.grupo).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    soluciones.push({ elegidas, placed: elegidas.length, huecos: contarHuecos(base.concat(elegidas)) });
  }

  if (!soluciones.length) {
    autoPool = []; if (otraBtn) otraBtn.hidden = true;
    resultEl.innerHTML = `<div class="auto-warn">⚠️ No se pudo cuadrar ninguna materia faltante en esa ventana. Amplía tu horario de entrada/salida o cambia de turno.</div>`;
    return;
  }

  soluciones.sort((a, b) => b.placed - a.placed || a.huecos - b.huecos);
  const bestPlaced = soluciones[0].placed;
  const minHuecos = soluciones.find((s) => s.placed === bestPlaced).huecos;
  autoPool = soluciones.filter((s) => s.placed === bestPlaced && s.huecos === minHuecos);
  autoLastKey = null;
  autoCtx = {
    totalFaltantes: faltantes.length,
    bloqueadasSer: bloqueadasSer.length,
    fueraVentana: fueraVentana.length,
    minSem, maxSem,
  };

  aplicarSolucionAuto();
}

// Aplica una solución del pool (aleatoria y distinta a la anterior) sobre la base manual
function aplicarSolucionAuto() {
  if (!autoPool.length || !autoCtx) return;
  const resultEl = document.getElementById("autoResult");
  const otraBtn = document.getElementById("autoOtraBtn");
  const base = state.horario.filter((h) => !h._auto);

  let pool = autoPool;
  if (autoPool.length > 1 && autoLastKey) {
    const filtered = autoPool.filter((s) => keyDeSol(s) !== autoLastKey);
    if (filtered.length) pool = filtered;
  }
  const sol = pool[Math.floor(Math.random() * pool.length)];
  autoLastKey = keyDeSol(sol);

  state.horario = base.concat(sol.elegidas);
  save();
  renderHorario();

  if (otraBtn) otraBtn.hidden = autoPool.length < 2;

  const totalCred = state.horario.reduce((a, e) => a + e.cred, 0);
  const colocadas = sol.elegidas.length;
  const sinFit = autoCtx.totalFaltantes - colocadas;
  const porSem = {};
  sol.elegidas.forEach((e) => {
    const m = e.sid.match(/^s(\d+)-/);
    const s = m ? parseInt(m[1]) : 0;
    (porSem[s] = porSem[s] || []).push(e);
  });
  const resumenSems = Object.keys(porSem).sort((a, b) => a - b)
    .map((s) => `${porSem[s].length} de ${PLAN[s].sem}`).join(", ");
  let html = `<div class="auto-ok">✅ Agregué <b>${colocadas}</b> materia(s): ${resumenSems}. ` +
    `Horario: <b>${state.horario.length}</b> materias · ${fmt(totalCred)} créditos · ` +
    `<b>${sol.huecos === 0 ? "sin horas muertas" : sol.huecos + " hueco(s)"}</b>.</div>`;
  if (sinFit > 0) {
    html += `<div class="auto-warn">⚠️ ${sinFit} materia(s) no cupieron sin chocar en tu ventana de horas. Amplía el horario o agrégalas a mano.</div>`;
  }
  if (autoPool.length > 1) {
    html += `<div class="auto-hint">¿No te convence? Pulsa <b>🎲 Otra opción</b> para barajar otra combinación igual de compacta.</div>`;
  }
  resultEl.innerHTML = html;
}

document.getElementById("autoGenBtn").onclick = () => generarHorarioAuto();
document.getElementById("autoOtraBtn").onclick = () => {
  if (autoPool.length) aplicarSolucionAuto(); else generarHorarioAuto();
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
loadManualMetrics();

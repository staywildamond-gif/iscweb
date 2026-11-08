// ============================================================
//  CARRERA ACTIVA
// ============================================================
// `CARRERA`, `carreraActiva()` y `PLAN_ACTIVO` viven en data.js, que carga antes
// que este archivo. Aquí solo lo que se usa en tiempo de ejecución.

// Ofertas de la carrera activa. TODO lo que lea SCHEDULE debe pasar por aquí,
// o se cuelan las ofertas de las otras dos carreras.
function schedActual() {
  const sched = typeof SCHEDULE !== "undefined" ? SCHEDULE : [];
  return sched.filter((e) => e.carrera === CARRERA);
}

// ============================================================
//  PERSISTENCIA
// ============================================================
let memFallback = null;

function blankState() {
  return { subjects: {}, horario: [], teacherMats: {} };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw) return blankState();
    return {
      subjects: raw.subjects || {},
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

// ---- Cupos (ocupabilidad) — índice grupo+materia → {cupo, ins, disp} ----
// cupos.js llega diferido (ver lazy.js), así que los índices arrancan vacíos y
// se llenan cuando el archivo aterriza. Mientras tanto cupoDe() devuelve null y
// las etiquetas de cupo simplemente no se pintan.
const cuposIndex = {};
const cuposHistIndex = {};   // por periodo (CUPOS_HIST del cupos.js)

function indexarCupos() {
  if (typeof CUPOS !== "undefined" && Array.isArray(CUPOS)) {
    CUPOS.forEach((c) => { cuposIndex[c.g + "|" + norm(c.m)] = c; });
  }
  if (typeof CUPOS_HIST !== "undefined" && CUPOS_HIST) {
    Object.keys(CUPOS_HIST).forEach((p) => {
      cuposHistIndex[p] = {};
      (CUPOS_HIST[p] || []).forEach((c) => { cuposHistIndex[p][c.g + "|" + norm(c.m)] = c; });
    });
  }
}
indexarCupos();   // por si cupos.js se cargó antes (file:// o cache)

function cupoDe(grupo, materia) {
  if (!grupo || !materia) return null;
  return cuposIndex[grupo + "|" + norm(materia)] || null;
}
function cupoHistDe(grupo, materia, periodo) {
  const idx = cuposHistIndex[periodo];
  if (!idx || !grupo || !materia) return null;
  return idx[grupo + "|" + norm(materia)] || null;
}
// Etiqueta compacta "N/M" (inscritos/cupo) para un cupo histórico
function cupoHistTag(c) {
  if (!c) return "";
  const level = c.disp < 0 ? "full" : c.disp === 0 ? "full" : c.disp <= 5 ? "low" : "ok";
  return `<span class="cupo-tag" data-cupo="${level}" title="${c.ins} inscritos de ${c.cupo} · ${c.disp} disponibles">${c.ins}/${c.cupo}</span>`;
}
// Etiqueta "X lugares" / "Lleno" / "Sobrecupo" con color por disponibilidad.
function cupoBadge(grupo, materia) {
  const c = cupoDe(grupo, materia);
  if (!c) return "";
  const d = c.disp;
  let level, text;
  if (d < 0)        { level = "full"; text = "Sobrecupo"; }
  else if (d === 0) { level = "full"; text = "Lleno"; }
  else if (d <= 5)  { level = "low";  text = d + (d === 1 ? " lugar" : " lugares"); }
  else              { level = "ok";   text = d + " lugares"; }
  return `<span class="cupo-tag" data-cupo="${level}" title="${c.ins}/${c.cupo} inscritos · ${d} disponibles">${text}</span>`;
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

// Fuentes/métricas manuales de maestros (ganan sobre TEACHER_METRICS; si falta, cae al seed).
// Se llenan desde MANUAL_LINKS (maestros_manual.js) al cargar la página.
const MANUAL_METRICS = {};      // nombre exacto → {calidad, recomiendan, dificultad, link}
const MANUAL_METRICS_NORM = {}; // norm(nombre) → mismo objeto (fallback por normalización)

function manualMetricFor(name) {
  return MANUAL_METRICS[name] || MANUAL_METRICS_NORM[norm(name)] || null;
}

function getMetric(name) {
  // El manual (maestros_manual.js) gana; si falta un campo, cae al seed de metrics.js.
  const man = manualMetricFor(name) || {};
  const seed = TEACHER_METRICS_NORM[norm(name)] || {};
  const pick = (k) =>
    man[k] !== undefined && man[k] !== null && man[k] !== "" ? man[k]
    : seed[k] !== undefined && seed[k] !== null && seed[k] !== "" ? seed[k]
    : "";
  return { calidad: pick("calidad"), recomiendan: pick("recomiendan"), dificultad: pick("dificultad") };
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
  repintarActiva();   // lazy.js — cubre las 6 pestañas y la ficha del maestro
}

function loadManualMetrics() {
  // Fuente: maestros_manual.js (cargado con <script>). Funciona también sin
  // servidor (file://). Para actualizar: edita maestros_manual.csv y corre build.ps1.
  if (typeof MANUAL_LINKS === "undefined" || !MANUAL_LINKS) return;
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

// Nombre legible de la materia para un slot (incluye optativa elegida)
function subjectName(s, i) {
  const id = idOf(s, i);
  const def = PLAN[s].materias[i][0];
  if (OPT_SLOTS[id]) return getSub(id, def).name;
  return def;
}

// Ofertas reales (SCHEDULE) que aplican a un slot del plan
function scheduleFor(s, i) {
  const id = idOf(s, i);
  const slot = OPT_SLOTS[id];
  const sched = schedActual();
  if (slot) {
    // IA y LCD no tienen ramas A/B ni roster: el slot acepta cualquier optativa
    // de ese semestre que ESCOM haya abierto este periodo.
    if (CARRERA !== "ISC") {
      const nombres = new Set(
        PLAN_ACTIVO.optativas.filter((o) => o.sem === slot.sem).map((o) => norm(o.saes))
      );
      const sc = String(slot.sem);
      return sched.filter((e) => e.grupo.startsWith(sc) && nombres.has(norm(e.materia)));
    }
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
// `schedule.js` guarda los nombres normalizados (sin acentos) y `metrics.js`,
// `roster.js` y `maestros_manual.csv` los conservan. Sin estos dos índices, el
// mismo profe sale dos veces en la lista y pierde su métrica.
const TEACHER_METRICS_NORM = (() => {
  const m = {};
  if (typeof TEACHER_METRICS !== "undefined") {
    Object.keys(TEACHER_METRICS).forEach((k) => { m[norm(k)] = TEACHER_METRICS[k]; });
  }
  return m;
})();

// Nombre para mostrar: gana el que traiga acentos.
const NOMBRE_PROF = (() => {
  const m = new Map();
  const put = (n) => {
    if (!n) return;
    const k = norm(n);
    if (!m.has(k) || n !== k) m.set(k, n);
  };
  if (typeof TEACHER_METRICS !== "undefined") Object.keys(TEACHER_METRICS).forEach(put);
  if (typeof ROSTER !== "undefined") ROSTER.forEach((e) => put(e.t));
  return m;
})();
function nombreProf(n) { return NOMBRE_PROF.get(norm(n)) || n; }

function allTeachers() {
  // Índice rápido: materia → primer índice de semestre del plan
  const matToSem = new Map();
  PLAN.forEach((blk, sIdx) => blk.materias.forEach(([mat]) => {
    const k = norm(mat);
    if (!matToSem.has(k)) matToSem.set(k, sIdx + 1);
  }));

  const map = {};
  // Indexado por nombre normalizado para que "MOLINA PÉREZ" y "MOLINA PEREZ"
  // sean el mismo maestro.
  const add = (nombre) => {
    const k = norm(nombre);
    if (!map[k]) map[k] = { name: nombreProf(nombre), materias: new Set(), grupos: new Set(), semestres: new Set() };
    return map[k];
  };

  // Fuente principal: las ofertas reales de LAS TRES carreras. La lista de
  // maestros no se separa por carrera (las métricas son globales); el selector
  // de carrera manda sobre el plan y el horario, no sobre quién aparece aquí.
  const ofertas = typeof SCHEDULE !== "undefined" ? SCHEDULE : [];
  ofertas.forEach((o) => {
    if (!o.profesor) return;
    const t = add(o.profesor);
    t.materias.add(o.materia);
    if (o.grupo) { t.grupos.add(o.grupo); t.semestres.add(parseInt(o.grupo[0])); }
  });

  // ROSTER es solo de ISC, pero suma: trae los profes con métrica que no dan clase
  // este periodo, y los nombres de slot OPTATIVA A1/B1/A2/B2 que el horario no usa.
  ROSTER.forEach((e) => {
    const t = add(e.t);
    t.materias.add(e.m);
    // Extraer grupos del campo g (ej: "1CM1, 1CM5" o "6CM3 (Big Data)")
    (e.g || "").split(",").forEach((gp) => {
      const m = gp.trim().match(/^[1-8][A-Z]{2}\d+/);
      if (m) { t.grupos.add(m[0]); t.semestres.add(parseInt(m[0][0])); }
    });
    const semFromMat = matToSem.get(norm(e.m));
    if (semFromMat) t.semestres.add(semFromMat);
    // Para optativas, derivar semestre del slot (A1/B1 → 6, A2/B2 → 7)
    const optMatch = e.m.match(/OPTATIVA\s+([AB])([12])/);
    if (optMatch) t.semestres.add(optMatch[2] === "1" ? 6 : 7);
  });

  return Object.values(map).map((x) => ({
    name: x.name,
    materias: [...x.materias],
    grupos: [...x.grupos].sort(),
    semestres: [...x.semestres].sort((a, b) => a - b),
  }));
}
const TEACHERS = allTeachers();

// En qué carreras da clase cada profe (las métricas son globales, un profe se
// comparte entre carreras).
const CARRERAS_DE_PROF = (() => {
  const m = new Map();
  (typeof SCHEDULE !== "undefined" ? SCHEDULE : []).forEach((o) => {
    if (!o.profesor) return;
    const k = norm(o.profesor);
    if (!m.has(k)) m.set(k, new Set());
    m.get(k).add(o.carrera);
  });
  return m;
})();

function carreraBadges(name) {
  const set = CARRERAS_DE_PROF.get(norm(name));
  if (!set || set.size === 0) return "";
  return [...set].sort().map((c) =>
    `<span class="cbadge c-${c.toLowerCase()}${c === CARRERA ? " propia" : ""}" title="${c}">${c}</span>`
  ).join("");
}

// Catálogo de materias de la carrera activa (para el menú "Agregar materia")
const ALL_MATERIAS = (() => {
  const seen = new Set(); const out = [];
  TEACHERS.flatMap((t) => t.materias).sort((a, b) => a.localeCompare(b)).forEach((m) => {
    const k = norm(m); if (!seen.has(k)) { seen.add(k); out.push(m); }
  });
  return out;
})();

// Turno (M/V) a partir del código de grupo. 3.er char: M=matutino, V=vespertino.
function turnoDeGrupo(g) {
  const m = String(g).trim().match(/^[1-8][A-Z]([MV])/);
  return m ? m[1] : null;
}

// Carrera codificada en la 2.ª letra del grupo: C=ISC, B=IA, A=LCD.
// Es un RESPALDO, no la fuente: las ofertas traen campo `carrera` explícito
// (CLAUDE.md §9) y hay que usar ese. Esto solo sirve para datos viejos que
// todavía no lo tengan.
const LETRA_CARRERA = { C: "ISC", B: "IA", A: "LCD" };
function carreraDeGrupo(g) {
  const m = String(g).trim().match(/^[1-8]([A-Z])[MV]/);
  return m ? (LETRA_CARRERA[m[1]] || null) : null;
}

// La carrera de una oferta: el campo si lo trae, y si no, deducida del grupo
function carreraDeOferta(o) {
  return o.carrera || carreraDeGrupo(o.grupo);
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

// Materias que imparte un maestro en la carrera activa (horario + roster en ISC).
// Sale de TEACHERS, que ya hizo esa unión.
const _matsPorProf = new Map(TEACHERS.map((t) => [t.name, t.materias]));
function rosterMatsOf(name) {
  return _matsPorProf.get(name) || [];
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


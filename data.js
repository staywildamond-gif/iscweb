// ============================================================
//  CARRERA ACTIVA
// ============================================================
// Una sola carrera activa por usuario; su avance vive en su propia clave de
// localStorage. Cambiar de carrera NO migra el avance (así lo pidió el usuario).
const CARRERA_KEY = "escom_carrera";
const CARRERAS_VALIDAS = ["ISC", "IA", "LCD"];

function carreraActiva() {
  try {
    const c = localStorage.getItem(CARRERA_KEY);
    if (CARRERAS_VALIDAS.includes(c)) return c;
  } catch (e) { /* localStorage bloqueado: nos quedamos con el default */ }
  return "ISC";
}

const CARRERA = carreraActiva();
const PLAN_ACTIVO = PLANES[CARRERA];

// ============================================================
//  PLAN DE ESTUDIOS (derivado de planes.js según la carrera activa)
// ============================================================
// Forma heredada: [{ sem: "1.er semestre", materias: [[nombre, créditos], ...] }]
// El ORDEN importa: los ids son s{semestre0}-{índice0} y el avance guardado en
// localStorage se indexa por ellos. Ese orden lo manda nombres.csv, no la clave.
const SEM_NOMBRE = ["1.er", "2.º", "3.er", "4.º", "5.º", "6.º", "7.º", "8.º"];
const CR_OPTATIVA = (PLAN_ACTIVO.optativas[0] && PLAN_ACTIVO.optativas[0].cr) || 7.5;

const PLAN = [];
for (let s = 1; s <= 8; s++) {
  const materias = PLAN_ACTIVO.materias.filter((m) => m.sem === s).map((m) => [m.nom, m.cr]);
  PLAN_ACTIVO.slots
    .filter((sl) => sl.sem === s)
    .forEach((sl) => materias.push(["Optativa " + sl.label, CR_OPTATIVA]));
  PLAN.push({ sem: SEM_NOMBRE[s - 1] + " semestre", materias });
}

// Dónde cayó cada slot de optativa. Se recalcula porque depende de cuántas
// obligatorias trae el semestre, y eso cambia por carrera:
// ISC sem 6 tiene 5 obligatorias -> A1/B1 son s5-5 y s5-6; IA tiene 4 -> s5-4 y s5-5.
const OPT_SLOTS = {};
PLAN.forEach((blk, s) => {
  blk.materias.forEach((m, i) => {
    const sl = PLAN_ACTIVO.slots.find((x) => x.sem === s + 1 && "Optativa " + x.label === m[0]);
    if (sl) OPT_SLOTS["s" + s + "-" + i] = { label: sl.label, sem: sl.sem, defName: m[0] };
  });
});

// Puente clave oficial <-> id de posición. La seriación de `planes.js` va por
// clave (`C203`) y el estado del alumno por id (`s1-2`); esto los une.
const ID_DE_CLAVE = {};
const CLAVE_DE_ID = {};
PLAN.forEach((blk, s) => {
  blk.materias.forEach((m, i) => {
    const mat = PLAN_ACTIVO.materias.find((x) => x.sem === s + 1 && x.nom === m[0]);
    if (!mat) return; // los slots de optativa no tienen clave fija
    const id = "s" + s + "-" + i;
    ID_DE_CLAVE[mat.clave] = id;
    CLAVE_DE_ID[id] = mat.clave;
  });
});

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
const TOTAL = PLAN_ACTIVO.creditos;       // ISC 387 · IA 351 · LCD 366
const MAX_CRED = PLAN_ACTIVO.maxCred;     // 55 en las tres (tope institucional)
// ISC conserva su clave original para no perder el avance ya capturado.
const KEY = CARRERA === "ISC" ? "avanceISC_v2" : "avance_" + CARRERA + "_v1";

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


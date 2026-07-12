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


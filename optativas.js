// ========== CATÁLOGO DE OPTATIVAS POR ESPECIALIZACIÓN ==========
// Estas materias se renderizan en el panel lateral de la página principal.
const ESPECIALIZACIONES = [
  {
    nombre: "Big Data",
    icono: "BD",
    materias: [
      { sem: 6, clave: "C604", nombre: "Bases de datos no relacionales", en: "Non-Relational Databases" },
      { sem: 7, clave: "C703", nombre: "Big Data", en: "Big Data" },
    ],
  },
  {
    nombre: "Desarrollo de aplicaciones",
    icono: "DA",
    materias: [
      { sem: 6, clave: "C605", nombre: "Aseguramiento de la calidad del software y patrones de diseño", en: "Software Quality Assurance and Design Patterns" },
      { sem: 7, clave: "C704", nombre: "Frameworks de cliente web y backend", en: "Web Client and Backend Development Frameworks" },
    ],
  },
  {
    nombre: "Minería de datos",
    icono: "MD",
    materias: [
      { sem: 6, clave: "C606", nombre: "Herramientas estadísticas para analítica de datos", en: "Statistical Tools for Data Analytics" },
      { sem: 7, clave: "C705", nombre: "Minería de datos", en: "Data Mining" },
    ],
  },
  {
    nombre: "Instrumentación virtual",
    icono: "IV",
    materias: [
      { sem: 6, clave: "C607", nombre: "Instrumentación virtual", en: "Virtual Instrumentation" },
      { sem: 7, clave: "C706", nombre: "Aplicaciones de instrumentación virtual", en: "Virtual Instrumentation Applications" },
    ],
  },
  {
    nombre: "Internet de las cosas",
    icono: "IoT",
    materias: [
      { sem: 6, clave: "C608", nombre: "Sistemas embebidos", en: "Embedded Systems" },
      { sem: 7, clave: "C707", nombre: "Internet de las cosas", en: "Internet of Things" },
    ],
  },
  {
    nombre: "Gobierno de TI",
    icono: "TI",
    materias: [
      { sem: 6, clave: "C609", nombre: "Seguridad informática", en: "Computer Security" },
      { sem: 7, clave: "C708", nombre: "Gobierno de TI", en: "IT Governance" },
    ],
  },
  {
    nombre: "Criptografía",
    icono: "CR",
    materias: [
      { sem: 6, clave: "C610", nombre: "Introducción a la criptografía", en: "Introduction to Cryptography" },
      { sem: 7, clave: "C709", nombre: "Tópicos selectos en criptografía", en: "Selected Topics in Cryptography" },
    ],
  },
  {
    nombre: "Procesamiento de lenguaje natural",
    icono: "PLN",
    materias: [
      { sem: 6, clave: "C611", nombre: "Aprendizaje automático", en: "Machine Learning" },
      { sem: 7, clave: "C710", nombre: "Procesamiento de lenguaje natural", en: "Natural Language Processing" },
    ],
  },
  {
    nombre: "Algoritmos bioinspirados",
    icono: "AB",
    materias: [
      { sem: 6, clave: "C612", nombre: "Algoritmos genéticos", en: "Genetic Algorithms" },
      { sem: 7, clave: "C711", nombre: "Bioinformática", en: "Bioinformatics" },
    ],
  },
  {
    nombre: "Computación gráfica",
    icono: "CG",
    materias: [
      { sem: 6, clave: "C613", nombre: "Computación gráfica", en: "Computer Graphics" },
      { sem: 7, clave: "C712", nombre: "Realidad virtual y aumentada", en: "Virtual and Augmented Reality" },
    ],
  },
  {
    nombre: "Visión por computadora",
    icono: "VC",
    materias: [
      { sem: 6, clave: "C614", nombre: "Aprendizaje automático aplicado a visión", en: "Machine Learning" },
      { sem: 7, clave: "C713", nombre: "Análisis de imágenes", en: "Image Analysis" },
    ],
  },
  {
    nombre: "Sistemas complejos",
    icono: "SC",
    materias: [
      { sem: 6, clave: "C615", nombre: "Autómatas celulares", en: "Cellular Automata" },
      { sem: 7, clave: "C714", nombre: "Sistemas complejos", en: "Complex Systems" },
    ],
  },
  {
    nombre: "Gestión de empresas de alta tecnología",
    icono: "GE",
    materias: [
      { sem: 6, clave: "C616", nombre: "Gestión de empresas de alta tecnología", en: "High Technology Enterprise Management" },
      { sem: 7, clave: "C715", nombre: "Ingeniería económica", en: "Economic Engineering" },
    ],
  },
  {
    nombre: "Tópicos selectos de computación",
    icono: "TS",
    materias: [
      { sem: 6, clave: "C617", nombre: "Tópicos selectos de computación I", en: "Computing Selected Topics I" },
      { sem: 7, clave: "C716", nombre: "Tópicos selectos de computación II", en: "Computing Selected Topics II" },
    ],
  },
];

const CREDITOS_OPT = 7.5;

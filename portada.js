// ============================================================
//  PORTADA
// ============================================================
// Antes caías directo en una tabla de 50 materias vacías sin saber qué era
// esto. La portada explica qué hace la app, deja elegir carrera y entra.
//
// Se muestra la primera vez y luego solo si pulsas 🏠 (o la tecla H). Las
// cifras NO están escritas a mano: salen de los datos cargados, así que no
// pueden quedar desfasadas cuando cambie el periodo.

const PORTADA_KEY = "escom_portada_vista";
const portadaEl = document.getElementById("portada");
const appEl = document.getElementById("app");

function fmtMiles(n) { return n.toLocaleString("es-MX"); }

// ---------- cifras ----------
function ptCifras() {
  const sched = typeof SCHEDULE !== "undefined" ? SCHEDULE : [];
  const materias = Object.values(PLANES)
    .reduce((a, p) => a + p.materias.length + p.slots.length, 0);
  return [
    { n: Object.keys(PLANES).length, lbl: "carreras" },
    { n: materias, lbl: "materias" },
    { n: new Set(sched.map((e) => e.grupo)).size, lbl: "grupos" },
    { n: sched.length, lbl: "ofertas" },
    { n: typeof TEACHERS !== "undefined" ? TEACHERS.length : 0, lbl: "maestros" },
  ];
}

// ---------- tarjetas de carrera ----------
function ptDatosCarrera(cod) {
  const p = PLANES[cod];
  const sched = typeof SCHEDULE !== "undefined" ? SCHEDULE : [];
  const ofertas = sched.filter((e) => e.carrera === cod);
  return {
    cod,
    nombre: (typeof CARRERA_NOMBRE !== "undefined" && CARRERA_NOMBRE[cod]) || cod,
    creditos: p.creditos,
    materias: p.materias.length + p.slots.length,
    optativas: p.optativas.length,
    grupos: new Set(ofertas.map((e) => e.grupo)).size,
  };
}

function renderPortada() {
  const stats = document.getElementById("ptStats");
  if (stats) {
    stats.innerHTML = ptCifras().map((c) =>
      `<div class="pt-stat"><b>${fmtMiles(c.n)}</b><span>${c.lbl}</span></div>`).join("");
  }

  const cont = document.getElementById("ptCarreras");
  if (cont) {
    cont.innerHTML = CARRERAS_VALIDAS.map((cod) => {
      const d = ptDatosCarrera(cod);
      const activa = cod === CARRERA;
      return `<button class="pt-car${activa ? " activa" : ""}" data-car="${cod}">
          ${activa ? `<span class="pt-car-chip">la que llevas</span>` : ""}
          <span class="pt-car-sig">${esc(d.cod)}</span>
          <span class="pt-car-nom">${esc(d.nombre)}</span>
          <span class="pt-car-meta">
            ${d.creditos} créditos · ${d.materias} materias · ${d.optativas} optativas<br>
            ${d.grupos} grupos abiertos este periodo
          </span>
        </button>`;
    }).join("");
    cont.querySelectorAll(".pt-car").forEach((b) => {
      b.onclick = () => elegirCarrera(b.dataset.car);
    });
  }

  const pie = document.getElementById("ptPie");
  if (pie) {
    const per = typeof calPeriodoDe === "function" ? calPeriodoDe(calHoy()) : null;
    const periodo = per ? `Periodo <b>${esc(per.id)}</b>, semana ${calSemana(per, calHoy()).n}.` : "";
    pie.innerHTML = `${periodo} Datos tomados del gestor escolar de ESCOM y del calendario
      oficial del IPN. Las calificaciones de los maestros vienen de MisProfesores y se muestran
      tal cual, sin promediarse con nada. Tu avance se guarda <b>solo en este navegador</b>:
      si borras los datos del sitio, se va — usa <b>Guardar respaldo</b> para conservarlo.`;
  }
}

// ---------- entrar / salir ----------
function marcarVista() {
  try { localStorage.setItem(PORTADA_KEY, "1"); } catch (e) { /* modo privado */ }
}

function entrarApp() {
  marcarVista();
  portadaEl.hidden = true;
  appEl.hidden = false;
  document.body.style.overflow = "";
}

function mostrarPortada() {
  renderPortada();
  portadaEl.hidden = false;
  appEl.hidden = true;
  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);
}

function elegirCarrera(cod) {
  if (cod === CARRERA) { entrarApp(); return; }
  // Cambiar de carrera recarga (todo se deriva al cargar). Marcamos la portada
  // como vista para no volver a caer aquí después del reload.
  marcarVista();
  try {
    localStorage.setItem(CARRERA_KEY, cod);
  } catch (e) {
    alert("Este navegador no deja guardar la preferencia de carrera.");
    return;
  }
  location.reload();
}

document.getElementById("ptEntrar")?.addEventListener("click", entrarApp);
document.getElementById("inicioBtn")?.addEventListener("click", mostrarPortada);

// ---------- arranque ----------
// Si llega un horario compartido por URL, la portada estorba: se salta.
let vista = true;
try { vista = localStorage.getItem(PORTADA_KEY) === "1"; } catch (e) { vista = false; }
if (vista || (typeof hayHorarioEnURL === "function" && hayHorarioEnURL())) {
  appEl.hidden = false;
} else {
  mostrarPortada();
}

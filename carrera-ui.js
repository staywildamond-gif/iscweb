// ============================================================
//  SELECTOR DE CARRERA
// ============================================================
// Cambiar de carrera recarga la página: PLAN, OPT_SLOTS, TOTAL, MAX_CRED y KEY
// se derivan de la carrera activa al cargar data.js, así que no se pueden
// recalcular en caliente sin repintar todo. Recargar es más barato y más seguro.
//
// El avance NO se migra entre carreras: cada una tiene su propia clave de
// localStorage (decisión del usuario, ver CLAUDE.md §9).

const CARRERA_NOMBRE = {
  ISC: "Ingeniería en Sistemas Computacionales",
  IA: "Ingeniería en Inteligencia Artificial",
  LCD: "Licenciatura en Ciencia de Datos",
};

function pintarCarrera() {
  const sel = document.getElementById("carreraSel");
  if (sel) sel.value = CARRERA;

  const eyebrow = document.getElementById("carreraEyebrow");
  if (eyebrow) eyebrow.textContent = CARRERA;

  const total = document.getElementById("totalCred");
  if (total) total.textContent = fmt(TOTAL);

  document.title = "Mi avance — " + (CARRERA_NOMBRE[CARRERA] || CARRERA);
}

function cambiarCarrera(nueva) {
  if (!CARRERAS_VALIDAS.includes(nueva) || nueva === CARRERA) return;
  const ok = confirm(
    "¿Cambiar a " + (CARRERA_NOMBRE[nueva] || nueva) + "?\n\n" +
    "Tu avance de " + CARRERA + " se queda guardado, pero cada carrera lleva el suyo: " +
    "en " + nueva + " empiezas con el plan en blanco."
  );
  if (!ok) {
    document.getElementById("carreraSel").value = CARRERA;
    return;
  }
  try {
    localStorage.setItem(CARRERA_KEY, nueva);
  } catch (e) {
    alert("Este navegador no deja guardar la preferencia de carrera.");
    return;
  }
  location.reload();
}

document.getElementById("carreraSel")
  ?.addEventListener("change", (e) => cambiarCarrera(e.target.value));

pintarCarrera();

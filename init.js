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

// Si el enlace trae un horario compartido, aterriza en la pestaña Horario con
// el aviso arriba en vez de en Mi avance, que no es lo que vino a ver.
if (hayHorarioEnURL()) {
  irAPestana("horario");
  avisoHorarioCompartido();
}

// Datos que usan casi todas las pestañas pero que no hacen falta para el primer
// pintado: se piden en cuanto el navegador queda libre y repintan al llegar.
// historial.js no está aquí a propósito — ese es a demanda (ver lazy.js).
prefetchDatos(["cupos.js", "maestros_manual.js"]);

// Service worker: la app abre sin internet una vez visitada. Solo corre en
// https o localhost; en file:// el navegador ni lo intenta y no pasa nada.
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* sin SW, la app funciona igual */ });
  });
}

// ============================================================
//  CARGA DIFERIDA DE DATOS
// ============================================================
// index.html cargaba ~430 KB de literales JS antes de pintar un pixel, y casi
// la mitad era historial.js, que solo usa una pestaña. Aquí quedan los dos
// mecanismos para no pagar eso de entrada:
//
//   cargarDato(archivo)   -> promesa; mete un <script> una sola vez.
//   prefetchDatos([...])  -> lo mismo, pero en cuanto el navegador esté libre.
//
// Qué se carga cuándo:
//   crítico (en index.html):  planes · schedule · roster · metrics · calendario · optativas
//   prefetch tras el 1.er pintado:  cupos.js · maestros_manual.js
//   a demanda:  historial.js  (pestaña Historial y ficha del maestro)
//
// cupos y maestros_manual van en prefetch, no a demanda, porque los usan casi
// todas las pestañas (incluida Mi avance): sacarlos del arranque adelanta el
// pintado y llegan solos unos milisegundos después. historial.js sí es a
// demanda porque nada más lo toca su pestaña.
//
// Funciona en file:// igual que servido: son <script>, no fetch.

const _lazyProm = {};

function cargarDato(archivo) {
  if (_lazyProm[archivo]) return _lazyProm[archivo];
  _lazyProm[archivo] = new Promise((resolver, rechazar) => {
    const s = document.createElement("script");
    s.src = archivo;
    s.onload = () => { alLlegarDato(archivo); resolver(archivo); };
    s.onerror = () => {
      delete _lazyProm[archivo];               // que un reintento pueda volver a pedirlo
      rechazar(new Error("No se pudo cargar " + archivo));
    };
    document.head.appendChild(s);
  });
  return _lazyProm[archivo];
}

// Lo que hay que rehacer cuando un dato diferido por fin llega
function alLlegarDato(archivo) {
  if (archivo === "cupos.js") {
    indexarCupos();
    repintarActiva();
  }
  if (archivo === "maestros_manual.js") {
    loadManualMetrics();                       // ya llama a refreshAfterManual()
  }
}

function prefetchDatos(archivos) {
  const lanzar = () => archivos.forEach((a) => {
    cargarDato(a).catch((e) => console.warn(e.message));
  });
  if ("requestIdleCallback" in window) requestIdleCallback(lanzar, { timeout: 2000 });
  else setTimeout(lanzar, 0);
}

// Vuelve a pintar la pestaña que esté abierta (y la ficha de maestro si está
// encima). Se usa cuando llega un dato que cambia lo que ya está en pantalla.
function repintarActiva() {
  const pane = document.querySelector(".tabpane.active");
  const pintar = pane && {
    "pane-plan": () => render(),
    "pane-maestros": () => renderProfs(),
    "pane-horario": () => renderHorario(),
    "pane-optativas": () => renderOptativas(),
    "pane-historial": () => renderHistorial(),
    "pane-calendario": () => renderCalendario(),
  }[pane.id];
  if (pintar) {
    try { pintar(); } catch (e) { console.warn("repintar " + pane.id, e); }
  }
  if (typeof currentProfDetail !== "undefined" && currentProfDetail &&
      typeof profDetailEl !== "undefined" && profDetailEl && !profDetailEl.hidden) {
    try { showProfDetail(currentProfDetail); } catch (e) { console.warn("repintar ficha", e); }
  }
}

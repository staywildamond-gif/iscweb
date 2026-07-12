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

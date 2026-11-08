// ============================================================
//  TEMA CLARO / OSCURO
// ============================================================
// El tema se aplica en un <script> inline del <head>, antes de que exista este
// archivo: si esperara hasta aquí, la página parpadearía en claro. Esto solo
// se encarga del botón y de recordar la preferencia.
//
// Sin preferencia guardada manda el sistema operativo, y se sigue en vivo: si
// cambias el tema de Windows con la página abierta, la página cambia también.

const TEMA_KEY = "escom_tema";

function temaActual() {
  return document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro";
}

function aplicarTema(t, recordar) {
  document.documentElement.dataset.tema = t;
  if (recordar) {
    try { localStorage.setItem(TEMA_KEY, t); } catch (e) { /* modo privado */ }
  }
  const btn = document.getElementById("temaBtn");
  if (btn) {
    btn.textContent = t === "oscuro" ? "☀️" : "🌙";
    btn.title = t === "oscuro" ? "Cambiar a claro" : "Cambiar a oscuro";
  }
  // La barra del navegador en móvil
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = t === "oscuro" ? "#11131f" : "#f3f4fb";
  document.head.appendChild(meta);
}

function alternarTema() {
  aplicarTema(temaActual() === "oscuro" ? "claro" : "oscuro", true);
}

document.getElementById("temaBtn")?.addEventListener("click", alternarTema);

// Seguir al sistema mientras el usuario no haya elegido a mano
try {
  if (!localStorage.getItem(TEMA_KEY)) {
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem(TEMA_KEY)) aplicarTema(e.matches ? "oscuro" : "claro", false);
    });
  }
} catch (e) { /* localStorage bloqueado: el botón sigue funcionando por sesión */ }

aplicarTema(temaActual(), false);

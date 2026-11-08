// ============================================================
//  ATAJOS DE TECLADO
// ============================================================
// Un solo listener en document, que se calla cuando estás escribiendo en un
// campo: si no, teclear "1" en una calificación saltaría de pestaña.

const ayudaEl = document.getElementById("ayuda");
const TABS_ORDEN = ["plan", "maestros", "horario", "optativas", "historial", "calendario"];

function escribiendo(el) {
  if (!el) return false;
  const t = (el.tagName || "").toLowerCase();
  return t === "input" || t === "textarea" || t === "select" || el.isContentEditable;
}

function cerrarTodo() {
  cerrarPal();
  cerrarModal(cmpEl);
  cerrarModal(ayudaEl);
}

document.getElementById("ayudaCerrar")?.addEventListener("click", () => cerrarModal(ayudaEl));
ayudaEl?.addEventListener("click", (e) => { if (e.target === ayudaEl) cerrarModal(ayudaEl); });

document.addEventListener("keydown", (e) => {
  // Escape cierra lo que haya abierto, incluso desde un campo
  if (e.key === "Escape") { cerrarTodo(); return; }

  // Ctrl/⌘+K abre el buscador aunque estés escribiendo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault(); abrirPal(); return;
  }

  if (escribiendo(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;

  // Con la portada abierta solo vale Enter para entrar
  if (!portadaEl.hidden) {
    if (e.key === "Enter") { e.preventDefault(); entrarApp(); }
    return;
  }

  if (e.key === "/") { e.preventDefault(); abrirPal(); return; }
  if (e.key === "?") { e.preventDefault(); abrirModal(ayudaEl); return; }

  const k = e.key.toLowerCase();
  if (k === "t") { e.preventDefault(); alternarTema(); return; }
  if (k === "h") { e.preventDefault(); mostrarPortada(); return; }

  const n = Number(e.key);
  if (n >= 1 && n <= TABS_ORDEN.length) { e.preventDefault(); irAPestana(TABS_ORDEN[n - 1]); }
});

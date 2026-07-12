// ============================================================
//  RESPALDO / RESTAURAR / REINICIAR
// ============================================================
// ============================================================
//  PESTAÑA 4 · OPTATIVAS — Rutas de especialización (P15)
// ============================================================
const rutasOptEl = document.getElementById("rutasOpt");

// Devuelve qué rama tiene elegida cada slot ('A1','B1','A2','B2'), o null
function ramaElegidaDeSlot(slotLabel) {
  const entry = Object.entries(OPT_SLOTS).find(([, info]) => info.label === slotLabel);
  if (!entry) return null;
  const [id] = entry;
  const rec = state.subjects[id];
  if (!rec || !rec.name) return null;
  // Nombre guardado es "Optativa A1 · <Rama>" (cuando hay elección via dropdown)
  const m = rec.name.match(/·\s*(.+)$/);
  return m ? m[1].trim() : null;
}

function renderOptativas() {
  // Mapa de elecciones (rama elegida por slot)
  const elecciones = {
    A1: ramaElegidaDeSlot("A1"),
    B1: ramaElegidaDeSlot("B1"),
    A2: ramaElegidaDeSlot("A2"),
    B2: ramaElegidaDeSlot("B2"),
  };

  // Resumen
  const elegidas = Object.entries(elecciones).filter(([, v]) => v);
  const resumen = elegidas.length === 0
    ? `<div class="opt-resumen empty">Aún no has elegido ninguna optativa. Ve a <b>Mi avance</b>, ubica las materias <b>Optativa A1/B1/A2/B2</b> y pulsa <b>Maestros</b> para elegir una rama.</div>`
    : `<div class="opt-resumen">
        <div class="opt-count">${elegidas.length} de 4 optativas elegidas</div>
        <div class="opt-pills">${elegidas.map(([slot, rama]) =>
          `<span class="opt-pill"><b>${slot}</b> ${esc(rama)}</span>`
        ).join("")}</div>
      </div>`;

  // Cada rama es una "ruta" horizontal: nombre · A1/B1 → A2/B2
  const ramas = ESPECIALIZACIONES.map((esp) => {
    const norm = (s) => String(s).toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const elig = (ramaName) => norm(ramaName) === norm(esp.nombre);
    const enA1 = elig(elecciones.A1);
    const enB1 = elig(elecciones.B1);
    const enA2 = elig(elecciones.A2);
    const enB2 = elig(elecciones.B2);
    const enRama = enA1 || enB1 || enA2 || enB2;

    const sem6 = esp.materias.find((m) => m.sem === 6);
    const sem7 = esp.materias.find((m) => m.sem === 7);

    const slot6 = enA1 ? "A1" : (enB1 ? "B1" : "");
    const slot7 = enA2 ? "A2" : (enB2 ? "B2" : "");

    return `
      <article class="ruta ${enRama ? "elegida" : ""}">
        <header class="ruta-head">
          <span class="ruta-badge">${esc(esp.icono)}</span>
          <span class="ruta-name">${esc(esp.nombre)}</span>
          ${enRama ? `<span class="ruta-chip">✓ Elegida</span>` : ""}
        </header>
        <div class="ruta-pasos">
          <div class="ruta-paso sem6 ${slot6 ? "active" : ""}">
            <div class="ruta-paso-tag">6.° SEM · ${esc(sem6.clave)}${slot6 ? ` · ${slot6}` : ""}</div>
            <div class="ruta-paso-name">${esc(sem6.nombre)}</div>
            <div class="ruta-paso-en">${esc(sem6.en)}</div>
          </div>
          <div class="ruta-flecha">→</div>
          <div class="ruta-paso sem7 ${slot7 ? "active" : ""}">
            <div class="ruta-paso-tag">7.° SEM · ${esc(sem7.clave)}${slot7 ? ` · ${slot7}` : ""}</div>
            <div class="ruta-paso-name">${esc(sem7.nombre)}</div>
            <div class="ruta-paso-en">${esc(sem7.en)}</div>
          </div>
        </div>
      </article>`;
  }).join("");

  rutasOptEl.innerHTML = resumen + `<div class="rutas-grid">${ramas}</div>`;
}


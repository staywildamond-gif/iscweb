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
  const slots = PLAN_ACTIVO.slots.map((s) => s.label);
  const elecciones = {};
  slots.forEach((l) => { elecciones[l] = ramaElegidaDeSlot(l); });

  const elegidas = Object.entries(elecciones).filter(([, v]) => v);
  const resumen = elegidas.length === 0
    ? `<div class="opt-resumen empty">Aún no has elegido ninguna optativa. Ve a <b>Mi avance</b>, ubica las materias <b>Optativa ${slots.join("/")}</b> y pulsa <b>Maestros</b> para elegir.</div>`
    : `<div class="opt-resumen">
        <div class="opt-count">${elegidas.length} de ${slots.length} optativas elegidas</div>
        <div class="opt-pills">${elegidas.map(([slot, rama]) =>
          `<span class="opt-pill"><b>${slot}</b> ${esc(rama)}</span>`
        ).join("")}</div>
      </div>`;

  // Solo ISC tiene ramas (pareja sem 6 -> sem 7). IA y LCD traen un catálogo
  // plano disponible en los dos semestres, así que se listan como tarjetas.
  const porRamas = CARRERA === "ISC" && typeof ESPECIALIZACIONES !== "undefined";
  const cuerpo = porRamas ? rutasPorRama(elecciones) : catalogoPlano(elecciones);

  const t = document.getElementById("optTitle");
  const sub = document.getElementById("optSub");
  if (t) t.textContent = porRamas ? "Optativas — Rutas de especialización" : "Optativas";
  if (sub) {
    sub.textContent = porRamas
      ? "Cada rama tiene una materia en 6.° semestre (A1 o B1) y otra en 7.° (A2 o B2). Las que ya elegiste se resaltan."
      : `Llevas ${slots.length} optativas: ${slots.slice(0, -1).join(", ")} y ${slots[slots.length - 1]}. Las que ya elegiste se resaltan.`;
  }

  rutasOptEl.innerHTML = resumen + cuerpo;
}

const normRama = (s) => String(s).toLowerCase()
  .normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// ISC: ruta horizontal 6.° -> 7.° por cada una de las 14 especializaciones
function rutasPorRama(elecciones) {
  const ramas = ESPECIALIZACIONES.map((esp) => {
    const elig = (ramaName) => normRama(ramaName) === normRama(esp.nombre);
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
  return `<div class="rutas-grid">${ramas}</div>`;
}

// Iniciales para el badge, al estilo de los iconos de ESPECIALIZACIONES ("BD", "MD").
// Ignora las palabras cortas: "Temas selectos de inteligencia artificial" -> "TI".
function iniciales(nombre) {
  const largas = String(nombre)
    .split(/[\s-]+/)
    .filter((w) => w.length > 3);
  const base = largas.length ? largas : String(nombre).split(/[\s-]+/);
  return base.slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "··";
}

// IA / LCD: una tarjeta por optativa, con su clave de 6.° y la de 7.°
function catalogoPlano(elecciones) {
  const porNombre = new Map();
  PLAN_ACTIVO.optativas.forEach((o) => {
    if (!porNombre.has(o.nom)) porNombre.set(o.nom, { nom: o.nom, cr: o.cr, claves: {} });
    porNombre.get(o.nom).claves[o.sem] = o.clave;
  });

  const elegidasNorm = Object.entries(elecciones)
    .filter(([, v]) => v)
    .map(([slot, v]) => ({ slot, n: normRama(v) }));

  const cards = [...porNombre.values()].map((o) => {
    const hit = elegidasNorm.find((e) => e.n === normRama(o.nom));
    return `
      <article class="ruta ${hit ? "elegida" : ""}">
        <header class="ruta-head">
          <span class="ruta-badge">${esc(iniciales(o.nom))}</span>
          <span class="ruta-name">${esc(o.nom)}</span>
          ${hit ? `<span class="ruta-chip">✓ ${esc(hit.slot)}</span>` : ""}
        </header>
        <div class="ruta-pasos">
          <div class="ruta-paso sem6">
            <div class="ruta-paso-tag">6.° SEM · ${esc(o.claves[6] || "—")}</div>
            <div class="ruta-paso-name">${fmt(o.cr)} créditos</div>
          </div>
          <div class="ruta-flecha">o</div>
          <div class="ruta-paso sem7">
            <div class="ruta-paso-tag">7.° SEM · ${esc(o.claves[7] || "—")}</div>
            <div class="ruta-paso-name">${fmt(o.cr)} créditos</div>
          </div>
        </div>
      </article>`;
  }).join("");

  return `<div class="opt-nota">En ${esc(CARRERA)} las optativas no van en pareja 6.° → 7.° como en ISC: es un catálogo plano y cada materia se puede llevar en cualquiera de los dos semestres, con la clave que le toque.</div>
    <div class="rutas-grid">${cards}</div>`;
}


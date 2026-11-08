// ============================================================
//  BUSCADOR GLOBAL  (tecla / o Ctrl+K)
// ============================================================
// Las pestañas ya traían su propio buscador, pero cada uno solo veía lo suyo:
// para pasar de "¿quién da Compiladores?" a la ficha del maestro había que
// cambiar de pestaña y volver a escribir. Esto busca en las tres cosas a la
// vez — materias de tu plan, maestros y grupos — y te lleva al lugar.
//
// El índice se arma la primera vez que abres el buscador, no al cargar la
// página: son ~1,000 entradas y no vale la pena pagarlas si nunca lo abres.

const palEl = document.getElementById("pal");
const palInput = document.getElementById("palInput");
const palRes = document.getElementById("palRes");

let palIndice = null;   // se arma al primer uso
let palLista = [];      // resultados visibles ahora
let palSel = 0;

function palConstruirIndice() {
  const items = [];

  // Materias del plan activo
  PLAN.forEach((blk, s) => {
    blk.materias.forEach(([nombre, cred], i) => {
      const id = idOf(s, i);
      items.push({
        tipo: "materia", ico: "📘",
        titulo: getSub(id, nombre).name,
        sub: `${blk.sem} · ${cred} créditos`,
        buscar: norm(nombre) + " " + norm(getSub(id, nombre).name),
        id,
      });
    });
  });

  // Maestros (de las tres carreras: las métricas son globales por profesor)
  (typeof TEACHERS !== "undefined" ? TEACHERS : []).forEach((t) => {
    const m = getMetric(t.name);
    const partes = [];
    if (m.calidad !== "") partes.push("calidad " + m.calidad);
    if (m.dificultad !== "") partes.push("dificultad " + m.dificultad);
    items.push({
      tipo: "maestro", ico: "👤",
      titulo: nombreProf(t.name),
      sub: partes.join(" · ") || "sin calificación todavía",
      buscar: norm(t.name) + " " + (t.materias || []).map(norm).join(" "),
      nombre: t.name,
    });
  });

  // Grupos de la carrera activa
  const porGrupo = new Map();
  schedActual().forEach((o) => {
    if (!porGrupo.has(o.grupo)) porGrupo.set(o.grupo, []);
    porGrupo.get(o.grupo).push(o);
  });
  [...porGrupo.keys()].sort().forEach((g) => {
    const ofertas = porGrupo.get(g);
    items.push({
      tipo: "grupo", ico: "🏫",
      titulo: g,
      sub: `${ofertas.length} materias · ${turnoDeGrupo(g) === "V" ? "vespertino" : "matutino"}`,
      buscar: norm(g),
      grupo: g,
    });
  });

  return items;
}

// Puntuación: empieza con lo buscado > empieza una palabra > aparece suelto
function palPuntua(texto, q) {
  const i = texto.indexOf(q);
  if (i < 0) return -1;
  if (i === 0) return 0;
  return texto[i - 1] === " " ? 1 : 2;
}

function palBuscar(q) {
  if (!palIndice) palIndice = palConstruirIndice();
  const n = norm(q).trim();
  if (!n) return [];
  return palIndice
    .map((it) => ({ it, p: palPuntua(it.buscar, n) }))
    .filter((x) => x.p >= 0)
    .sort((a, b) => a.p - b.p || a.it.titulo.length - b.it.titulo.length)
    .slice(0, 40)
    .map((x) => x.it);
}

const PAL_GRUPOS = { materia: "Materias de tu plan", maestro: "Maestros", grupo: "Grupos" };

function palPintar() {
  const q = palInput.value;
  const res = palBuscar(q);

  if (!q.trim()) {
    palLista = [];
    palRes.innerHTML = `<div class="pal-vacio">Escribe el nombre de una materia, un maestro
      o un grupo como <b>3CM2</b>.</div>`;
    return;
  }
  if (!res.length) {
    palLista = [];
    palRes.innerHTML = `<div class="pal-vacio">Nada con “${esc(q)}”.</div>`;
    return;
  }

  // Máximo 6 por tipo, para que ninguno se coma la lista
  const porTipo = { materia: [], maestro: [], grupo: [] };
  res.forEach((it) => { if (porTipo[it.tipo].length < 6) porTipo[it.tipo].push(it); });

  palLista = [];
  let html = "";
  ["materia", "maestro", "grupo"].forEach((tipo) => {
    if (!porTipo[tipo].length) return;
    html += `<div class="pal-grupo">${PAL_GRUPOS[tipo]}</div>`;
    porTipo[tipo].forEach((it) => {
      const idx = palLista.push(it) - 1;
      html += `<button class="pal-item" data-i="${idx}">
          <span class="pal-ico">${it.ico}</span>
          <span class="pal-txt">
            <span class="pal-t">${esc(it.titulo)}</span>
            <span class="pal-s">${esc(it.sub)}</span>
          </span>
        </button>`;
    });
  });
  palRes.innerHTML = html;
  palSel = 0;
  palMarcar();
  palRes.querySelectorAll(".pal-item").forEach((b) => {
    b.onclick = () => palAbrir(Number(b.dataset.i));
  });
}

function palMarcar() {
  palRes.querySelectorAll(".pal-item").forEach((b, i) => {
    b.classList.toggle("sel", i === palSel);
    if (i === palSel) b.scrollIntoView({ block: "nearest" });
  });
}

function palAbrir(i) {
  const it = palLista[i];
  if (!it) return;
  cerrarPal();
  if (it.tipo === "materia") irAMateria(it.id);
  if (it.tipo === "maestro") showProfDetail(it.nombre);
  if (it.tipo === "grupo") abrirGrupo(it.grupo);
}

// Lleva a Mi avance, hace scroll a la materia y la resalta un momento
function irAMateria(id) {
  irAPestana("plan");
  requestAnimationFrame(() => {
    const el = document.querySelector(`.subject[data-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.animate(
      [{ background: "var(--surface)" }, { background: "var(--bg-mid)" }, { background: "var(--surface)" }],
      { duration: 1400, easing: "ease-out" }
    );
  });
}

function abrirPal() {
  if (!palEl) return;
  palEl.hidden = false;
  palInput.value = "";
  palPintar();
  palInput.focus();
}

function cerrarPal() {
  if (palEl) palEl.hidden = true;
}

palInput?.addEventListener("input", palPintar);
palInput?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); palSel = Math.min(palSel + 1, palLista.length - 1); palMarcar(); }
  if (e.key === "ArrowUp")   { e.preventDefault(); palSel = Math.max(palSel - 1, 0); palMarcar(); }
  if (e.key === "Enter")     { e.preventDefault(); palAbrir(palSel); }
});
palEl?.addEventListener("click", (e) => { if (e.target === palEl) cerrarPal(); });
document.getElementById("buscarBtn")?.addEventListener("click", abrirPal);

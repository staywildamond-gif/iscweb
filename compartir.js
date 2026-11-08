// ============================================================
//  COMPARTIR HORARIO POR ENLACE
// ============================================================
// Sin servidor no hay dónde guardar un horario para enseñárselo a alguien, así
// que el horario viaja DENTRO del enlace, en el fragmento (#). El fragmento no
// se manda al servidor en ninguna petición, o sea que ni publicándolo en un
// dominio sale de los dos navegadores.
//
// Solo viaja el horario. Tus calificaciones y tu avance NO: eso es tuyo y no
// tiene por qué ir en un enlace que vas a pegar en un chat.
//
// De cada materia se guardan cuatro cosas (id, grupo, maestro, materia real) y
// el resto —días, horas, salón, créditos— se vuelve a sacar de schedule.js al
// abrirlo. Así el enlace es corto y, si ESCOM cambia un salón, el enlace
// muestra el salón nuevo.

const COMPARTIR_V = "1";

// ---------- codificar / decodificar ----------
function b64url(s) {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deB64url(s) {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(t + "===".slice((t.length + 3) % 4))));
}

function horarioAEnlace() {
  const datos = {
    v: COMPARTIR_V,
    c: CARRERA,
    h: state.horario.map((h) => [h.sid, h.grupo || "", h.maestro || "", h.matReal || h.materia]),
  };
  const base = location.origin + location.pathname;
  return base + "#h=" + b64url(JSON.stringify(datos));
}

function hayHorarioEnURL() {
  return /[#&]h=/.test(location.hash);
}

function leerHorarioDeURL() {
  const m = location.hash.match(/[#&]h=([^&]+)/);
  if (!m) return null;
  try {
    const d = JSON.parse(deB64url(m[1]));
    if (!d || !Array.isArray(d.h)) return null;
    return d;
  } catch (e) {
    return null;
  }
}

// Reconstruye los items completos cruzando con SCHEDULE
function rehidratar(filas) {
  const sched = typeof SCHEDULE !== "undefined" ? SCHEDULE : [];
  const items = [];
  let perdidas = 0;
  filas.forEach(([sid, grupo, maestro, matReal]) => {
    // El modo Auto no guarda `matReal`, así que lo que viaja puede ser el
    // nombre bonito ("Análisis vectorial") en vez del del gestor. norm() los
    // iguala; si aun así no cruza, basta grupo + maestro, que ya es casi único.
    const mismos = sched.filter((e) => e.grupo === grupo && norm(e.profesor) === norm(maestro));
    const o = mismos.find((e) => norm(e.materia) === norm(matReal)) || mismos[0];
    if (!o) { perdidas++; return; }
    const p = sid.match(/^s(\d+)-(\d+)$/);
    const cred = p && PLAN[+p[1]] && PLAN[+p[1]].materias[+p[2]]
      ? PLAN[+p[1]].materias[+p[2]][1] : 0;
    items.push({
      sid, materia: p ? subjectName(+p[1], +p[2]) : titleCase(o.materia),
      matReal: o.materia, maestro: o.profesor, grupo: o.grupo,
      edificio: o.edificio, salon: o.salon, sesiones: o.sesiones,
      cred, tipo: "nueva",
    });
  });
  return { items, perdidas };
}

// ---------- compartir ----------
async function compartirHorario() {
  if (!state.horario.length) {
    alert("Tu horario está vacío: agrega materias antes de compartirlo.");
    return;
  }
  const url = horarioAEnlace();
  try {
    await navigator.clipboard.writeText(url);
    const btn = document.getElementById("compartirBtn");
    if (btn) {
      const antes = btn.textContent;
      btn.textContent = "✓ Enlace copiado";
      setTimeout(() => { btn.textContent = antes; }, 2200);
    }
  } catch (e) {
    // Sin permiso de portapapeles (o en file://): que lo copie a mano
    prompt("Copia este enlace:", url);
  }
}

// ---------- recibir ----------
function avisoHorarioCompartido() {
  const d = leerHorarioDeURL();
  if (!d) return;

  const { items, perdidas } = rehidratar(d.h);
  const cont = document.getElementById("horarioAviso");
  if (!cont) return;

  if (!items.length) {
    cont.innerHTML = `<div class="compartido">⚠️ El enlace no trae materias que sigan
      abiertas este periodo. Puede ser de un periodo anterior.</div>`;
    return;
  }

  const otraCarrera = d.c && d.c !== CARRERA;
  cont.innerHTML = `
    <div class="compartido">
      <span>🔗 Alguien te compartió un horario de <b>${items.length} materias</b>${
        otraCarrera ? ` de <b>${esc(d.c)}</b>` : ""}${
        perdidas ? ` (${perdidas} ya no existe${perdidas === 1 ? "" : "n"})` : ""}.</span>
      <button class="btn" id="verCompartido">Ver</button>
      <button class="btn" id="tomarCompartido">Usarlo como el mío</button>
      <button class="btn" id="cerrarCompartido">Cerrar</button>
    </div>`;

  document.getElementById("verCompartido").onclick = () => {
    cmpTit.textContent = "Horario compartido";
    cmpBody.innerHTML = `
      <p class="cmp-sub">${items.length} materias${otraCarrera ? ` de ${esc(d.c)}` : ""}.
        Esto es solo una vista: no toca tu horario.</p>
      ${renderProfSchedGrid(items.map((i) => ({ ...i, materia: i.matReal })))}`;
    abrirModal(cmpEl);
  };

  document.getElementById("tomarCompartido").onclick = () => {
    if (otraCarrera) {
      alert("Ese horario es de " + d.c + " y tú llevas " + CARRERA +
            ".\nCambia de carrera primero y vuelve a abrir el enlace.");
      return;
    }
    if (!confirm("Esto reemplaza tu horario actual por el compartido. ¿Seguimos?")) return;
    state.horario = items;
    save();
    limpiarHashCompartido();
    cont.innerHTML = "";
    renderHorario();
    render();
  };

  document.getElementById("cerrarCompartido").onclick = () => {
    limpiarHashCompartido();
    cont.innerHTML = "";
  };
}

function limpiarHashCompartido() {
  history.replaceState(null, "", location.pathname + location.search);
}

document.getElementById("compartirBtn")?.addEventListener("click", compartirHorario);

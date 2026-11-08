// ============================================================
//  COMPARADOR DE MAESTROS  ·  VISTA DE GRUPO
// ============================================================
// Decidir con quién llevar una materia obligaba a abrir una ficha, volver,
// abrir otra y acordarse de los números. Esto pone a todos los que la dan en
// una sola pantalla, con sus tres métricas, sus grupos, su horario y su cupo.
//
// Y de paso resuelve lo contrario: dado un grupo, qué lleva y con quién
// (abrirGrupo), que es como de verdad se mira un horario en ESCOM.

const cmpEl = document.getElementById("cmp");
const cmpTit = document.getElementById("cmpTit");
const cmpBody = document.getElementById("cmpBody");

function cerrarModal(el) { if (el) el.hidden = true; }
function abrirModal(el) {
  if (!el) return;
  el.hidden = false;
  el.querySelector(".modal-box")?.scrollTo(0, 0);
}

document.getElementById("cmpCerrar")?.addEventListener("click", () => cerrarModal(cmpEl));
cmpEl?.addEventListener("click", (e) => { if (e.target === cmpEl) cerrarModal(cmpEl); });

// ---------- comparar a los que dan una materia del plan ----------
function abrirComparador(s, i) {
  const nombre = subjectName(s, i);
  const list = scheduleFor(s, i);

  cmpTit.textContent = titleCase(nombre);

  if (!list.length) {
    cmpBody.innerHTML = `<div class="cmp-vacio">No hay grupos abiertos para esta materia.</div>`;
    abrirModal(cmpEl);
    return;
  }

  // Un maestro puede dar la misma materia en varios grupos: se junta
  const porProf = new Map();
  list.forEach((o) => {
    const k = norm(o.profesor);
    if (!porProf.has(k)) porProf.set(k, { nombre: o.profesor, ofertas: [] });
    porProf.get(k).ofertas.push(o);
  });

  // Orden: mejor calidad primero; los que no tienen métrica, al final
  const filas = [...porProf.values()].map((p) => {
    const m = getMetric(p.nombre);
    const cal = m.calidad === "" || m.calidad == null ? null : Number(m.calidad);
    return { ...p, m, cal };
  }).sort((a, b) => {
    if (a.cal == null && b.cal == null) return a.nombre.localeCompare(b.nombre);
    if (a.cal == null) return 1;
    if (b.cal == null) return -1;
    return b.cal - a.cal;
  });

  const conMetrica = filas.filter((f) => f.cal != null).length;
  const mejor = filas[0] && filas[0].cal != null ? filas[0] : null;

  cmpBody.innerHTML = `
    <p class="cmp-sub">
      ${filas.length} maestro${filas.length === 1 ? "" : "s"} la imparte${filas.length === 1 ? "" : "n"}
      este periodo${conMetrica < filas.length
        ? ` · ${filas.length - conMetrica} sin calificación todavía, no es que sea mala`
        : ""}.
      Las métricas vienen de MisProfesores y son del maestro, no de esta materia en concreto.
    </p>
    <div class="cmp-grid">
      ${filas.map((f) => {
        const esMejor = mejor && f === mejor && filas.length > 1;
        return `
        <article class="cmp-card${esMejor ? " mejor" : ""}">
          ${esMejor ? `<span class="cmp-mejor-chip">mejor calificado</span>` : ""}
          <a href="#" class="cmp-nom prof-link" data-prof="${esc(f.nombre)}">${esc(nombreProf(f.nombre))}</a>
          <div class="cmp-metricas">
            <div class="cmp-metrica"><span>Calidad</span>${metricCell(f.m.calidad, "cal")}</div>
            <div class="cmp-metrica"><span title="Lo recomiendan">Recom.</span>${metricCell(f.m.recomiendan, "rec")}</div>
            <div class="cmp-metrica"><span title="Dificultad">Dific.</span>${metricCell(f.m.dificultad, "dif")}</div>
          </div>
          <div class="cmp-grupos">
            ${f.ofertas.map((o) => `
              <div class="cmp-grupo">
                <b>${esc(o.grupo)}</b>
                ${turnoDeGrupo(o.grupo) === "V" ? "🌙" : "☀️"}
                ${cupoBadge(o.grupo, o.materia)}
                <span>${esc(sesionesText(o.sesiones))}</span>
              </div>`).join("")}
          </div>
        </article>`;
      }).join("")}
    </div>`;

  cmpBody.querySelectorAll(".prof-link").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); cerrarModal(cmpEl); showProfDetail(a.dataset.prof); };
  });

  abrirModal(cmpEl);
}

// ---------- ver qué lleva un grupo ----------
function abrirGrupo(codigo) {
  const ofertas = schedActual().filter((o) => o.grupo === codigo);
  cmpTit.textContent = "Grupo " + codigo;

  if (!ofertas.length) {
    cmpBody.innerHTML = `<div class="cmp-vacio">Ese grupo no tiene materias registradas.</div>`;
    abrirModal(cmpEl);
    return;
  }

  const sem = codigo[0];
  const turno = turnoDeGrupo(codigo) === "V" ? "vespertino" : "matutino";
  cmpBody.innerHTML = `
    <p class="cmp-sub">${sem}.º semestre · ${turno} · ${ofertas.length} materias.
      ${Number(codigo[3]) >= 6 ? "Por el número, es un grupo de recurse." : ""}</p>
    ${renderProfSchedGrid(ofertas)}
    <h3 class="pd-section" style="margin-top:20px">Materias y maestros</h3>
    <div class="hist-list">
      ${ofertas.map((o) => `
        <div class="hist-item">
          <b>${esc(titleCase(o.materia))}</b>
          <span class="hist-prof"><a href="#" class="prof-link" data-prof="${esc(o.profesor)}">${esc(nombreProf(o.profesor))}</a></span>
          <span class="hist-meta">Ed. ${esc(String(o.edificio || "—"))} · Salón ${esc(String(o.salon || "—"))} ${cupoBadge(o.grupo, o.materia)}</span>
        </div>`).join("")}
    </div>`;

  cmpBody.querySelectorAll(".prof-link").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); cerrarModal(cmpEl); showProfDetail(a.dataset.prof); };
  });

  abrirModal(cmpEl);
}

// ============================================================
//  CALENDARIO ACADÉMICO
// ============================================================
// La app sabía qué materias llevas y dónde caen en una semana, pero no en qué
// punto del semestre estás. Esto le pone fecha: en qué periodo vas, cuánto
// falta para que terminen clases y para la próxima reinscripción, y qué días
// no hay clase.
//
// Los datos salen de calendario.js (generado desde calendario.csv).

const CAL_MESES = ["ene", "feb", "mar", "abr", "may", "jun",
                   "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-12-18" -> Date local. new Date("2026-12-18") lo interpreta como UTC y
// en México se recorre un día; por eso se parte a mano.
function calFecha(iso) {
  const p = String(iso).split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
function calHoy() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function calDias(a, b) { return Math.round((b - a) / 86400000); }
function calCorta(d) { return d.getDate() + " " + CAL_MESES[d.getMonth()]; }
function calDiasTxt(n) { return n === 1 ? "1 día" : n + " días"; }

const CAL_HAY = typeof CALENDARIO !== "undefined";

// Días en los que no hay clase
const CAL_INHABIL = {
  vacaciones: "vacaciones",
  descanso: "día de descanso obligatorio",
  sindical: "día de descanso por acuerdo sindical",
  politecnico: "Día del Politécnico",
  planeacion: "planeación académica",
};

// Eventos que cubren una fecha
function calEventosDe(d) {
  if (!CAL_HAY) return [];
  return CALENDARIO.eventos.filter((e) => d >= calFecha(e.ini) && d <= calFecha(e.fin));
}

// Si no hay clase ese día, devuelve el motivo; si sí hay, null.
// Un día puede caer en dos cosas a la vez (el 25 de diciembre es vacaciones Y
// descanso obligatorio): gana el motivo más específico.
const CAL_PRIORIDAD = ["politecnico", "descanso", "sindical", "planeacion", "vacaciones"];
function calInhabil(d) {
  const tipos = calEventosDe(d).map((x) => x.tipo).filter((t) => CAL_INHABIL[t]);
  if (!tipos.length) return null;
  const t = CAL_PRIORIDAD.find((p) => tipos.includes(p)) || tipos[0];
  return CAL_INHABIL[t];
}

// Periodo escolar que contiene la fecha (null si estás entre periodos)
function calPeriodoDe(d) {
  if (!CAL_HAY) return null;
  return CALENDARIO.periodos.find((p) => {
    if (!p.fin) return false;
    return d >= calFecha(p.inicio) && d <= calFecha(p.fin);
  }) || null;
}

// Siguiente periodo que todavía no empieza
function calProximoPeriodo(d) {
  if (!CAL_HAY) return null;
  return CALENDARIO.periodos.find((p) => calFecha(p.inicio) > d) || null;
}

// Semana N de M dentro del periodo
function calSemana(p, d) {
  const ini = calFecha(p.inicio), fin = calFecha(p.fin);
  const total = Math.ceil((calDias(ini, fin) + 1) / 7);
  const n = Math.floor(calDias(ini, d) / 7) + 1;
  return { n: Math.min(n, total), total };
}

// Lo que sigue: fin de clases, reinscripción o inicio, lo que caiga más cerca
function calProximoHito(d) {
  if (!CAL_HAY) return null;
  const hitos = [];
  CALENDARIO.periodos.forEach((p) => {
    if (p.fin) hitos.push({ fecha: calFecha(p.fin), txt: "Terminan clases de " + p.id });
    if (p.reinsIni) hitos.push({ fecha: calFecha(p.reinsIni), txt: "Reinscripción de " + p.id });
    hitos.push({ fecha: calFecha(p.inicio), txt: "Empieza " + p.id });
  });
  return hitos.filter((h) => h.fecha >= d).sort((a, b) => a.fecha - b.fecha)[0] || null;
}

// Lunes a viernes de la semana en curso (si es fin de semana, la que entra)
function calSemanaActual() {
  const hoy = calHoy();
  const dow = hoy.getDay();                       // 0 dom … 6 sáb
  const offset = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + offset);
  return DIAS.map((dia, i) => {
    const f = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
    return { dia, fecha: f, inhabil: calInhabil(f), hoy: f.getTime() === hoy.getTime() };
  });
}

function renderCalFranja() {
  const el = document.getElementById("calFranja");
  if (!el) return;
  if (!CAL_HAY) { el.hidden = true; return; }

  const hoy = calHoy();
  const p = calPeriodoDe(hoy);
  const partes = [];

  if (p) {
    const s = calSemana(p, hoy);
    partes.push(`<span class="cf-periodo">${esc(p.id)}</span>
                 <span class="cf-sem">semana ${s.n} de ${s.total}</span>`);
  } else {
    const sig = calProximoPeriodo(hoy);
    partes.push(`<span class="cf-periodo">Entre periodos</span>` +
      (sig ? `<span class="cf-sem">el que entra es ${esc(sig.id)}</span>` : ""));
  }

  const motivo = calInhabil(hoy);
  if (motivo) partes.push(`<span class="cf-hoy">Hoy no hay clase · ${esc(motivo)}</span>`);

  const hito = calProximoHito(hoy);
  if (hito) {
    const n = calDias(hoy, hito.fecha);
    const cuando = n === 0 ? "hoy" : "en " + calDiasTxt(n);
    partes.push(`<span class="cf-hito">${esc(hito.txt)} <b>${cuando}</b>
                 <span class="cf-fecha">${calCorta(hito.fecha)}</span></span>`);
  }

  el.innerHTML = partes.join("");
  el.hidden = false;
}

renderCalFranja();

// ============================================================
//  PESTAÑA · CALENDARIO
// ============================================================
// Misma rejilla de meses que el PDF del IPN, pero generada desde calendario.js.
// Cuando un día cae en varias cosas a la vez, el relleno es el del tipo más
// importante y el resto se ve en el tooltip.

const CAL_TIPOS = {
  reinscripcion:   { lbl: "Inscripción y reinscripción", cls: "t-reins" },
  inicio:          { lbl: "Inicio del periodo escolar", cls: "t-inicio" },
  fin:             { lbl: "Fin del periodo escolar", cls: "t-fin" },
  ordinaria:       { lbl: "Registro de evaluación ordinaria", cls: "t-ord" },
  extraordinaria:  { lbl: "Registro de evaluación extraordinaria", cls: "t-ext" },
  inscripcion_ets: { lbl: "Inscripción a ETS", cls: "t-inscets" },
  ets:             { lbl: "Evaluación a título de suficiencia", cls: "t-ets" },
  limite_saberes:  { lbl: "Límite de evaluación por saberes previos", cls: "t-saberes" },
  politecnico:     { lbl: "Día del Politécnico", cls: "t-ipn" },
  descanso:        { lbl: "Día de descanso obligatorio", cls: "t-descanso" },
  sindical:        { lbl: "Descanso por acuerdo sindical", cls: "t-sindical" },
  vacaciones:      { lbl: "Vacaciones", cls: "t-vacas" },
  planeacion:      { lbl: "Planeación académica", cls: "t-plan" },
};
// Cuál gana el relleno cuando se enciman
const CAL_ORDEN = ["fin", "inicio", "reinscripcion", "ets", "inscripcion_ets", "extraordinaria",
                   "ordinaria", "politecnico", "limite_saberes", "descanso", "sindical",
                   "vacaciones", "planeacion"];

function calMesHtml(anio, mes, hoy) {
  const primero = new Date(anio, mes, 1);
  const dias = new Date(anio, mes + 1, 0).getDate();
  let celdas = "";
  for (let i = 0; i < primero.getDay(); i++) celdas += `<span class="cd vacia"></span>`;
  for (let d = 1; d <= dias; d++) {
    const f = new Date(anio, mes, d);
    const tipos = calEventosDe(f).map((e) => e.tipo).filter((t) => CAL_TIPOS[t]);
    const gana = CAL_ORDEN.find((t) => tipos.includes(t));
    const cls = ["cd", gana ? CAL_TIPOS[gana].cls : "", f.getTime() === hoy.getTime() ? "cd-hoy" : ""]
      .filter(Boolean).join(" ");
    const titulo = tipos.length
      ? ` title="${esc(tipos.map((t) => CAL_TIPOS[t].lbl).join(" · "))}"`
      : "";
    celdas += `<span class="${cls}"${titulo}>${d}</span>`;
  }
  return `<div class="cal-mes">
      <div class="cal-mes-tit">${CAL_MESES[mes]} <span>${anio}</span></div>
      <div class="cal-dow">${["D", "L", "M", "M", "J", "V", "S"].map((x) => `<span>${x}</span>`).join("")}</div>
      <div class="cal-dias">${celdas}</div>
    </div>`;
}

function renderCalendario() {
  const sub = document.getElementById("calSub");
  const wPer = document.getElementById("calPeriodos");
  const wMes = document.getElementById("calMeses");
  const wLey = document.getElementById("calLeyenda");
  if (!wMes) return;
  if (!CAL_HAY) {
    if (sub) sub.textContent = "No hay calendario cargado.";
    return;
  }

  const hoy = calHoy();
  const actual = calPeriodoDe(hoy);
  if (sub) {
    sub.innerHTML = `Calendario oficial del IPN, modalidad escolarizada. Transcrito de
      <b>data/calendarioipn-escolarizada.pdf</b>; para corregirlo, edita <b>calendario.csv</b>.`;
  }

  wPer.innerHTML = CALENDARIO.periodos.map((p) => {
    const esActual = actual && actual.id === p.id;
    const pasado = p.fin && calFecha(p.fin) < hoy;
    const fila = (k, v) => `<div class="cp-row"><span>${k}</span><b>${v}</b></div>`;
    const rango = (a, b) => a ? (b && b !== a ? calCorta(calFecha(a)) + " – " + calCorta(calFecha(b)) : calCorta(calFecha(a))) : "—";
    return `<article class="cal-periodo${esActual ? " actual" : ""}${pasado ? " pasado" : ""}">
        <header>${esc(p.id)}${esActual ? `<span class="cp-chip">en curso</span>` : ""}</header>
        ${fila("Reinscripción", rango(p.reinsIni, p.reinsFin))}
        ${fila("Clases", rango(p.inicio, "") + (p.fin ? " – " + calCorta(calFecha(p.fin)) : " – ?"))}
        ${esActual ? fila("Semana", calSemana(p, hoy).n + " de " + calSemana(p, hoy).total) : ""}
      </article>`;
  }).join("");

  // De la primera a la última fecha que haya en el calendario
  const todas = CALENDARIO.eventos.flatMap((e) => [calFecha(e.ini), calFecha(e.fin)]);
  const desde = new Date(Math.min(...todas)), hasta = new Date(Math.max(...todas));
  let html = "", a = desde.getFullYear(), m = desde.getMonth();
  while (a < hasta.getFullYear() || (a === hasta.getFullYear() && m <= hasta.getMonth())) {
    html += calMesHtml(a, m, hoy);
    m++; if (m > 11) { m = 0; a++; }
  }
  wMes.innerHTML = html;

  // Solo los tipos que de verdad aparecen
  const usados = new Set(CALENDARIO.eventos.map((e) => e.tipo));
  wLey.innerHTML = CAL_ORDEN.filter((t) => usados.has(t)).map((t) =>
    `<span class="cl-item"><span class="cd ${CAL_TIPOS[t].cls}"></span>${esc(CAL_TIPOS[t].lbl)}</span>`
  ).join("");
}

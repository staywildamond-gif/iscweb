// ============================================================
//  EXPORTAR HORARIO — JPG (canvas) y XLSX (ZIP armado a mano)
//  Sin dependencias externas: funciona también en file://.
// ============================================================

// ---------- utilidades de descarga ----------
function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function fechaHoy() { return new Date().toISOString().slice(0, 10); }

// Colores estables por materia (misma lógica que la rejilla)
function coloresHorario() {
  const colorOf = new Map();
  state.horario.forEach((h) => {
    if (!colorOf.has(h.sid)) colorOf.set(h.sid, SCHED_COLORS[colorOf.size % SCHED_COLORS.length]);
  });
  return colorOf;
}

// Rango de bloques ocupados (min..max) o null si vacío
function rangoBloques() {
  const idx = (ini) => TIME_BLOCKS.findIndex((b) => b.ini === ini);
  const occ = new Set();
  state.horario.forEach((h) => (h.sesiones || []).forEach((s) => {
    const k = idx(s.ini); if (k >= 0) occ.add(k);
  }));
  if (occ.size === 0) return null;
  return { min: Math.min(...occ), max: Math.max(...occ) };
}

// ============================================================
//  1) EXPORTAR JPG (rejilla dibujada en canvas)
// ============================================================
function exportarHorarioJPG() {
  if (!state.horario.length) { alert("Tu horario está vacío. Agrega materias antes de exportar."); return; }
  const rango = rangoBloques();
  if (!rango) { alert("Las materias no tienen horario para dibujar."); return; }

  const scale = 2;                 // nitidez (retina)
  const colHora = 96, colDia = 168, headH = 46, rowH = 78, recesoH = 24;
  const padTop = 64, padSide = 24, padBot = 24;

  // ¿cuántos recesos entran en el rango?
  let recesos = 0;
  for (let i = rango.min; i <= rango.max; i++) {
    if ((TIME_BLOCKS[i].ini === "08:30" || TIME_BLOCKS[i].ini === "16:30") && i < rango.max) recesos++;
  }
  const nBloques = rango.max - rango.min + 1;
  const gridW = colHora + colDia * DIAS.length;
  const gridH = headH + rowH * nBloques + recesoH * recesos;
  const W = padSide * 2 + gridW;
  const H = padTop + gridH + padBot;

  const cv = document.createElement("canvas");
  cv.width = W * scale; cv.height = H * scale;
  const ctx = cv.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  // fondo
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  // título
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 22px 'Space Grotesk', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Mi horario — ISC", padSide, 30);
  ctx.fillStyle = "#64748b";
  ctx.font = "500 12px Arial, sans-serif";
  const totCred = state.horario.reduce((a, h) => a + (h.cred || 0), 0);
  ctx.fillText(`${state.horario.length} materias · ${fmt(totCred)} créditos · ${fechaHoy()}`, padSide, 48);

  const x0 = padSide, y0 = padTop;
  const colX = (d) => x0 + colHora + d * colDia;

  // encabezado de días
  ctx.fillStyle = "#f1f5f9"; ctx.fillRect(x0, y0, gridW, headH);
  ctx.fillStyle = "#334155";
  ctx.font = "700 13px 'Space Grotesk', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Hora", x0 + 12, y0 + headH / 2);
  ctx.textAlign = "center";
  const nombresDia = { Lun: "LUNES", Mar: "MARTES", Mie: "MIÉRCOLES", Jue: "JUEVES", Vie: "VIERNES" };
  DIAS.forEach((d, di) => ctx.fillText(nombresDia[d] || d.toUpperCase(), colX(di) + colDia / 2, y0 + headH / 2));

  // filas
  let y = y0 + headH;
  const wrap = (txt, maxW) => {
    const words = String(txt).split(" "); const lines = []; let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const colorOf = coloresHorario();

  for (let i = rango.min; i <= rango.max; i++) {
    const b = TIME_BLOCKS[i];
    // etiqueta de hora
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(x0, y, colHora, rowH);
    ctx.strokeStyle = "#e2e8f0"; ctx.strokeRect(x0, y, colHora, rowH);
    ctx.fillStyle = "#475569"; ctx.font = "600 12px Arial, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(b.ini, x0 + colHora / 2, y + rowH / 2 - 8);
    ctx.fillText(b.fin, x0 + colHora / 2, y + rowH / 2 + 10);

    DIAS.forEach((d, di) => {
      const cx = colX(di);
      ctx.strokeStyle = "#e2e8f0"; ctx.strokeRect(cx, y, colDia, rowH);
      const items = state.horario.filter((h) => (h.sesiones || []).some((s) => s.dia === d && s.ini === b.ini));
      if (!items.length) return;
      const h = items[0];
      const col = colorOf.get(h.sid);
      // fondo de la materia
      ctx.fillStyle = col.bg; ctx.fillRect(cx + 3, y + 3, colDia - 6, rowH - 6);
      ctx.strokeStyle = col.bd; ctx.lineWidth = 1.5; ctx.strokeRect(cx + 3, y + 3, colDia - 6, rowH - 6); ctx.lineWidth = 1;
      // texto: 1.º MAESTRO (lo más importante), 2.º grupo·salón, 3.º materia
      ctx.fillStyle = col.fg; ctx.textAlign = "left";
      ctx.font = "700 12px 'Space Grotesk', Arial, sans-serif";
      const lnsM = wrap(h.maestro || "", colDia - 20).slice(0, 2);
      let ty = y + 15;
      lnsM.forEach((ln) => { ctx.fillText(ln, cx + 10, ty); ty += 13; });
      ctx.font = "700 10px Arial, sans-serif";
      ctx.fillText(`${h.grupo || ""}${h.salon ? " · S." + h.salon : ""}`, cx + 10, ty + 2);
      ctx.font = "500 9px Arial, sans-serif";
      const lnsMat = wrap(shortMat(h.materia), colDia - 20);
      ctx.fillText(lnsMat[0] || "", cx + 10, y + rowH - 22);
      // cupo
      const c = cupoDe(h.grupo, h.matReal || h.materia);
      if (c) {
        const tt = c.disp < 0 ? "Sobrecupo" : c.disp === 0 ? "Lleno" : c.disp + (c.disp === 1 ? " lugar" : " lugares");
        ctx.font = "700 9px Arial, sans-serif";
        ctx.fillStyle = c.disp <= 0 ? "#b91c1c" : (c.disp <= 5 ? "#b45309" : "#15803d");
        ctx.fillText(tt, cx + 10, y + rowH - 8);
      }
      if (items.length > 1) {
        ctx.fillStyle = "#dc2626"; ctx.textAlign = "right";
        ctx.font = "700 10px Arial, sans-serif";
        ctx.fillText("⚠ choque", cx + colDia - 8, y + rowH - 8);
      }
    });
    y += rowH;

    // recesos
    const receso = (b.ini === "08:30") ? "Receso 10:00 – 10:30" : (b.ini === "16:30") ? "Receso 18:00 – 18:30" : null;
    if (receso && i < rango.max) {
      ctx.fillStyle = "#fafafa"; ctx.fillRect(x0, y, gridW, recesoH);
      ctx.strokeStyle = "#e2e8f0"; ctx.strokeRect(x0, y, gridW, recesoH);
      ctx.fillStyle = "#94a3b8"; ctx.font = "500 11px Arial, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("☕ " + receso, x0 + gridW / 2, y + recesoH / 2);
      y += recesoH;
    }
  }

  // toDataURL es síncrono y más compatible (incl. file://) que toBlob
  const a = document.createElement("a");
  a.href = cv.toDataURL("image/jpeg", 0.95);
  a.download = `horario_${fechaHoy()}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ============================================================
//  2) EXPORTAR XLSX (ZIP OOXML armado a mano)
// ============================================================
const _crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t;
})();
function _crc32(u8) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = _crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
const _enc = new TextEncoder();

// ZIP sin compresión (método "stored")
function _zip(files) {
  const chunks = [], central = [];
  let offset = 0;
  const u16 = (n) => [n & 0xFF, (n >>> 8) & 0xFF];
  const u32 = (n) => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
  for (const f of files) {
    const name = _enc.encode(f.name);
    const data = f.data;
    const crc = _crc32(data);
    const local = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
    chunks.push(new Uint8Array(local), name, data);
    central.push([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offset)), Array.from(name));
    offset += local.length + name.length + data.length;
  }
  const cStart = offset;
  const centralBytes = [];
  for (const c of central) centralBytes.push(...c);
  const cBuf = new Uint8Array(centralBytes);
  const eocd = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0),
    u16(files.length), u16(files.length), u32(cBuf.length), u32(cStart), u16(0)));
  const total = offset + cBuf.length + eocd.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const ch of chunks) { out.set(ch, p); p += ch.length; }
  out.set(cBuf, p); p += cBuf.length;
  out.set(eocd, p);
  return out;
}

function _xmlEsc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function _colLetter(n) { let s = ""; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }

// filas: array de arrays; cada celda {v, num?}. num=true → número
function _sheetXml(filas) {
  let rows = "";
  filas.forEach((fila, ri) => {
    let cells = "";
    fila.forEach((cell, ci) => {
      const ref = _colLetter(ci) + (ri + 1);
      if (cell == null || cell.v === "" || cell.v == null) return;
      if (cell.num) cells += `<c r="${ref}"><v>${cell.v}</v></c>`;
      else cells += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${_xmlEsc(cell.v)}</t></is></c>`;
    });
    rows += `<row r="${ri + 1}">${cells}</row>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}

function exportarHorarioXLSX() {
  if (!state.horario.length) { alert("Tu horario está vacío. Agrega materias antes de exportar."); return; }
  // una fila por sesión, ordenada por día y hora
  const orden = { Lun: 1, Mar: 2, Mie: 3, Jue: 4, Vie: 5 };
  const filasDatos = [];
  state.horario.forEach((h) => (h.sesiones || []).forEach((s) => filasDatos.push({ h, s })));
  filasDatos.sort((a, b) => (orden[a.s.dia] || 9) - (orden[b.s.dia] || 9) || a.s.ini.localeCompare(b.s.ini));

  const nombreDia = { Lun: "Lunes", Mar: "Martes", Mie: "Miércoles", Jue: "Jueves", Vie: "Viernes" };
  const filas = [["Día", "Inicio", "Fin", "Materia", "Profesor", "Grupo", "Edificio", "Salón", "Créditos", "Disponibles"].map((v) => ({ v }))];
  filasDatos.forEach(({ h, s }) => {
    const c = cupoDe(h.grupo, h.matReal || h.materia);
    const disp = c ? (c.disp < 0 ? "Sobrecupo" : c.disp === 0 ? "Lleno" : c.disp) : "";
    filas.push([
      { v: nombreDia[s.dia] || s.dia }, { v: s.ini }, { v: s.fin },
      { v: h.materia }, { v: h.maestro || "" }, { v: h.grupo || "" },
      { v: h.edificio || "" }, { v: h.salon || "" },
      { v: h.cred || 0, num: true },
      (typeof disp === "number") ? { v: disp, num: true } : { v: disp },
    ]);
  });
  // fila resumen
  const totCred = state.horario.reduce((a, h) => a + (h.cred || 0), 0);
  filas.push([]);
  filas.push([{ v: "Total" }, null, null, { v: state.horario.length + " materias" }, null, null, null, null, { v: totCred, num: true }]);

  const sheet = _sheetXml(filas);
  const files = [
    { name: "[Content_Types].xml", data: _enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`) },
    { name: "_rels/.rels", data: _enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) },
    { name: "xl/workbook.xml", data: _enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Horario" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
    { name: "xl/_rels/workbook.xml.rels", data: _enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`) },
    { name: "xl/worksheets/sheet1.xml", data: _enc.encode(sheet) },
  ];
  const zip = _zip(files);
  const blob = new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  descargarBlob(blob, `horario_${fechaHoy()}.xlsx`);
}

// ---------- enganchar botones ----------
(function () {
  const j = document.getElementById("exportJpgBtn");
  const x = document.getElementById("exportXlsxBtn");
  if (j) j.onclick = exportarHorarioJPG;
  if (x) x.onclick = exportarHorarioXLSX;
})();

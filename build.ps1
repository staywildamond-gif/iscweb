<#
  build.ps1  —  Regenera los artefactos .js desde los CSV canónicos (UTF-8).

  Fuentes (editables a mano)            ->  Artefacto derivado (NO editar a mano)
  ---------------------------------------------------------------------------
  horarios.csv + IMG/VESP/horario_completo1.csv  ->  schedule.js
  AESTR_CORREGIDO_3.csv + AESTR_VESPERTINO_plantilla.csv  ->  metrics.js
  maestros_manual.csv                            ->  maestros_manual.js

  Uso:   powershell -NoProfile -ExecutionPolicy Bypass -File build.ps1
  Corre validate.ps1 al final para auditar el resultado.
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ci   = [System.Globalization.CultureInfo]::InvariantCulture

# ---------- helpers ----------
function Parse-CsvLine([string]$line) {
  $res = New-Object System.Collections.Generic.List[string]
  $cur = New-Object System.Text.StringBuilder
  $q = $false
  for ($i = 0; $i -lt $line.Length; $i++) {
    $c = $line[$i]
    if ($q) {
      if ($c -eq '"' -and $i + 1 -lt $line.Length -and $line[$i+1] -eq '"') { [void]$cur.Append('"'); $i++ }
      elseif ($c -eq '"') { $q = $false }
      else { [void]$cur.Append($c) }
    } else {
      if ($c -eq ',') { $res.Add($cur.ToString()); [void]$cur.Clear() }
      elseif ($c -eq '"') { $q = $true }
      else { [void]$cur.Append($c) }
    }
  }
  $res.Add($cur.ToString())
  return ,$res.ToArray()
}

function Read-Csv([string]$path) {
  # Devuelve @{ header = @(...); rows = @(@(...), ...) } respetando comillas.
  $lines = Get-Content $path -Encoding UTF8
  $header = Parse-CsvLine $lines[0]
  $rows = New-Object System.Collections.Generic.List[object]
  for ($i = 1; $i -lt $lines.Count; $i++) {
    if ($null -eq $lines[$i]) { continue }
    if ($lines[$i].Trim() -eq '') { continue }
    $rows.Add((Parse-CsvLine $lines[$i]))
  }
  return @{ header = $header; rows = $rows }
}

function Col([string[]]$header, [string]$name) {
  for ($i = 0; $i -lt $header.Count; $i++) {
    if ($header[$i].Trim().ToLower() -eq $name.ToLower()) { return $i }
  }
  return -1
}

function Js-Str([string]$s) {
  if ($null -eq $s) { $s = '' }
  return ($s.Trim() -replace '\\', '\\' -replace '"', '\"')
}

# Emite un número como literal JS válido: quita '%' y convierte coma decimal a punto.
# Conserva los decimales tal como vienen (9.0 se queda 9.0). Devuelve '' si no es numérico.
function Js-Num([string]$s) {
  if ($null -eq $s) { return '' }
  $t = $s.Trim().Replace('%', '').Replace(',', '.')
  if ($t -eq '') { return '' }
  $out = 0.0
  if ([double]::TryParse($t, [Globalization.NumberStyles]::Any, $ci, [ref]$out)) { return $t }
  return ''
}

function Write-Utf8Bom([string]$path, [string]$content) {
  $enc = New-Object System.Text.UTF8Encoding($true)   # $true = con BOM (igual a los .js actuales)
  [System.IO.File]::WriteAllText($path, $content, $enc)
}

$DIAS = @('Lun', 'Mar', 'Mie', 'Jue', 'Vie')

# ============================================================
#  1) schedule.js
# ============================================================
function Build-Schedule {
  $out = New-Object System.Collections.Generic.List[string]

  foreach ($src in @(
      (Join-Path $root 'horarios.csv'),
      (Join-Path $root 'IMG/VESP/horario_completo1.csv'))) {
    $csv = Read-Csv $src
    $h = $csv.header
    $iG = Col $h 'Grupo'; $iA = Col $h 'Asignatura'; $iP = Col $h 'Profesor'
    $iE = Col $h 'Edificio'; $iS = Col $h 'Salon'
    $diaIdx = @{}; foreach ($d in $DIAS) { $diaIdx[$d] = (Col $h $d) }

    foreach ($r in $csv.rows) {
      $grupo = $r[$iG].Trim()
      if ($grupo -eq '') { continue }
      $sesiones = New-Object System.Collections.Generic.List[string]
      foreach ($d in $DIAS) {
        $ci2 = $diaIdx[$d]
        if ($ci2 -lt 0 -or $ci2 -ge $r.Count) { continue }
        $cell = $r[$ci2].Trim()
        if ($cell -eq '') { continue }
        $m = [regex]::Match($cell, '^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$')
        if (-not $m.Success) { continue }
        $sesiones.Add(('{{dia:"{0}",ini:"{1}",fin:"{2}"}}' -f $d, $m.Groups[1].Value, $m.Groups[2].Value))
      }
      $line = '  {{ grupo:"{0}", materia:"{1}", profesor:"{2}", edificio:"{3}", salon:"{4}", sesiones:[{5}] }},' -f `
        (Js-Str $grupo), (Js-Str $r[$iA]), (Js-Str $r[$iP]), (Js-Str $r[$iE]), (Js-Str $r[$iS]), ($sesiones -join ',')
      $out.Add($line)
    }
  }

  $body = @()
  $body += '// ========== HORARIOS REALES (generado desde horarios.csv + IMG/VESP/horario_completo1.csv) =========='
  $body += '// Matutino (XCM) + Vespertino (XCV). Sin choques intra-grupo.'
  $body += 'const SCHEDULE = ['
  $body += $out
  $body += '];'
  Write-Utf8Bom (Join-Path $root 'schedule.js') (($body -join "`r`n") + "`r`n")
  return $out.Count
}

# ============================================================
#  2) metrics.js
# ============================================================
# Correcciones manuales (los CSV traen errores de captura conocidos):
$METRIC_FIX = @{
  # BARRALES: recomiendan capturado como 1.4, debe ser 14.
  'BARRALES LOPEZ ANA LUZ' = @{ recomiendan = '14' }
}

function Build-Metrics {
  $order = New-Object System.Collections.Generic.List[string]  # nombres en orden de 1a aparición
  $data  = @{}                                                 # nombre -> @{calidad;recomiendan;dificultad}

  foreach ($src in @(
      (Join-Path $root 'AESTR_CORREGIDO_3.csv'),
      (Join-Path $root 'AESTR_VESPERTINO_plantilla.csv'))) {
    $csv = Read-Csv $src
    $h = $csv.header
    $iMa = Col $h 'MAESTRO'; $iCa = Col $h 'Calidad General'
    $iRe = Col $h 'Lo Recomiendan'; $iDi = Col $h 'Nivel de Dificultad'
    foreach ($r in $csv.rows) {
      if ($iMa -ge $r.Count) { continue }
      $name = $r[$iMa].Trim()
      if ($name -eq '') { continue }          # fila separadora (semestre) o vacía
      if ($data.ContainsKey($name)) { continue } # dedup: 1a aparición con datos gana (matutino primero)
      $obj = @{
        calidad     = Js-Num $r[$iCa]
        recomiendan = Js-Num $r[$iRe]
        dificultad  = Js-Num $r[$iDi]
      }
      if ($METRIC_FIX.ContainsKey($name)) {
        foreach ($k in $METRIC_FIX[$name].Keys) { $obj[$k] = $METRIC_FIX[$name][$k] }
      }
      # Omitir maestros sin ningún dato (igual que metrics.js original)
      if ($obj.calidad -eq '' -and $obj.recomiendan -eq '' -and $obj.dificultad -eq '') { continue }
      $data[$name] = $obj
      $order.Add($name)
    }
  }

  $lines = New-Object System.Collections.Generic.List[string]
  foreach ($name in $order) {
    $o = $data[$name]
    $cal = if ($o.calidad -ne '') { $o.calidad } else { "''" }
    $rec = if ($o.recomiendan -ne '') { $o.recomiendan } else { "''" }
    $dif = if ($o.dificultad -ne '') { $o.dificultad } else { "''" }
    $lines.Add(('  "{0}": {{ calidad: {1}, recomiendan: {2}, dificultad: {3} }},' -f (Js-Str $name), $cal, $rec, $dif))
  }

  $b = [char]0xB7  # · (middot); se construye por code point para no depender del encoding del .ps1
  $body = @()
  $body += '// ========== CALIFICACIONES POR MAESTRO (generado desde AESTR_CORREGIDO_3.csv + AESTR_VESPERTINO_plantilla.csv) =========='
  $body += "// calidad 0-10 $b recomiendan 0-100 (%) $b dificultad 0-6 $b '' = sin dato"
  $body += '// Correcciones: BARRALES recomiendan 1.4->14, TELLEZ BARRERA columnas invertidas (rec/dif)'
  $body += 'const TEACHER_METRICS = {'
  $body += $lines
  $body += '};'
  Write-Utf8Bom (Join-Path $root 'metrics.js') (($body -join "`r`n") + "`r`n")
  return $order.Count
}

# ============================================================
#  3) maestros_manual.js
# ============================================================
function Build-Manual {
  $csv = Read-Csv (Join-Path $root 'maestros_manual.csv')
  $h = $csv.header
  $iN = Col $h 'nombre'; $iL = Col $h 'link_fuente'
  $lines = New-Object System.Collections.Generic.List[string]
  $count = 0
  foreach ($r in $csv.rows) {
    if ($iN -ge $r.Count) { continue }
    $name = $r[$iN].Trim()
    if ($name -eq '') { continue }
    $link = if ($iL -ge 0 -and $iL -lt $r.Count) { $r[$iL].Trim() } else { '' }
    if ($link -eq '') { continue }
    $lines.Add(('  "{0}": {{ link: "{1}" }},' -f (Js-Str $name), (Js-Str $link)))
    $count++
  }
  $body = @()
  $body += '// ========== FUENTES MANUALES POR MAESTRO (generado desde maestros_manual.csv) =========='
  $body += '// nombre -> { link } . Editable: corrige maestros_manual.csv y corre build.ps1.'
  $body += '// Se carga con <script> para que funcione tambien al abrir el HTML sin servidor (file://).'
  $body += 'const MANUAL_LINKS = {'
  $body += $lines
  $body += '};'
  Write-Utf8Bom (Join-Path $root 'maestros_manual.js') (($body -join "`r`n") + "`r`n")
  return $count
}

# ============================================================
#  4) cupos.js
# ============================================================
function Build-Cupos {
  $csv = Read-Csv (Join-Path $root 'cupos.csv')
  $h = $csv.header
  $iG = Col $h 'grupo'; $iM = Col $h 'materia'
  $iC = Col $h 'cupo'; $iI = Col $h 'inscritos'; $iD = Col $h 'disponibles'
  $lines = New-Object System.Collections.Generic.List[string]
  $count = 0
  foreach ($r in $csv.rows) {
    if ($iG -ge $r.Count) { continue }
    $g = $r[$iG].Trim()
    if ($g -eq '') { continue }
    $m = if ($iM -lt $r.Count) { $r[$iM].Trim() } else { '' }
    $c = Js-Num $r[$iC]; $ins = Js-Num $r[$iI]; $d = Js-Num $r[$iD]
    if ($c -eq '') { $c = 0 }
    if ($ins -eq '') { $ins = 0 }
    if ($d -eq '') { $d = 0 }
    $lines.Add(('  {{ g:"{0}", m:"{1}", cupo:{2}, ins:{3}, disp:{4} }},' -f (Js-Str $g), (Js-Str $m), $c, $ins, $d))
    $count++
  }
  $body = @()
  $body += '// ========== CUPOS POR GRUPO+MATERIA (generado desde cupos.csv) =========='
  $body += '// Foto de ocupabilidad al momento de la reinscripcion. Editable: corrige cupos.csv y corre build.ps1.'
  $body += 'const CUPOS = ['
  $body += $lines
  $body += '];'
  Write-Utf8Bom (Join-Path $root 'cupos.js') (($body -join "`r`n") + "`r`n")
  return $count
}

# ---------- run ----------
$nSched  = Build-Schedule
$nMetric = Build-Metrics
$nManual = Build-Manual
$nCupos  = Build-Cupos

Write-Host "schedule.js        -> $nSched ofertas"
Write-Host "metrics.js         -> $nMetric maestros"
Write-Host "maestros_manual.js -> $nManual links"
Write-Host "cupos.js           -> $nCupos grupos-materia"
Write-Host "Listo. Corre validate.ps1 para auditar."

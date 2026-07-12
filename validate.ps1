<#
  validate.ps1  —  Audita los artefactos .js que consume la app.

  Revisa:
    1. Choques intra-grupo (misma franja día/hora dentro de un mismo grupo).
    2. Formato de horas válido (HH:MM, ini < fin).
    3. Profesores en schedule.js sin métrica en metrics.js.
    4. Maestros sin link de fuente (maestros_manual.js).
    5. Nombres en maestros_manual.csv que no empatan con ningún profesor real.

  Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File validate.ps1
  Salida: exit 0 si no hay ERRORES (los WARN no fallan); exit 1 si hay choques u horas inválidas.
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$errCount = 0
$warnCount = 0

function Section($t) { Write-Host ""; Write-Host "=== $t ===" -ForegroundColor Cyan }
function Err($m)  { $script:errCount++;  Write-Host "  [ERROR] $m" -ForegroundColor Red }
function Warn($m) { $script:warnCount++; Write-Host "  [WARN]  $m" -ForegroundColor Yellow }
function Ok($m)   { Write-Host "  [OK]    $m" -ForegroundColor Green }

function Norm([string]$s) {
  $d = ($s.Normalize([Text.NormalizationForm]::FormD))
  $sb = New-Object Text.StringBuilder
  foreach ($c in $d.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($c) }
  }
  ($sb.ToString()).ToUpper().Trim() -replace '\s+', ' '
}
function ToMin([string]$hhmm) { $p = $hhmm.Split(':'); return [int]$p[0] * 60 + [int]$p[1] }

# ---------- parsear schedule.js ----------
$schedText = Get-Content (Join-Path $root 'schedule.js') -Encoding UTF8 -Raw
$ofertas = New-Object System.Collections.Generic.List[object]
foreach ($m in [regex]::Matches($schedText, '\{\s*grupo:"([^"]*)",\s*materia:"([^"]*)",\s*profesor:"([^"]*)",\s*edificio:"([^"]*)",\s*salon:"([^"]*)",\s*sesiones:\[([^\]]*)\]')) {
  $ses = New-Object System.Collections.Generic.List[object]
  foreach ($s in [regex]::Matches($m.Groups[6].Value, '\{dia:"([^"]+)",ini:"([^"]+)",fin:"([^"]+)"\}')) {
    $ses.Add([pscustomobject]@{ dia = $s.Groups[1].Value; ini = $s.Groups[2].Value; fin = $s.Groups[3].Value })
  }
  $ofertas.Add([pscustomobject]@{
    grupo = $m.Groups[1].Value; materia = $m.Groups[2].Value; profesor = $m.Groups[3].Value; sesiones = $ses
  })
}

# ---------- parsear metrics.js ----------
$metText = Get-Content (Join-Path $root 'metrics.js') -Encoding UTF8 -Raw
$metrics = @{}
foreach ($m in [regex]::Matches($metText, '"([^"]+)":\s*\{\s*calidad:')) { $metrics[$m.Groups[1].Value] = $true }

# ---------- parsear maestros_manual.js ----------
$manText = Get-Content (Join-Path $root 'maestros_manual.js') -Encoding UTF8 -Raw
$links = @{}
foreach ($m in [regex]::Matches($manText, '"([^"]+)":\s*\{\s*link:')) { $links[$m.Groups[1].Value] = $true }

Write-Host "Ofertas: $($ofertas.Count) | Metricas: $($metrics.Count) | Links: $($links.Count)"

# ============================================================
#  1. Choques intra-grupo + 2. formato de horas
# ============================================================
Section "1) Choques intra-grupo y formato de horas"
$porGrupo = @{}
foreach ($o in $ofertas) { if (-not $porGrupo.ContainsKey($o.grupo)) { $porGrupo[$o.grupo] = New-Object System.Collections.Generic.List[object] }; $porGrupo[$o.grupo].Add($o) }
$choques = 0
$horasMal = 0
foreach ($g in ($porGrupo.Keys | Sort-Object)) {
  $slots = New-Object System.Collections.Generic.List[object]
  foreach ($o in $porGrupo[$g]) {
    foreach ($s in $o.sesiones) {
      if ($s.ini -notmatch '^\d{1,2}:\d{2}$' -or $s.fin -notmatch '^\d{1,2}:\d{2}$' -or (ToMin $s.ini) -ge (ToMin $s.fin)) {
        Err "Hora invalida en $g ($($o.materia)): $($s.dia) $($s.ini)-$($s.fin)"; $horasMal++
      }
      $slots.Add([pscustomobject]@{ dia = $s.dia; a = (ToMin $s.ini); b = (ToMin $s.fin); mat = $o.materia; prof = $o.profesor; txt = "$($s.dia) $($s.ini)-$($s.fin)" })
    }
  }
  for ($i = 0; $i -lt $slots.Count; $i++) {
    for ($j = $i + 1; $j -lt $slots.Count; $j++) {
      if ($slots[$i].dia -eq $slots[$j].dia -and $slots[$i].a -lt $slots[$j].b -and $slots[$j].a -lt $slots[$i].b) {
        Err "Choque en $g : '$($slots[$i].mat)' vs '$($slots[$j].mat)' el $($slots[$i].txt)"; $choques++
      }
    }
  }
}
if ($choques -eq 0)  { Ok "0 choques intra-grupo" }
if ($horasMal -eq 0) { Ok "Todas las horas con formato valido (ini < fin)" }

# ============================================================
#  3. Profesores en schedule sin metrica
# ============================================================
Section "3) Profesores en schedule.js sin metrica en metrics.js"
$placeholders = @('POR ASIGNAR', 'POR DEFINIR')
$profsSched = $ofertas | ForEach-Object { $_.profesor } | Sort-Object -Unique
$sinMetrica = @($profsSched | Where-Object { $_ -notin $placeholders -and -not $metrics.ContainsKey($_) })
if ($sinMetrica.Count -eq 0) { Ok "Todos los profesores tienen metrica" }
else { foreach ($p in $sinMetrica) { Warn "Sin metrica: $p" } }

# ============================================================
#  4. Maestros sin link de fuente
# ============================================================
Section "4) Maestros sin link de fuente"
$linksNorm = @{}; foreach ($k in $links.Keys) { $linksNorm[(Norm $k)] = $true }
$sinLink = @($profsSched | Where-Object { $_ -notin $placeholders -and -not $linksNorm.ContainsKey((Norm $_)) })
if ($sinLink.Count -eq 0) { Ok "Todos los maestros tienen link" }
else {
  Warn "$($sinLink.Count) maestro(s) sin link:"
  foreach ($p in ($sinLink | Sort-Object)) { Write-Host "           - $p" -ForegroundColor DarkYellow }
}

# ============================================================
#  5. Nombres en maestros_manual.csv que no empatan con profes reales
# ============================================================
Section "5) Entradas de maestros_manual.csv sin profesor real"
$realNorm = @{}
foreach ($p in $profsSched) { $realNorm[(Norm $p)] = $true }
foreach ($k in $metrics.Keys) { $realNorm[(Norm $k)] = $true }
$csvLines = Get-Content (Join-Path $root 'maestros_manual.csv') -Encoding UTF8 | Select-Object -Skip 1
$huerfanos = 0
foreach ($l in $csvLines) {
  if (-not $l.Trim()) { continue }
  $name = ($l -split ',', 2)[0].Trim().Trim('"')
  if (-not $name) { continue }
  if (-not $realNorm.ContainsKey((Norm $name))) { Warn "En CSV pero no es profesor real: $name"; $huerfanos++ }
}
if ($huerfanos -eq 0) { Ok "Todas las entradas del CSV empatan con un profesor real" }

# ============================================================
Section "Resumen"
Write-Host "  Errores: $errCount   Advertencias: $warnCount"
if ($errCount -gt 0) { Write-Host "  RESULTADO: FALLO (hay errores criticos)" -ForegroundColor Red; exit 1 }
else { Write-Host "  RESULTADO: OK" -ForegroundColor Green; exit 0 }

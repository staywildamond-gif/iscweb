# ============================================================
#  build-data.ps1 — genera planes.js y schedule.js desde data/*.html
#  Fuente: el HTML oficial de SAES en data/<carrera>/. NO editar los .js a mano.
#  Uso:  powershell -ExecutionPolicy Bypass -File build-data.ps1
# ============================================================
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$avisos = New-Object System.Collections.ArrayList

function Norm([string]$s){
  if(-not $s){ return "" }
  $s = ($s -replace '&nbsp;',' ').Normalize([Text.NormalizationForm]::FormD)
  $sb = New-Object Text.StringBuilder
  foreach($c in $s.ToCharArray()){
    if([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne 'NonSpacingMark'){ [void]$sb.Append($c) }
  }
  ($sb.ToString() -replace '\s+',' ').Trim().ToUpper()
}
function Esc([string]$s){ ($s -replace '\\','\\' -replace '"','\"') }

# Bloques de clase (1:30 c/u). Recesos 10:00-10:30 y 18:00-18:30.
$BLOQUES = @(
  @{ini="07:00";fin="08:30"}, @{ini="08:30";fin="10:00"}, @{ini="10:30";fin="12:00"},
  @{ini="12:00";fin="13:30"}, @{ini="13:30";fin="15:00"}, @{ini="15:00";fin="16:30"},
  @{ini="16:30";fin="18:00"}, @{ini="18:30";fin="20:00"}, @{ini="20:00";fin="21:30"}
)
function Mins([string]$hhmm){ $p = $hhmm -split ':'; [int]$p[0]*60 + [int]$p[1] }

# Un rango del HTML se traduce a TODOS los bloques que caben completos dentro.
# Asi "13:30-16:30" -> dos bloques, y "10:00-12:00" -> "10:30-12:00" (brinca el receso).
function BloquesDe([string]$rango, [string]$ctx){
  $r = @()
  if($rango -notmatch '^(\d{2}:\d{2})-(\d{2}:\d{2})$'){ return $r }
  $ini = Mins $Matches[1]; $fin = Mins $Matches[2]
  foreach($b in $BLOQUES){
    if((Mins $b.ini) -ge $ini -and (Mins $b.fin) -le $fin){ $r += $b }
  }
  if($r.Count -eq 0){ [void]$avisos.Add("sin bloque valido: $ctx $rango") }
  elseif($r.Count -eq 1 -and ($r[0].ini -ne $Matches[1] -or $r[0].fin -ne $Matches[2])){
    [void]$avisos.Add("ajustado: $ctx $rango -> $($r[0].ini)-$($r[0].fin)")
  }
  elseif($r.Count -gt 1){
    [void]$avisos.Add("partido: $ctx $rango -> $((@($r | ForEach-Object { "$($_.ini)-$($_.fin)" })) -join ' + ')")
  }
  $r
}

# ---------- mapa curricular ----------
function ReadMapa([string]$path){
  $html = Get-Content -Raw -Encoding UTF8 $path
  $seen = New-Object System.Collections.Generic.HashSet[string]
  $out  = New-Object System.Collections.ArrayList
  $dups = 0
  foreach($tr in ($html -split '</tr>')){
    $tds = [regex]::Matches($tr,'(?s)<td[^>]*>(.*?)</td>') | ForEach-Object { ($_.Groups[1].Value -replace '<[^>]*>','' -replace '&nbsp;','').Trim() }
    if($tds.Count -ge 7 -and $tds[1] -match '^[A-C]\d{3}$'){
      if($seen.Add("$($tds[0])|$($tds[1])")){
        [void]$out.Add([pscustomobject]@{
          sem=[int]$tds[0]; clave=$tds[1]; nom=($tds[2] -replace '\s+',' ').Trim()
          tipo=$tds[3]; cr=[double]$tds[4]; ht=[double]$tds[5]; hp=[double]$tds[6]
        })
      } else { $dups++ }
    }
  }
  if($dups){ [void]$avisos.Add("$(Split-Path -Leaf $path): $dups filas duplicadas descartadas") }
  ,$out
}

# ---------- horarios ----------
$DIAS = @('Lun','Mar','Mie','Jue','Vie','Sab')
function ReadHorario([string]$path, [string]$carrera){
  $html = Get-Content -Raw -Encoding UTF8 $path
  $seen = New-Object System.Collections.Generic.HashSet[string]
  $out  = New-Object System.Collections.ArrayList
  $dups = 0
  foreach($tr in ($html -split '</tr>')){
    $tds = [regex]::Matches($tr,'(?s)<td[^>]*>(.*?)</td>') | ForEach-Object { ($_.Groups[1].Value -replace '<[^>]*>','' -replace '&nbsp;','').Trim() }
    if($tds.Count -lt 11 -or $tds[0] -notmatch '^\d[A-Z][MV]\d+$'){ continue }
    $firma = ($tds[0..10] -join '~')
    if(-not $seen.Add($firma)){ $dups++; continue }
    $grupo = $tds[0]
    $ses = New-Object System.Collections.ArrayList
    for($i=0; $i -lt 6; $i++){
      $celda = $tds[5+$i]
      if(-not $celda){ continue }
      foreach($rango in ($celda -split '\s+' | Where-Object { $_ -match '\d{2}:\d{2}-\d{2}:\d{2}' })){
        foreach($b in (BloquesDe $rango "$grupo $($DIAS[$i])")){
          [void]$ses.Add([pscustomobject]@{ dia=$DIAS[$i]; ini=$b.ini; fin=$b.fin })
        }
      }
    }
    $ed = $tds[3]; $sa = $tds[4]
    if($ed -eq 'X'){ $ed = '' }
    if($sa -eq 'X'){ $sa = '' }
    [void]$out.Add([pscustomobject]@{
      carrera=$carrera; grupo=$grupo
      materia=(Norm $tds[1]); profesor=(Norm $tds[2])
      edificio=$ed; salon=$sa; sesiones=$ses
    })
  }
  if($dups){ [void]$avisos.Add("$(Split-Path -Leaf $path): $dups filas identicas descartadas") }
  ,$out
}

# ---------- seriacion (clave dependiente -> claves prerrequisito) ----------
# ISC: de las flechas del mapa oficial, ya validada por el usuario (estaba en auto.js por nombre).
# IA y LCD: sus mapas NO dibujan flechas y SAES no trae el dato. Esta lista es una
# propuesta por encadenamiento de nombres, aprobada por el usuario el 2026-11-02.
$SERIACION = @{
  ISC = [ordered]@{
    "C201"=@("C101"); "C202"=@("C104"); "C203"=@("C103")
    "C301"=@("C201"); "C302"=@("C201"); "C303"=@("C203"); "C305"=@("C204")
    "C401"=@("C301"); "C403"=@("C303"); "C404"=@("C304"); "C405"=@("C305"); "C406"=@("C306")
    "C501"=@("C301"); "C502"=@("C403"); "C503"=@("C404"); "C504"=@("C405")
    "C602"=@("C503"); "C618"=@("C505"); "C619"=@("C507")
    "C702"=@("C407"); "C718"=@("C507")
  }
  IA = [ordered]@{
    "B201"=@("B101"); "B204"=@("B104")
    "B301"=@("B201"); "B302"=@("B201"); "B303"=@("B204"); "B305"=@("B203")
    "B403"=@("B303"); "B404"=@("B304")
    "B501"=@("B401"); "B503"=@("B301")
    "B602"=@("B501"); "B801"=@("B701")
  }
  LCD = [ordered]@{
    "A201"=@("A101"); "A204"=@("A104")
    "A301"=@("A201"); "A302"=@("A201")
    "A404"=@("A303"); "A405"=@("A304")
    "A504"=@("A304"); "A505"=@("A204")
    "A602"=@("A502"); "A603"=@("A501")
    "A803"=@("A703")
  }
}

# Ofertas que estaban en schedule.js y no vienen en el HTML nuevo. Se conservan (union).
$EXTRA = @(
  '  { carrera:"ISC", grupo:"2CV1", materia:"INGENIERIA ETICA Y SOCIEDAD", profesor:"CRUZ LAZARO ING. APOLINAR FRANCISCO", edificio:"1", salon:"007", sesiones:[{dia:"Mar",ini:"18:30",fin:"20:00"},{dia:"Mie",ini:"18:30",fin:"20:00"},{dia:"Vie",ini:"18:30",fin:"20:00"}] },'
  '  { carrera:"ISC", grupo:"6CM5", materia:"SISTEMAS EN CHIP", profesor:"AGUILAR SANCHEZ FERNANDO", edificio:"", salon:"POR DEFINIR", sesiones:[{dia:"Lun",ini:"10:30",fin:"12:00"},{dia:"Mar",ini:"08:30",fin:"10:00"},{dia:"Jue",ini:"10:30",fin:"12:00"}] },'
  '  { carrera:"ISC", grupo:"7CM1", materia:"TRABAJO TERMINAL I", profesor:"SANCHEZ MORENO ADRIANA DE LA P", edificio:"", salon:"", sesiones:[] },'
  '  { carrera:"ISC", grupo:"7CM2", materia:"TRABAJO TERMINAL I", profesor:"RIVERA DE LA ROSA MONICA", edificio:"", salon:"", sesiones:[] },'
  '  { carrera:"ISC", grupo:"8CM3", materia:"GESTION EMPRESARIAL", profesor:"SOSA ADAN FANNY", edificio:"4", salon:"113", sesiones:[{dia:"Lun",ini:"10:30",fin:"12:00"},{dia:"Mar",ini:"08:30",fin:"10:00"},{dia:"Jue",ini:"10:30",fin:"12:00"}] },'
)

$CARRERAS = [ordered]@{
  ISC = @{ dir="isc"; letra="C"; nombre="Ingenieria en Sistemas Computacionales"; slots=@(@("A1",6),@("B1",6),@("A2",7),@("B2",7)) }
  IA  = @{ dir="ia";  letra="B"; nombre="Ingenieria en Inteligencia Artificial";  slots=@(@("A",6),@("B",6),@("C",7),@("D",7)) }
  LCD = @{ dir="lcd"; letra="A"; nombre="Licenciatura en Ciencia de Datos";       slots=@(@("A",6),@("B",6),@("C",7),@("D",7)) }
}
$MAX_CRED = 55   # tope institucional de ESCOM, igual para las tres carreras
$CR_SLOT  = 7.5

# ---------- nombres de display (nombres.csv, editable a mano) ----------
# El gestor escribe todo en mayusculas y a veces sin acentos; ademas las optativas de ISC
# vienen como "RAMA|NOMBRE EN INGLES". nombres.csv traduce clave -> como se ve en la app.
$NOMBRES = @{}
$ORDEN   = @{}   # el ORDEN DE LAS FILAS del csv define el orden del plan en la app.
                 # Los ids de materia son s{sem}-{indice}: si reordenas, el avance
                 # guardado en localStorage apunta a otra materia. No reordenar a la ligera.
$fila = 0
$csvNom = Join-Path $ROOT "nombres.csv"
if(Test-Path $csvNom){
  foreach($ln in (Get-Content -Encoding UTF8 $csvNom)){
    if(-not $ln -or $ln.StartsWith('#') -or $ln.StartsWith('carrera,')){ continue }
    $campos = [regex]::Matches($ln, '(?:^|,)("(?:[^"]|"")*"|[^,]*)') | ForEach-Object {
      $v = $_.Groups[1].Value
      if($v.StartsWith('"')){ $v.Substring(1, $v.Length-2) -replace '""','"' } else { $v }
    }
    if($campos.Count -ge 3){
      $k = "$($campos[0])|$($campos[1])"
      $NOMBRES[$k] = $campos[2]
      $ORDEN[$k] = $fila
      $fila++
    }
  }
} else { [void]$avisos.Add("no existe nombres.csv: se usaran los nombres crudos del gestor") }

function NomDe([string]$carrera, [string]$clave, [string]$fallback){
  $k = "$carrera|$clave"
  if($NOMBRES.ContainsKey($k) -and $NOMBRES[$k]){ return $NOMBRES[$k] }
  [void]$avisos.Add("sin nombre en nombres.csv: $k")
  $fallback
}

# ============================================================
#  planes.js
# ============================================================
$p = New-Object Text.StringBuilder
[void]$p.AppendLine("// ========== PLANES DE ESTUDIO (generado por build-data.ps1 desde data/*/mp.html) ==========")
[void]$p.AppendLine("// NO editar a mano. Corrige el HTML de data/ y vuelve a correr build-data.ps1.")
[void]$p.AppendLine("// Clave oficial = identificador primario. Las 3 carreras llevan 4 optativas de $CR_SLOT cr.")
[void]$p.AppendLine("const PLANES = {")
$resumen = @()
foreach($cod in $CARRERAS.Keys){
  $c = $CARRERAS[$cod]
  $mp = ReadMapa (Join-Path $ROOT "data\$($c.dir)\mp.html")
  # El orden dentro de cada semestre lo manda nombres.csv (ver $ORDEN arriba).
  $porOrden = { if($ORDEN.ContainsKey("$cod|$($_.clave)")){ $ORDEN["$cod|$($_.clave)"] } else { 99999 } }
  $obl = @($mp | Where-Object { $_.tipo -eq 'OBLIGATORIA' } | Sort-Object @{E={$_.sem}}, @{E=$porOrden})
  $opt = @($mp | Where-Object { $_.tipo -eq 'OPTATIVA' }    | Sort-Object @{E={$_.sem}}, @{E=$porOrden})
  $crObl = ($obl | Measure-Object cr -Sum).Sum
  $total = $crObl + 4 * $CR_SLOT
  $resumen += [pscustomobject]@{ car=$cod; obl=$obl.Count; crObl=$crObl; opt=$opt.Count; total=$total }
  [void]$p.AppendLine("  $cod`: {")
  [void]$p.AppendLine("    nombre: `"$(Esc $c.nombre)`", letra: `"$($c.letra)`",")
  [void]$p.AppendLine("    creditos: $total, maxCred: $MAX_CRED,")
  $sl = (@($c.slots | ForEach-Object { "{ label:`"$($_[0])`", sem:$($_[1]) }" })) -join ', '
  [void]$p.AppendLine("    slots: [$sl],")
  [void]$p.AppendLine("    materias: [")
  foreach($x in $obl){
    [void]$p.AppendLine("      { clave:`"$($x.clave)`", nom:`"$(Esc (NomDe $cod $x.clave $x.nom))`", saes:`"$(Esc $x.nom)`", sem:$($x.sem), cr:$($x.cr), ht:$($x.ht), hp:$($x.hp) },")
  }
  [void]$p.AppendLine("    ],")
  [void]$p.AppendLine("    optativas: [")
  foreach($x in $opt){
    [void]$p.AppendLine("      { clave:`"$($x.clave)`", nom:`"$(Esc (NomDe $cod $x.clave $x.nom))`", saes:`"$(Esc $x.nom)`", sem:$($x.sem), cr:$($x.cr) },")
  }
  [void]$p.AppendLine("    ],")
  $ser = $SERIACION[$cod]
  [void]$p.AppendLine("    seriacion: {")
  foreach($k in $ser.Keys){
    $reqs = (@($ser[$k] | ForEach-Object { "`"$_`"" })) -join ', '
    [void]$p.AppendLine("      `"$k`": [$reqs],")
  }
  [void]$p.AppendLine("    },")
  [void]$p.AppendLine("  },")
}
[void]$p.AppendLine("};")
$utf8bom = New-Object Text.UTF8Encoding $true
[IO.File]::WriteAllText((Join-Path $ROOT "planes.js"), $p.ToString(), $utf8bom)

# ============================================================
#  schedule.js
# ============================================================
$s = New-Object Text.StringBuilder
[void]$s.AppendLine("// ========== HORARIOS (generado por build-data.ps1 desde data/*/horario-*.html) ==========")
[void]$s.AppendLine("// ISC + IA + LCD, matutino y vespertino. Cada oferta trae su carrera.")
[void]$s.AppendLine("// NO editar a mano. Corrige el HTML de data/ y vuelve a correr build-data.ps1.")
[void]$s.AppendLine("const SCHEDULE = [")
$porCarrera = @{}
foreach($cod in $CARRERAS.Keys){
  $c = $CARRERAS[$cod]
  $n = 0
  foreach($t in @('m','v')){
    foreach($o in (ReadHorario (Join-Path $ROOT "data\$($c.dir)\horario-$t.html") $cod)){
      $ses = (@($o.sesiones | ForEach-Object { "{dia:`"$($_.dia)`",ini:`"$($_.ini)`",fin:`"$($_.fin)`"}" })) -join ','
      [void]$s.AppendLine("  { carrera:`"$cod`", grupo:`"$($o.grupo)`", materia:`"$(Esc $o.materia)`", profesor:`"$(Esc $o.profesor)`", edificio:`"$(Esc $o.edificio)`", salon:`"$(Esc $o.salon)`", sesiones:[$ses] },")
      $n++
    }
  }
  if($cod -eq 'ISC'){ foreach($l in $EXTRA){ [void]$s.AppendLine($l); $n++ } }
  $porCarrera[$cod] = $n
}
[void]$s.AppendLine("];")
[IO.File]::WriteAllText((Join-Path $ROOT "schedule.js"), $s.ToString(), $utf8bom)

# ============================================================
#  resumen
# ============================================================
""
"=== planes.js ==="
"{0,-5}{1,8}{2,10}{3,10}{4,10}" -f 'car','oblig','cr_oblig','optativas','total'
foreach($r in $resumen){ "{0,-5}{1,8}{2,10}{3,10}{4,10}" -f $r.car,$r.obl,$r.crObl,$r.opt,$r.total }
""
"=== schedule.js ==="
$tot = 0
foreach($k in $porCarrera.Keys){ "{0,-5}{1,6} ofertas" -f $k,$porCarrera[$k]; $tot += $porCarrera[$k] }
"TOTAL $tot ofertas"
""
if($avisos.Count){
  "=== avisos ($($avisos.Count)) ==="
  foreach($a in ($avisos | Sort-Object -Unique)){ "  $a" }
} else { "sin avisos" }

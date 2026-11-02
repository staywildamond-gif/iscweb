#!/bin/bash
# uso: pdf2png.sh <pdf> <png> [ancho]
PDF="$1"; OUT="$2"; W="${3:-2400}"
SP="$(dirname "$OUT")"
B64=$(base64 -w0 "$PDF")
cat > "$SP/_r.html" <<EOF
<!doctype html><html><head><meta charset="utf-8"><title>START</title><style>html,body{margin:0;padding:0;background:#fff}canvas{display:block}</style></head>
<body><canvas id="c"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"></script>
<script>
const raw=atob('$B64'); const arr=new Uint8Array(raw.length);
for(let i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i);
pdfjsLib.getDocument({data:arr}).promise.then(p=>p.getPage(1)).then(function(page){
  const b=page.getViewport({scale:1}); const vp=page.getViewport({scale:$W/b.width});
  const c=document.getElementById('c'); c.width=Math.floor(vp.width); c.height=Math.floor(vp.height);
  return page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise.then(()=>{document.title='OK '+c.width+'x'+c.height;});
}).catch(e=>{document.title='ERR '+e.message;});
</script></body></html>
EOF
WIN=$("/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files --user-data-dir="$SP/profile" --virtual-time-budget=30000 --dump-dom "file:///$(echo "$SP/_r.html" | sed 's|^/c/|C:/|')" 2>/dev/null | grep -oE '<title>OK [0-9]+x[0-9]+' | grep -oE '[0-9]+x[0-9]+')
[ -z "$WIN" ] && { echo "FALLO el render"; exit 1; }
H="${WIN#*x}"
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files --user-data-dir="$SP/profile" --window-size="$W,$H" --hide-scrollbars --virtual-time-budget=30000 --screenshot="$OUT" "file:///$(echo "$SP/_r.html" | sed 's|^/c/|C:/|')" >/dev/null 2>&1
echo "$WIN  ->  $OUT  ($(stat -c%s "$OUT") bytes)"

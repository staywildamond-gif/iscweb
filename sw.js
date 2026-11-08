// ============================================================
//  SERVICE WORKER — que la app abra sin internet
// ============================================================
// Los datos ya viven en el navegador (localStorage), así que lo único que
// faltaba para funcionar sin conexión eran los archivos. Con esto, una vez
// visitada, la app abre en el metro.
//
// Estrategia: **red primero, caché de respaldo** para todo lo propio.
//
// Lo intuitivo sería caché primero (más rápido), y así estaba al principio.
// Duró diez minutos: editas styles.css, recargas y sigues viendo el viejo,
// porque el service worker te sirve su copia sin preguntar. Mientras el
// proyecto se siga editando todos los días, eso cuesta más de lo que ahorra.
// Sin conexión el respaldo entra igual, que es para lo que está esto.
//
// La excepción son las fuentes de Google: esas sí van caché primero, porque
// vienen con hash en la URL y no cambian nunca.

const VERSION = "v1";
const CACHE = "escom-" + VERSION;

// El mínimo para pintar: lo diferido (cupos, maestros_manual, historial) entra
// solo a la caché la primera vez que la app lo pide.
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "favicon.svg",
  "manifest.webmanifest",
  "roster.js", "metrics.js", "schedule.js", "planes.js", "optativas.js", "calendario.js",
  "lazy.js", "data.js", "core.js", "avance.js", "maestros.js", "horario.js",
  "optativas-ui.js", "auto.js", "export.js", "historial-ui.js", "calendario-ui.js",
  "carrera-ui.js", "tema.js", "buscador.js", "comparador.js", "compartir.js",
  "atajos.js", "portada.js", "init.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll falla entero si un archivo falla; uno a uno es más tolerante
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const propio = url.origin === location.origin;
  const fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propio && !fuentes) return;

  // Fuentes de Google: caché primero, no cambian nunca
  if (fuentes) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        if (r && r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return r;
      }))
    );
    return;
  }

  // Lo propio: red primero; si no hay conexión, lo último que se guardó
  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r && r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return r;
      })
      .catch(() => caches.match(req).then((hit) =>
        hit || (req.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});

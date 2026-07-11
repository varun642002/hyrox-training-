const CACHE = "ignyt-v4";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the app shell (index.html, app.js) so a code update is picked up
// on the very next load instead of staying frozen on whatever was precached at install
// time -- this is what caused the old CSS + new JS mismatch. Falls back to cache only
// when offline. Other assets (icons, manifest) stay cache-first since they rarely change.
const NETWORK_FIRST = [/index\.html$/, /app\.js$/];

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isShell = e.request.mode === "navigate" || NETWORK_FIRST.some((re) => re.test(url.pathname));
  if (isShell) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
  }
});

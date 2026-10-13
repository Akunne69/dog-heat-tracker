const CACHE_NAME = "dog-heat-tracker-v1";
const FILES = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))));
self.addEventListener("fetch", event => { if(event.request.method==="GET") event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request))); });
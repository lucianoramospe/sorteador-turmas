const CACHE_NAME = 'sorteador-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './script.js',
  './logo.png'
];

// Instala o Service Worker e guarda os arquivos cruciais no cache do celular
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Ativa o Service Worker
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Serve os arquivos direto do celular para abrir instantaneamente
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
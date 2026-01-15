// public/service-worker.js
const CACHE_NAME = 'elprofetino-v2';
const API_CACHE_NAME = 'elprofetino-api-v1';

// Recursos para cachear
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/public/js/tools-client.js',
  '/public/js/mapa-uruguay.js',
  '/public/css/estilos-mapas.css',
  '/favicon.ico'
];

// Instalar service worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cacheando recursos críticos');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar fetch requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Cachear respuestas de API (solo GET)
  if (url.pathname.startsWith('/api/') && event.request.method === 'GET') {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            console.log('📦 API response from cache:', url.pathname);
            return response;
          }
          
          return fetch(event.request).then(networkResponse => {
            // Cachear respuestas exitosas
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Para otros recursos, estrategia cache-first
  if (PRECACHE_URLS.some(precacheUrl => url.pathname.includes(precacheUrl))) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// Manejar mensajes desde la página
self.addEventListener('message', event => {
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    caches.delete(API_CACHE_NAME);
    console.log('🧹 Cache limpiado por petición del usuario');
  }
});

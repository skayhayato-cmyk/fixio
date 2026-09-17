// Fixio Service Worker - Online-First PWA Mode
// All tools require an active internet connection to communicate with live APIs.
const SW_VERSION = 'fixio-online-v3.0.0';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing tabs
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear legacy caches to ensure live network data is always served
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Passthrough to live network. If offline, catch error safely.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch((err) => {
      if (event.request.mode === 'navigate') {
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixio Offline</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f2f2f7;color:#1c1c1e;text-align:center;padding:20px}div{background:#fff;padding:32px;border-radius:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06);max-width:360px}h2{margin:0 0 10px;font-size:20px}p{font-size:14px;color:#8e8e93;line-height:1.5;margin:0 0 20px}button{background:#007aff;color:#fff;border:none;padding:12px 24px;border-radius:100px;font-weight:600;cursor:pointer}</style></head><body><div><h2>Koneksi Terputus</h2><p>Fixio memerlukan koneksi internet aktif untuk memproses media dan menjalankan alat.</p><button onclick="window.location.reload()">Coba Lagi</button></div></body></html>',
          {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }
        );
      }
      return Promise.reject(err);
    })
  );
});

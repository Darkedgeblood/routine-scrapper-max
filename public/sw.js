const CACHE_NAME = 'routine-max-cache-v4';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch('/', { cache: 'reload' });
      if (response.ok && response.type === 'basic') {
        await cache.put('/', response.clone());
        const html = await response.text();
        const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
          .map((match) => match[1])
          .filter((path) => path.startsWith('/_next/static/'));

        await Promise.allSettled(assets.map(async (path) => {
          const asset = await fetch(path, { cache: 'reload' });
          if (asset.ok && asset.type === 'basic' && !/no-store|private/i.test(asset.headers.get('Cache-Control') || '')) {
            await cache.put(path, asset);
          }
        }));
      }
    } catch (error) {
      console.warn('Could not pre-cache the app shell for offline use.', error);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  // Keep authenticated and API responses out of Cache Storage. Personal routine data is private.
  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith('/api/') ||
    event.request.headers.has('authorization')
  ) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        const cacheControl = response.headers.get('Cache-Control') || '';
        if (response.ok && response.type === 'basic' && !/no-store|private/i.test(cacheControl)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        return event.request.mode === 'navigate'
          ? (await caches.match('/')) || Response.error()
          : Response.error();
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const appWindow = windows.find((client) => 'focus' in client);
      if (appWindow) return appWindow.focus();
      return self.clients.openWindow('/');
    })
  );
});


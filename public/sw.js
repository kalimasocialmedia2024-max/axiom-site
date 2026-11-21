// عامل الخدمة لتطبيق AXIOM+: الشبكة أوّلاً دائماً كي تبقى الأخبار حديثة،
// والنسخة المحفوظة تُعرض فقط حين ينقطع الاتصال.
const CACHE = 'axiom-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (req.mode === 'navigate' || /\.(css|js|png|svg|woff2?)$/.test(new URL(req.url).pathname))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/') : undefined)))
  );
});

// الإشعارات: يصل التنبيه فارغاً، فيجلب العامل عنوان الخبر ويعرضه.
self.addEventListener('push', (e) => {
  e.waitUntil(
    fetch('/api/push-latest', { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => ({}))
      .then((d) =>
        self.registration.showNotification('AXIOM+', {
          body: d.title || 'جديد على AXIOM+',
          icon: '/brand/logo-square.png',
          badge: '/brand/logo-square.png',
          dir: 'rtl',
          lang: 'ar',
          tag: d.id || 'axiom',
          data: { url: d.url || '/' },
        })
      )
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow((e.notification.data && e.notification.data.url) || '/'));
});

const CACHE_NAME = "tapwash-v1";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = ["/", OFFLINE_URL, "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // App shell navigation: try network, fall back to offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Same-origin GETs: cache-first for precached assets, otherwise network with cache fallback
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).catch(() => caches.match(OFFLINE_URL));
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || "TapWash";
  const options = {
    body: payload.body || "You have a new update",
    data: {
      orderId: payload.orderId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const targetUrl = orderId ? `/customer/orders/${orderId}` : "/customer/orders";
  event.waitUntil(clients.openWindow(targetUrl));
});

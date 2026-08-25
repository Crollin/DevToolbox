/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = {
    title: 'DevToolbox',
    body: 'Nouvelle notification',
    url: '/',
  };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    try {
      const text = event.data?.text();
      if (text) {
        payload.body = text;
      }
    } catch {
      // keep defaults
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'DevToolbox', {
      body: payload.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url || '/';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await (client as WindowClient).navigate(absoluteUrl);
          }
          return;
        }
      }
      await self.clients.openWindow(absoluteUrl);
    })()
  );
});

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

function parsePushPayload(event: PushEvent): PushPayload {
  const defaults: PushPayload = {
    title: 'DevToolbox',
    body: 'Nouvelle notification',
    url: '/',
  };
  if (!event.data) {
    return defaults;
  }
  try {
    return { ...defaults, ...event.data.json() };
  } catch {
    const text = event.data.text();
    return text ? { ...defaults, body: text } : defaults;
  }
}

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title || 'DevToolbox', {
      body: payload.body || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
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

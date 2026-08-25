import api from '@/lib/api';

export interface PushStatus {
  count: number;
  enabled: boolean;
  configured: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getPushStatus(): Promise<PushStatus> {
  return api.get<PushStatus>('/account/push/subscriptions');
}

export async function getVapidPublicKey(): Promise<string> {
  const data = await api.get<{ publicKey: string }>('/account/push/vapid-public-key');
  return data.publicKey;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.ready;
  return registration;
}

export async function subscribeToWebPush(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('Les notifications push ne sont pas supportées sur ce navigateur');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission de notification refusée');
  }

  const publicKey = await getVapidPublicKey();
  const registration = await getRegistration();
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Subscription navigateur invalide');
  }

  await api.post('/account/push/subscriptions', {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  });

  return subscription;
}

export async function unsubscribeFromWebPush(): Promise<void> {
  if (!isPushSupported()) {
    await api.delete('/account/push/subscriptions');
    return;
  }

  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  const endpoint = subscription?.endpoint;

  if (subscription) {
    await subscription.unsubscribe();
  }

  if (endpoint) {
    await api.delete('/account/push/subscriptions', { endpoint });
  } else {
    await api.delete('/account/push/subscriptions');
  }
}

export async function testWebPush(): Promise<{ results: { webpush?: boolean }; count?: number }> {
  return api.post('/account/push/test');
}

export async function getLocalPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }
  const registration = await getRegistration();
  return registration.pushManager.getSubscription();
}

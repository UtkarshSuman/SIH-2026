/**
 * firebase-messaging-sw.js — Rescue-Arc FCM Service Worker
 * Served from / so it scopes to the whole Next.js app.
 * Firebase config is injected via postMessage from the subscribe page.
 */

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

/* Default config (matches the firebase-messaging-sw.js in rescue_arc_alert) */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCj5i1D_G6wg4g149CUhVf899IX5mifJ00",
  authDomain: "rescue-arc-9b293.firebaseapp.com",
  projectId: "rescue-arc-9b293",
  storageBucket: "rescue-arc-9b293.firebasestorage.app",
  messagingSenderId: "420144730893",
  appId: "1:420144730893:web:d972e7ddc4f45827141644",
};

self.__firebaseConfig = self.__firebaseConfig || DEFAULT_FIREBASE_CONFIG;

if (!firebase.apps.length) {
  firebase.initializeApp(self.__firebaseConfig);
}

const messaging = firebase.messaging();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

/* ---------- Background message handler ----------------------------- */
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};
  const severity = data.severity || "info";
  const zoneColor = data.zone_color || "GREEN";
  const zoneId = data.zone_id || "";

  const iconPath = icon || `/icons/icon-${severity}.png`;

  return self.registration.showNotification(title || "Rescue-Arc Alert", {
    body: body || `Zone ${zoneId} is now ${zoneColor}.`,
    icon: iconPath,
    badge: "/icons/badge-96.png",
    tag: `rescue-arc-${zoneId}`,
    renotify: severity === "alert",
    requireInteraction: severity === "alert",
    vibrate: severity === "alert" ? [200, 100, 200] : [100],
    data: {
      url: data.url || "/alerts",
      zone_id: zoneId,
      zone_color: zoneColor,
      severity,
    },
  });
});

/* ---------- Notification click → open app -------------------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/alerts";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if (c.url.includes(url) && "focus" in c) return c.focus();
        }
        return clients.openWindow(url);
      })
  );
});

/* ---------- Config injection from page ----------------------------- */
self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_CONFIG" && !self.__firebase_initialized) {
    self.__firebaseConfig = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config);
    }
    self.__firebase_initialized = true;
  }
});

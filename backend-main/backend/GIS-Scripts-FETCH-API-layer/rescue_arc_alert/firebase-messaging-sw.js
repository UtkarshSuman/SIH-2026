/**
 * firebase-messaging-sw.js — Rescue-Arc FCM Service Worker
 *
 * Must be served from the root scope (/) of your origin so the browser
 * registers it for the whole app.  Never serve via file:// — service
 * workers require HTTPS or localhost (spec Section 3A).
 *
 * The Firebase config values below are injected by the page at install time
 * via importScripts (see subscriber.js) so this file never needs to hard-code
 * API keys.  The VAPID key is passed from the browser side when calling
 * getToken(), not stored here.
 */

/* ---------- Firebase compat SDK (v9 compat shim from CDN) ---------- */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

/* ---------- Default Firebase Config ------------------------------- */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCj5i1D_G6wg4g149CUhVf899IX5mifJ00",
  authDomain: "rescue-arc-9b293.firebaseapp.com",
  projectId: "rescue-arc-9b293",
  storageBucket: "rescue-arc-9b293.firebasestorage.app",
  messagingSenderId: "420144730893",
  appId: "1:420144730893:web:d972e7ddc4f45827141644",
  measurementId: "G-B3K9K5XJ92"
};

/* ---------- Initialise Firebase (idempotent) ------------------------ */
self.__firebaseConfig = self.__firebaseConfig || DEFAULT_FIREBASE_CONFIG;

if (!firebase.apps.length) {
  firebase.initializeApp(self.__firebaseConfig);
}

const messaging = firebase.messaging();

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

/* ---------- Background message handler ----------------------------- */
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);

  const { title, body, icon, badge, requireInteraction, vibrate } =
    payload.notification || {};

  const data = payload.data || {};
  const severity = data.severity || "info";
  const zoneColor = data.zone_color || "GREEN";
  const zoneId    = data.zone_id    || "";

  // Color-code the notification icon path by severity
  const iconPath  = icon  || `/icons/icon-${severity}.png`;
  const badgePath = badge || "/icons/badge-96.png";

  const notifOptions = {
    body:              body || `Zone ${zoneId} is now ${zoneColor}.`,
    icon:              iconPath,
    badge:             badgePath,
    tag:               `rescue-arc-${zoneId}`,   // replace older notif for same zone
    renotify:          severity === "alert",       // buzz again even if same tag
    requireInteraction: requireInteraction ?? (severity === "alert"),
    vibrate:           vibrate ? JSON.parse(vibrate) : (severity === "alert" ? [200, 100, 200] : [100]),
    data: {
      url: data.url || "/",
      zone_id:   zoneId,
      zone_color: zoneColor,
      severity:  severity,
    },
  };

  return self.registration.showNotification(
    title || "Rescue-Arc Alert",
    notifOptions
  );
});

/* ---------- Notification click handler ----------------------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

/* ---------- Config message handler --------------------------------- */
self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_CONFIG" && !self.firebase_initialized_with_config) {
    self.__firebaseConfig = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config);
    }
    self.firebase_initialized_with_config = true;
  }
});

// This file MUST be served from the ROOT of your website (same folder as subscriber.html
// is fine if that IS your root, e.g. https://yoursite.com/firebase-messaging-sw.js).
// It cannot be inside a subfolder or it won't be able to intercept push events.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// === PASTE THE SAME FIREBASE CONFIG AS IN subscriber.html ===
const firebaseConfig = {
  apiKey: "AIzaSyCmfXDnyRHm8TD-Yi8dJdCgN72SS8hC_cI",
  authDomain: "rescue-arc.firebaseapp.com",
  projectId: "rescue-arc",
  storageBucket: "rescue-arc.firebasestorage.app",
  messagingSenderId: "524996615036",
  appId: "1:524996615036:web:e43e7ba29046444705a2f9"
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handles notifications when the tab/app is in the background or closed
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "🚨 Rescue Arc — Hazard Alert";
  const options = {
    body: payload.notification?.body || "",
    icon: "/assets/rescue-arc-icon.png",
    badge: "/assets/rescue-arc-badge.png",
    vibrate: [200, 100, 200],
    tag: "rescue-arc-alert",
    renotify: true,
    requireInteraction: true,
    data: { url: payload.fcmOptions?.link || "/dashboard.html" }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

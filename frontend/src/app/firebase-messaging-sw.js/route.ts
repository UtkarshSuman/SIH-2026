/**
 * Serves the Firebase Messaging service worker as a JS response.
 * The content is inlined so it works on Vercel where backend2/ doesn't exist at runtime.
 */
export const dynamic = "force-dynamic";

const SERVICE_WORKER_SCRIPT = `
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "🚨 Rescue Arc — Hazard Alert";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logo.jpeg",
    badge: "/logo.jpeg",
    vibrate: [200, 100, 200],
    tag: "rescue-arc-alert",
    renotify: true,
    requireInteraction: true,
    data: { url: payload.fcmOptions?.link || "/dashboard" }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
`;

export async function GET() {
  return new Response(SERVICE_WORKER_SCRIPT.trim(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
    },
  });
}
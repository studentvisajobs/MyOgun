importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB8SLXILg20vmnTGCkVj5-PDXnMJsbmIwE",
  authDomain: "myogun-a6557.firebaseapp.com",
  projectId: "myogun-a6557",
  storageBucket: "myogun-a6557.firebasestorage.app",
  messagingSenderId: "769440580815",
  appId: "1:769440580815:web:50439e0944c72053f163ba",
});


const messaging = firebase.messaging();

// Firebase displays background notifications that contain
// a notification payload. Avoid showing a duplicate here.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "MyOgun background notification received:",
    payload.data?.clickAction || "No destination"
  );
});

// Handle notification clicks.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawDestination =
    event.notification.data?.FCM_MSG?.data?.clickAction ||
    event.notification.data?.clickAction ||
    "/guardian-circle";

  let destination;

  try {
    const url = new URL(rawDestination, self.location.origin);

    // Never allow notification data to redirect
    // users to another website.
    if (url.origin !== self.location.origin) {
      return;
    }

    destination = url.href;
  } catch {
    return;
  }

  event.waitUntil(
    (async () => {
      const windows = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if (client.url === destination) {
          return client.focus();
        }
      }

      return clients.openWindow(destination);
    })()
  );
});


messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title || "MyOgun Alert";

  const options = {
    body:
      payload.notification?.body ||
      "You have a new alert.",
    icon: "/icon-192.png",
  };

  self.registration.showNotification(
    title,
    options
  );
});
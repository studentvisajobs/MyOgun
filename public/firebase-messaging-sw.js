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
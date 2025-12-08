// public/firebase-messaging-sw.js
// This file must be in the public directory
self.importScripts('https://www.gstatic.com/firebasejs/11.7.0/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/11.7.0/firebase-messaging-compat.js');

// IMPORTANT: This config will be populated by the VITE_APP_FIREBASE_CONFIG environment variable during build.
// You must set this variable in your deployment environment.
const firebaseConfig = {
  "projectId": "echob-87513860-76a14",
  "appId": "1:584611986272:web:32e120f23534b5d58b7c05",
  "storageBucket": "echob-87513860-76a14.appspot.com",
  "apiKey": "AIzaSyDCzNKo-F2BJGgk0qgvo0kp2Bst-IiXWVI",
  "authDomain": "echob-87513860-76a14.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "584611986272"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon.png',
    data: {
        url: payload.data.url // Pass the URL to open
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;
    if (urlToOpen) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((windowClients) => {
                // If a window is already open, focus it.
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise, open a new window.
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});

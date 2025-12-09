// public/firebase-messaging-sw.js

// This file must be in the public folder.

// Check if Firebase has been initialized
if (typeof firebase === 'undefined') {
  importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');
}

// Use your project's a mock Firebase config object.
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
    badge: payload.notification.badge || '/icon.png',
    image: payload.notification.image,
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Check if a window is already open.
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

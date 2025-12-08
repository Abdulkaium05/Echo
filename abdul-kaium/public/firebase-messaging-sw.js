// /public/firebase-messaging-sw.js
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// IMPORTANT: REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDCzNKo-F2BJGgk0qgvo0kp2Bst-IiXWVI",
  authDomain: "echob-87513860-76a14.firebaseapp.com",
  projectId: "echob-87513860-76a14",
  storageBucket: "echob-87513860-76a14.appspot.com",
  messagingSenderId: "584611986272",
  appId: "1:584611986272:web:32e120f23534b5d58b7c05",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // App icon
    data: { // Pass along data for click handling
        url: payload.data.url
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification

    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // If a window for the app is already open, focus it
            for (const client of clientList) {
                // Check if the client's URL is the main app URL
                if (client.url === '/' && 'focus' in client) {
                    // Navigate the existing client to the correct URL and then focus
                    return client.navigate(urlToOpen).then(c => c.focus());
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});


// A service worker is required for background notifications.
// This file needs to be in the public directory.
// It will be automatically registered by Firebase.
self.addEventListener('install', function(e) {
  console.log('FCM SW install..');
});

self.addEventListener('activate', function(e) {
  console.log('FCM SW activate..');
});

self.addEventListener('fetch', function(e) {
  // This service worker is primarily for push notifications,
  // so we don't need to intercept fetch requests.
});

// Handle incoming push notifications
self.addEventListener('push', function(e) {
  if (!e.data || !e.data.json()) {
    console.warn('Push event but no data');
    return;
  }
  
  const data = e.data.json();
  console.log('Push received...', data);
  
  const title = data.notification.title;
  const options = {
    body: data.notification.body,
    icon: data.notification.icon || '/icon.png',
    data: {
      url: data.data.url
    }
  };
  
  e.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', function(e) {
  const notification = e.notification;
  const urlToOpen = notification.data.url;
  
  e.notification.close(); // Close the notification

  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsArr => {
      // Check if a window is already open and focus it.
      const hadWindowToFocus = clientsArr.some(windowClient => {
        if (windowClient.url === urlToOpen) {
          windowClient.focus();
          return true;
        }
        return false;
      });

      // Otherwise, open a new window.
      if (!hadWindowToFocus) {
        clients.openWindow(urlToOpen).then(windowClient => {
          // You can do something with the new window if needed.
        });
      }
    })
  );
});

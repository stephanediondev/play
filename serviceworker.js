var CACHE_KEY = 'serviceworker-v1';
var CACHE_FILES = [
    'manifest.json',
    'index.html',
    'app/core.css',
    'app/core.js',
    'app/icons/icon-32x32.png',
    'app/icons/icon-192x192.png',
    'app/icons/icon-512x512.png',
    'vendor/material-design-lite/material.min.css',
    'vendor/material-design-lite/material.min.js'
];
var TAG = 'serviceworker';

self.addEventListener('install', function(InstallEvent) {
    console.log(InstallEvent);

    postMessage('install event from service worker');

    if('waitUntil' in InstallEvent) {
        InstallEvent.waitUntil(
            setCache()
        );
    }

    self.skipWaiting();
});

self.addEventListener('activate', function(ExtendableEvent) {
    console.log(ExtendableEvent);

    postMessage('activate event from service worker');

    self.clients.matchAll().then(function(clientList) {
        clientList.some(function(client) {
            if(client.focused) {
                postMessage('client: ' + client.id);
            }
        });
    });

    if('waitUntil' in ExtendableEvent) {
        ExtendableEvent.waitUntil(
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if(cacheName !== CACHE_KEY) {
                            postMessage('delete cache: ' + cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }).then(function() {
                return self.clients.claim();
            })
        );
    }
});

self.addEventListener('fetch', function(FetchEvent) {
    console.log(FetchEvent);

    postMessage('fetch event from service worker');

    postMessage(FetchEvent.request.url);

    FetchEvent.respondWith(
        caches.match(FetchEvent.request).then(function(response) {
            if(response) {
                postMessage('from service worker');
                return response;
            }
            postMessage('from server');
            return fetch(FetchEvent.request);
        })
    );
});

self.addEventListener('sync', function(SyncEvent) {
    console.log(SyncEvent);

    postMessage('sync event from service worker');
});

self.addEventListener('periodicsync', function(PeriodicSyncEvent) {
    console.log(PeriodicSyncEvent);

    postMessage('periodicsync event from service worker');
});

self.addEventListener('pushsubscriptionchange', function(PushEvent) {
    console.log(PushEvent);

    postMessage('pushsubscriptionchange event from service worker');
});

self.addEventListener('push', function(PushEvent) {
    console.log(PushEvent);

    postMessage('push event from service worker');

    if('waitUntil' in PushEvent) {
        PushEvent.waitUntil(
            showNotification('push event from service worker', 'body', TAG)
        );
    }
});

self.addEventListener('notificationclick', function(NotificationEvent) {
    console.log(NotificationEvent);

    postMessage('notificationclick event from service worker');

    postMessage('action: ' + NotificationEvent.action);

    NotificationEvent.notification.close();
});

self.addEventListener('message', function(ExtendableMessageEvent) {
    console.log(ExtendableMessageEvent);

    postMessage('message event from service worker');

    postMessage('command: ' + ExtendableMessageEvent.data.command);

    postMessage('source: ' + ExtendableMessageEvent.source.id);

    switch(ExtendableMessageEvent.data.command) {
        case 'reload-cache':
            setCache();
        break;

        case 'send-notification':
            showNotification('message event from service worker', ExtendableMessageEvent.data.content, TAG);
        break;

        default:
            postMessage('unknown command: ' + ExtendableMessageEvent.data.command);
    }
});

function showNotification(title, body, tag) {
    self.registration.showNotification(title, {
        body: body,
        tag: tag,
        badge: 'app/icons/icon-32x32.png',
        icon: 'app/icons/icon-192x192.png',
        image: '3680468.jpg',
        actions: [
            { action: 'action1', title: 'action 1', icon: 'app/icons/icon-192x192.png' },
            { action: 'action2', title: 'action 2', icon: 'app/icons/icon-192x192.png' }
        ]
    });
}

function setCache() {
    caches.open(CACHE_KEY).then(function(cache) {
        return cache.addAll(CACHE_FILES);
    });
}

function postMessage(content) {
    self.clients.matchAll().then(function(clients) {
        Promise.all(clients.map(function(client) {
            client.postMessage({content: content});
        }));
    });
}

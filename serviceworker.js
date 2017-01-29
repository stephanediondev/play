var CACHE_KEY = 'playground-pwa-v1';
var CACHE_FILES = [
    'manifest.json',
    'index.html',
    'index.html?utm=homescreen',
    'app/core.css',
    'app/core.js',
    'app/icons/icon-32x32.png',
    'app/icons/icon-192x192.png',
    'app/icons/icon-512x512.png',
    'vendor/material-design-lite/material.min.css',
    'vendor/material-design-lite/material.min.js'
];
var TAG = 'playground-pwa';

self.addEventListener('install', function(InstallEvent) {
    console.log(InstallEvent);

    postMessage('history', 'install event from service worker');

    if('waitUntil' in InstallEvent) {
        InstallEvent.waitUntil(
            setCache()
        );
    }

    self.skipWaiting();
});

self.addEventListener('activate', function(ExtendableEvent) {
    console.log(ExtendableEvent);

    postMessage('history', 'activate event from service worker');

    self.clients.matchAll().then(function(clients) {
        clients.map(function(client) {
            if(client.focused) {
                postMessage('history', 'client: ' + client.id);
            }
        });
    });

    if('waitUntil' in ExtendableEvent) {
        ExtendableEvent.waitUntil(
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if(cacheName !== CACHE_KEY) {
                            postMessage('history', 'delete cache: ' + cacheName);
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

    postMessage('history', 'fetch event from service worker');

    postMessage('history', FetchEvent.request.url);

    FetchEvent.respondWith(
        caches.match(FetchEvent.request).then(function(response) {
            if(response) {
                postMessage('history', 'from service worker');
                return response;
            }
            postMessage('history', 'from server');
            return fetch(FetchEvent.request);
        })
    );
});

self.addEventListener('sync', function(SyncEvent) {
    console.log(SyncEvent);

    postMessage('history', SyncEvent.tag);

    SyncEvent.waitUntil(
        self.clients.matchAll().then(function(clients) {
            return clients.map(function(client) {
                postMessage('history', 'sync event from service worker');
            });
        })
    );
});

self.addEventListener('periodicsync', function(PeriodicSyncEvent) {
    console.log(PeriodicSyncEvent);

    postMessage('history', 'periodicsync event from service worker');
});

self.addEventListener('pushsubscriptionchange', function(PushEvent) {
    console.log(PushEvent);

    postMessage('history', 'pushsubscriptionchange event from service worker');
});

self.addEventListener('push', function(PushEvent) {
    console.log(PushEvent);

    postMessage('history', 'push event from service worker');

    if('waitUntil' in PushEvent) {
        PushEvent.waitUntil(
            showNotification('from service worker (push event)', 'body', TAG)
        );
    }
});

self.addEventListener('notificationclick', function(NotificationEvent) {
    console.log(NotificationEvent);

    postMessage('history', 'notificationclick event from service worker');

    postMessage('snackbar', NotificationEvent.action);

    NotificationEvent.notification.close();
});

self.addEventListener('message', function(ExtendableMessageEvent) {
    console.log(ExtendableMessageEvent);

    postMessage('history', 'message event from service worker');

    postMessage('history', 'command: ' + ExtendableMessageEvent.data.command);

    postMessage('history', 'source: ' + ExtendableMessageEvent.source.id);

    switch(ExtendableMessageEvent.data.command) {
        case 'reload-cache':
            setCache();
        break;

        case 'send-notification':
            showNotification('from service worker (message event)', ExtendableMessageEvent.data.content, TAG);
        break;

        default:
            postMessage('history', 'unknown command: ' + ExtendableMessageEvent.data.command);
    }
});

function setCache() {
    caches.delete(CACHE_KEY);
    caches.open(CACHE_KEY).then(function(cache) {
        return cache.addAll(CACHE_FILES);
    });
}

function showNotification(title, body, tag) {
    self.registration.showNotification(title, {
        body: body,
        tag: tag,
        badge: 'app/icons/icon-32x32.png',
        icon: 'app/icons/icon-192x192.png',
        image: 'app/icons/icon-512x512.png',
        actions: [
            { action: 'action1', title: 'action 1', icon: 'app/icons/icon-192x192.png' },
            { action: 'action2', title: 'action 2', icon: 'app/icons/icon-192x192.png' }
        ]
    });
}

function postMessage(type, content) {
    self.clients.matchAll().then(function(clients) {
        clients.map(function(client) {
            client.postMessage({type: type, content: content});
        });
    });
}

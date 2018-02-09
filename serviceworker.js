var CACHE_KEY = 'playground-pwa-v3';
var CACHE_FILES = [
    '.',
    'manifest.json',
    'index.html',
    'app/functions.js',
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

    messageToClient('history', 'install event from service worker');

    if('waitUntil' in InstallEvent) {
        InstallEvent.waitUntil(
            cacheAddAll()
        );
    }
});

self.addEventListener('activate', function(ExtendableEvent) {
    console.log(ExtendableEvent);

    messageToClient('history', 'activate event from service worker');

    self.clients.matchAll().then(function(clients) {
        clients.map(function(client) {
            if(client.focused) {
                messageToClient('history', 'client: ' + client.id);
            }
        });
    });

    if('waitUntil' in ExtendableEvent) {
        ExtendableEvent.waitUntil(
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if(cacheName !== CACHE_KEY) {
                            messageToClient('history', 'delete cache: ' + cacheName);
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

    if(FetchEvent.request.url.indexOf('notification.php') === -1) {
        FetchEvent.respondWith(
            caches.match(FetchEvent.request).then(function(Response) {
                if(Response) {
                    console.log(Response);
                    return Response;
                }
                return fetch(FetchEvent.request).then(function(Response) {
                    console.log(Response);
                    return Response;
                });
            })
        );
    }
});

self.addEventListener('sync', function(SyncEvent) {
    console.log(SyncEvent);

    messageToClient('history', SyncEvent.tag);

    SyncEvent.waitUntil(
        self.clients.matchAll().then(function(clients) {
            return clients.map(function(client) {
                messageToClient('history', 'sync event from service worker');
            });
        })
    );
});

self.addEventListener('periodicsync', function(PeriodicSyncEvent) {
    console.log(PeriodicSyncEvent);

    messageToClient('history', 'periodicsync event from service worker');
});

self.addEventListener('pushsubscriptionchange', function(PushEvent) {
    console.log(PushEvent);

    messageToClient('history', 'pushsubscriptionchange event from service worker');
});

self.addEventListener('push', function(PushEvent) {
    console.log(PushEvent);

    messageToClient('history', 'push event from service worker');

    if('waitUntil' in PushEvent) {
        if(PushEvent.data) {
            var data = PushEvent.data.json();
            PushEvent.waitUntil(
                self.registration.showNotification(data.title, {
                    body: data.body,
                    badge: 'app/icons/icon-32x32.png',
                    icon: 'app/icons/icon-192x192.png',
                    image: 'app/icons/icon-512x512.png',
                    actions: [
                        { action: 'action1', title: 'action 1', icon: 'app/icons/icon-192x192.png' },
                        { action: 'action2', title: 'action 2', icon: 'app/icons/icon-192x192.png' }
                    ]
                })
            );
        }
    }
});

self.addEventListener('notificationclick', function(NotificationEvent) {
    console.log(NotificationEvent);

    messageToClient('history', 'notificationclick event from service worker');

    messageToClient('snackbar', NotificationEvent.action);

    NotificationEvent.notification.close();
});

self.addEventListener('notificationclose', function(NotificationEvent) {
    console.log(NotificationEvent);

    messageToClient('history', 'notificationclose event from service worker');
});

self.addEventListener('message', function(ExtendableMessageEvent) {
    console.log(ExtendableMessageEvent);

    messageToClient('history', 'message event from service worker');

    messageToClient('history', 'command: ' + ExtendableMessageEvent.data.command);

    messageToClient('history', 'source: ' + ExtendableMessageEvent.source.id);

    switch(ExtendableMessageEvent.data.command) {
        case 'reload-cache':
            cacheAddAll();
        break;

        default:
            messageToClient('history', 'unknown command: ' + ExtendableMessageEvent.data.command);
    }
});

function cacheAddAll() {
    caches.delete(CACHE_KEY);
    caches.open(CACHE_KEY).then(function(cache) {
        return cache.addAll(CACHE_FILES);
    });
}

function messageToClient(type, content) {
    self.clients.matchAll().then(function(clients) {
        clients.map(function(client) {
            client.postMessage({type: type, content: content});
        });
    });
}

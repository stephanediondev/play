var LOG_ENABLED = true;
var FETCH_IN_CACHE = true;
var FETCH_EXCLUDE = [
    'notification.php',
];
var VERSION = '5';
var CACHE_KEY = 'playground-pwa-v' + VERSION;
var CACHE_FILES = [
    '.',
    'manifest.webmanifest',
    'index.html',
    'app/icons/icon-16x16.png',
    'app/icons/icon-32x32.png',
    'app/icons/icon-64x64.png',
    'app/icons/icon-128x128.png',
    'app/icons/icon-256x256.png',
    'app/icons/icon-512x512.png',
];

self.addEventListener('install', function(InstallEvent) {
    sendLog(InstallEvent);

    messageToClient('history', 'install event from service worker');

    InstallEvent.waitUntil(
        caches.open(CACHE_KEY).then(function(cache) {
            return cacheAddAll().then(function() {
                self.skipWaiting();
            });
        })
    );
});

self.addEventListener('activate', function(ExtendableEvent) {
    sendLog(ExtendableEvent);

    messageToClient('history', 'activate event from service worker');

    self.clients.matchAll().then(function(clients) {
        clients.map(function(client) {
            if(client.focused) {
                messageToClient('history', 'client: ' + client.id);
            }
        });
    });

    if('waitUntil' in ExtendableEvent) {
        ExtendableEvent.waitUntil(function() {
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
        });
    }
});

self.addEventListener('fetch', function(FetchEvent) {
    sendLog(FetchEvent);

    var fetchAllowed = true;
    FETCH_EXCLUDE.forEach(function(item, i) {
        if(FetchEvent.request.url.indexOf(item) !== -1) {
            fetchAllowed = false;
        }
    });


    fetchAllowed = false;


    if(fetchAllowed) {
        FetchEvent.respondWith(
            caches.open(CACHE_KEY).then(function(cache) {
                return cache.match(FetchEvent.request).then(function(Response) {
                    if(Response) {
                        sendLog(Response);
                        return Response;
                    }
                    return fetch(FetchEvent.request).then(function(Response) {
                        sendLog(Response);
                        if(FETCH_IN_CACHE) {
                            cache.put(FetchEvent.request, Response.clone());
                        }
                        return Response;
                    });
                });
            })
        );
    }
});

self.addEventListener('sync', function(SyncEvent) {
    sendLog(SyncEvent);

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
    sendLog(PeriodicSyncEvent);

    messageToClient('history', 'periodicsync event from service worker');
});

self.addEventListener('pushsubscriptionchange', function(PushSubscriptionChangeEvent) {
    sendLog(PushSubscriptionChangeEvent);

    messageToClient('history', 'pushsubscriptionchange event from service worker');

    if('waitUntil' in PushSubscriptionChangeEvent) {
        PushSubscriptionChangeEvent.waitUntil(
            self.registration.showNotification('pushsubscriptionchange', {
                body: 'pushsubscriptionchange',
                badge: 'app/icons/icon-32x32.png',
                icon: 'app/icons/icon-128x128.png',
                image: 'app/icons/icon-512x512.png',
                actions: [
                    { action: 'action1', title: 'action 1', icon: 'app/icons/icon-128x128.png' },
                    { action: 'action2', title: 'action 2', icon: 'app/icons/icon-128x128.png' }
                ]
            })
        );
    }
});

self.addEventListener('push', function(PushEvent) {
    sendLog(PushEvent);

    messageToClient('history', 'push event from service worker');

    if('waitUntil' in PushEvent) {
        if(PushEvent.data) {
            if ('setAppBadge' in navigator) {
                navigator.setAppBadge(randomIntFromInterval(1, 99))
                .catch(function(error) {
                    writeHistory(error);
                    console.log(error);
                });
            }

            var data = PushEvent.data.json();
            PushEvent.waitUntil(
                self.registration.showNotification(data.title, {
                    body: data.body,
                    badge: 'app/icons/icon-32x32.png',
                    icon: 'app/icons/icon-128x128.png',
                    image: 'app/icons/icon-512x512.png',
                    actions: [
                        { action: 'action1', title: 'action 1', icon: 'app/icons/icon-128x128.png' },
                        { action: 'action2', title: 'action 2', icon: 'app/icons/icon-128x128.png' }
                    ]
                })
            );
        }
    }
});

self.addEventListener('notificationclick', function(NotificationEvent) {
    sendLog(NotificationEvent);

    messageToClient('history', 'notificationclick event from service worker');

    messageToClient('snackbar', NotificationEvent.action);

    NotificationEvent.notification.close();
});

self.addEventListener('notificationclose', function(NotificationEvent) {
    sendLog(NotificationEvent);

    messageToClient('history', 'notificationclose event from service worker');
});

self.addEventListener('message', function(ExtendableMessageEvent) {
    sendLog(ExtendableMessageEvent);

    messageToClient('history', 'message event from service worker');

    messageToClient('history', 'command: ' + ExtendableMessageEvent.data.command);

    messageToClient('history', 'source: ' + ExtendableMessageEvent.source.id);

    switch(ExtendableMessageEvent.data.command) {
        case 'reload-cache':
            cacheAddAll().then(function() {
                messageToClient('reload', true);
            });
        break;
        case 'cache-key':
            messageToClient('snackbar', CACHE_KEY);
        break;

        default:
            messageToClient('history', 'unknown command: ' + ExtendableMessageEvent.data.command);
    }
});

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function cacheAddAll() {
    caches.delete(CACHE_KEY);
    return caches.open(CACHE_KEY).then(function(cache) {
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

function sendLog(log) {
    if(LOG_ENABLED) {
        console.log(log);
    }
}

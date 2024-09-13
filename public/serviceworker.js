var LOG_ENABLED = true;
var FETCH_IN_CACHE = true;
var FETCH_EXCLUDE = [
    'notification.php',
];
let appVersion = '5';
let appCacheKey = 'playground-pwa-v' + appVersion;
var CACHE_FILES = [
    '.',
    'manifest.webmanifest',
    'index.html',
    'app/icons/icon-192x192.png',
    'app/icons/icon-512x512.png',
];

self.addEventListener('install', function(installEvent) {
    sendLog(installEvent);

    messageToClient('history', 'install event from service worker');

    installEvent.waitUntil(
        caches.open(appCacheKey).then(async function(cache) {
            return cacheAddAll().then(function() {
                self.skipWaiting();
            });
        })
    );
});

self.addEventListener('activate', function(extendableEvent) {
    sendLog(extendableEvent);

    messageToClient('history', 'activate event from service worker');

    self.clients.matchAll().then(function(clients) {
        clients.map(function(client) {
            if(client.focused) {
                messageToClient('history', 'client: ' + client.id);
            }
        });
    });

    if('waitUntil' in extendableEvent) {
        extendableEvent.waitUntil(function() {
            caches.keys().then(function(cacheKeys) {
                return Promise.all(
                    cacheKeys.map(function(cacheKey) {
                        if(cacheKey !== appCacheKey) {
                            messageToClient('history', 'delete cache: ' + cacheKey);
                            return caches.delete(cacheKey);
                        }
                    })
                );
            }).then(function() {
                return self.clients.claim();
            })
        });
    }
});

self.addEventListener('fetch', function(fetchEvent) {
    sendLog(fetchEvent);

    var fetchAllowed = true;
    FETCH_EXCLUDE.forEach(function(item, i) {
        if(fetchEvent.request.url.indexOf(item) !== -1) {
            fetchAllowed = false;
        }
    });

    fetchAllowed = false;

    if(fetchAllowed) {
        fetchEvent.respondWith(
            caches.open(appCacheKey).then(async function(cache) {
                return cache.match(fetchEvent.request).then(function(cacheResponse) {
                    if(cacheResponse) {
                        sendLog(cacheResponse);
                        return cacheResponse;
                    }
                    return fetch(fetchEvent.request).then(function(fetchResponse) {
                        sendLog(fetchResponse);
                        if(FETCH_IN_CACHE) {
                            cache.put(fetchEvent.request, fetchResponse.clone());
                        }
                        return fetchResponse;
                    });
                });
            })
        );
    }
});

self.addEventListener('sync', function(syncEvent) {
    sendLog(syncEvent);

    messageToClient('history', syncEvent.tag);

    syncEvent.waitUntil(
        self.clients.matchAll().then(function(clients) {
            return clients.map(function(client) {
                messageToClient('history', 'sync event from service worker');
            });
        })
    );
});

self.addEventListener('periodicsync', function(periodicSyncEvent) {
    sendLog(periodicSyncEvent);

    messageToClient('history', 'periodicsync event from service worker');
});

self.addEventListener('pushsubscriptionchange', function(pushSubscriptionChangeEvent) {
    sendLog(pushSubscriptionChangeEvent);

    messageToClient('history', 'pushsubscriptionchange event from service worker');

    if('waitUntil' in pushSubscriptionChangeEvent) {
        pushSubscriptionChangeEvent.waitUntil(
            self.registration.showNotification('pushsubscriptionchange', {
                body: 'pushsubscriptionchange',
                badge: 'app/icons/icon-192x192.png',
                icon: 'app/icons/icon-192x192.png',
                image: 'app/icons/icon-512x512.png',
                actions: [
                    { action: 'action1', title: 'action 1', icon: 'app/icons/icon-192x192.png' },
                    { action: 'action2', title: 'action 2', icon: 'app/icons/icon-192x192.png' }
                ]
            })
        );
    }
});

self.addEventListener('push', function(pushEvent) {
    sendLog(pushEvent);

    messageToClient('history', 'push event from service worker');

    if('waitUntil' in pushEvent) {
        if(pushEvent.data) {
            if ('setAppBadge' in navigator) {
                navigator.setAppBadge(randomIntFromInterval(1, 99))
                .catch(function(error) {
                    writeHistory(error);
                    console.log(error);
                });
            }

            var data = pushEvent.data.json();
            pushEvent.waitUntil(
                self.registration.showNotification(data.title, {
                    body: data.body,
                    badge: 'app/icons/icon-192x192.png',
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

self.addEventListener('notificationclick', function(notificationEvent) {
    sendLog(notificationEvent);

    messageToClient('history', 'notificationclick event from service worker');

    messageToClient('snackbar', notificationEvent.action);

    notificationEvent.notification.close();
});

self.addEventListener('notificationclose', function(notificationEvent) {
    sendLog(notificationEvent);

    messageToClient('history', 'notificationclose event from service worker');
});

self.addEventListener('message', function(extendableMessageEvent) {
    sendLog(extendableMessageEvent);

    messageToClient('history', 'message event from service worker');

    messageToClient('history', 'command: ' + extendableMessageEvent.data.command);

    messageToClient('history', 'source: ' + extendableMessageEvent.source.id);

    switch(extendableMessageEvent.data.command) {
        case 'reload-cache':
            cacheAddAll().then(function() {
                messageToClient('reload', true);
            });
        break;
        case 'cache-key':
            messageToClient('snackbar', appCacheKey);
        break;

        default:
            messageToClient('history', 'unknown command: ' + extendableMessageEvent.data.command);
    }
});

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function cacheAddAll() {
    caches.delete(appCacheKey);
    return caches.open(appCacheKey).then(function(cache) {
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

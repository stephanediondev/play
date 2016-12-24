//https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker
//https://googlechrome.github.io/samples/service-worker/post-message/service-worker.js

var CACHE_VERSION = 1;
var CURRENT_CACHES = {
    'post-message': 'post-message-cache-v' + CACHE_VERSION
};

self.addEventListener('install', function(InstallEvent) {
    console.log(InstallEvent);

    self.skipWaiting();

    message('install event from service worker');
});

self.addEventListener('fetch', function(FetchEvent) {
    console.log(FetchEvent);

    message('fetch event from service worker');
    message(FetchEvent.request.url);

    FetchEvent.respondWith(
        caches.match(FetchEvent.request)
        .then(function(response) {
            if(response) {
                return response;
            }
            return fetch(FetchEvent.request);
        })
    );

    //https://serviceworke.rs/strategy-cache-update-and-refresh_service-worker_doc.html
    /*FetchEvent.waitUntil(
        return caches.open(CURRENT_CACHES['post-message']).then(function(cache) {
            return fetch(FetchEvent.request).then(function(response) {
                return cache.put(FetchEvent.request, response.clone()).then(function () {
                    return response;
                });
            });
        });
    );*/
});

self.addEventListener('activate', function(ExtendableEvent) {
    console.log(ExtendableEvent);

    message('activate event from service worker');

    var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
        return CURRENT_CACHES[key];
    });

    ExtendableEvent.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
            cacheNames.map(function(cacheName) {
                if(expectedCacheNames.indexOf(cacheName) === -1) {
                    return caches.delete(cacheName);
                }
            })
        );
        }).then(function() {
            return clients.claim();
        }).then(function() {
        })
    );
});

self.addEventListener('sync', function(SyncEvent) {
    console.log(SyncEvent);

    message('sync event from service worker');

    if(SyncEvent.tag === 'test-sync') {
        SyncEvent.waitUntil(
            fetch('manifest.json')
            .then(function (response) {
                return response;
            }).then(function (text) {
                console.log('Request successful', text);
            }).catch(function (error) {
                console.log('Request failed', error);
            })
        );
    }
});

self.addEventListener('periodicsync', function(event) {
    console.log(event);

    message('periodicsync event from service worker');

    if(event.registration.tag == 'get-latest-news') {
        event.waitUntil(
            fetch('manifest.json')
            .then(function (response) {
                return response;
            }).then(function (text) {
                console.log('Request successful', text);
            }).catch(function (error) {
                console.log('Request failed', error);
            })
        );
    } else {
        // unknown sync, may be old, best to unregister
        event.registration.unregister();
    }
});

self.addEventListener('push', function(PushEvent) {
    console.log(PushEvent);

    message('push event from service worker');

    if('waitUntil' in PushEvent) {
        PushEvent.waitUntil(
            notification('push event from service worker', 'body')
        );
    }
});

self.addEventListener('notificationclick', function(NotificationEvent) {
    console.log(NotificationEvent);

    NotificationEvent.notification.close();

    message('notificationclick event from service worker');
    message('action: ' + NotificationEvent.action);
});

self.addEventListener('message', function(ExtendableMessageEvent) {
    console.log(ExtendableMessageEvent);

    var p = caches.open(CURRENT_CACHES['post-message']
    ).then(function(cache) {
        switch(ExtendableMessageEvent.data.command) {
            // This command adds a new request/response pair to the cache.
            case 'add':
                // If event.data.url isn't a valid URL, new Request() will throw a TypeError which will be handled
                // by the outer .catch().
                // Hardcode {mode: 'no-cors} since the default for new Requests constructed from strings is to require
                // CORS, and we don't have any way of knowing whether an arbitrary URL that a user entered supports CORS.
                var request = new Request(ExtendableMessageEvent.data.url, {mode: 'no-cors'});
                return fetch(request).then(function(response) {
                    message('cache.put');
                    message(ExtendableMessageEvent.data.url);
                    return cache.put(ExtendableMessageEvent.data.url, response);
                }).then(function() {
                    ExtendableMessageEvent.ports[0].postMessage({
                        error: null
                    });
                });

            // This command removes a request/response pair from the cache (assuming it exists).
            case 'delete':
                return cache.delete(ExtendableMessageEvent.data.url).then(function(success) {
                    ExtendableMessageEvent.ports[0].postMessage({
                        error: success ? null : 'Item was not found in the cache.'
                    });
                });

            case 'notification':
                notification('message event from service worker', 'body');
            break;

            default:
                // This will be handled by the outer .catch().
                throw Error('Unknown command: ' + ExtendableMessageEvent.data.command);
        }

        message('message event from service worker');
    }).catch(function(error) {
        // If the promise rejects, handle it by returning a standardized error message to the controlled page.
        console.error('Message handling failed:', error);

        ExtendableMessageEvent.ports[0].postMessage({
            error: error.toString()
        });
    });

    if('waitUntil' in ExtendableMessageEvent) {
        ExtendableMessageEvent.waitUntil(p);
    }
});

function notification(title, body) {
    self.registration.showNotification(title, {
        body: body,
        tag: 'serviceworker',
        badge: 'app/icons/icon-32x32.png',
        icon: 'app/icons/icon-192x192.png',
        image: '3680468.jpg',
        actions: [
            { action: 'action1', title: 'action 1', icon: 'app/icons/icon-192x192.png' },
            { action: 'action2', title: 'action 2', icon: 'app/icons/icon-192x192.png' }
        ]
    });
}

function message(content) {
    self.clients.matchAll().then(function(clients) {
        Promise.all(clients.map(function(client) {
            client.postMessage({content: content});
        }));
    });
}

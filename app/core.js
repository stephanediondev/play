if('serviceWorker' in navigator && window.location.protocol == 'https:') {
    var serviceWorkerEnabled = true;

    /*navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
        writeHistory('service worker already registered');

        if('PushManager' in window) { 
            ServiceWorkerRegistration.pushManager.getSubscription().then(function(pushSubscription) {
                console.log(pushSubscription);

                if(pushSubscription) {
                    writeHistory('subscription already done');
                }
            });
        }
    });*/

    navigator.serviceWorker.onmessage = function (ServiceWorkerMessageEvent) {
        console.log(ServiceWorkerMessageEvent);

        writeHistory(ServiceWorkerMessageEvent.data.content);
    };

} else {
    var serviceWorkerEnabled = false;

    if('serviceWorker' in navigator === false) {
        writeHistory('serviceWorker not supported');
    }

    if(window.location.protocol !== 'https:') {
        writeHistory('https only');
    }
}

var applicationServerKey = 'BPjjzF6mMnplDTu3U8XVwkrgxK7cclGZpiqM3iICEhWa8HyaowqKCXeANyND9+ikuXN0+cnjsSrDPkwd6T/w8tA=';

var buttonRegister = document.getElementById('btn_register');
var buttonUnregister = document.getElementById('btn_unregister');

var buttonSubscribe = document.getElementById('btn_subscribe');
var buttonUnsubscribe = document.getElementById('btn_unsubscribe');
var buttonPermissionState = document.getElementById('btn_permission_state');

var buttonUpdate = document.getElementById('btn_update');

var buttonSync = document.getElementById('btn_sync');
var buttonPeriodicSync = document.getElementById('btn_periodic_sync');

var buttonMessageCache = document.getElementById('btn_message_cache');
var buttonMessageNotification = document.getElementById('btn_message_notification');

var buttonChearHistory = document.getElementById('btn_clear_history');

buttonRegister.addEventListener('click', function() {
    register();
});

buttonUnregister.addEventListener('click', function() {
    unregister();
});

buttonSubscribe.addEventListener('click', function() {
    subscribe();
});

buttonUnsubscribe.addEventListener('click', function() {
    unsubscribe();
});

buttonPermissionState.addEventListener('click', function() {
    permissionState();
});

buttonUpdate.addEventListener('click', function() {
    update();
});

buttonSync.addEventListener('click', function() {
    sync_register();
});

buttonPeriodicSync.addEventListener('click', function() {
    periodic_sync_register();
});

buttonMessageCache.addEventListener('click', function() {
    message({command: 'reload-cache'});
});

buttonMessageNotification.addEventListener('click', function() {
    message({command: 'send-notification', content: 'body'});
});

buttonChearHistory.addEventListener('click', function() {
    document.getElementById('history').innerHTML = '';
});

function register() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.register('serviceworker.js').then(function(ServiceWorkerRegistration) {
            console.log(ServiceWorkerRegistration);

            if(ServiceWorkerRegistration.installing) {
                writeHistory('register installing');

            } else if(ServiceWorkerRegistration.waiting) {
                writeHistory('register waiting');

            } else if(ServiceWorkerRegistration.active) {
                writeHistory('register active');
            }
        });
    }
}

function unregister() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.unregister().then(function() {
                writeHistory('unregister done');
            });
        });
    }
}

function subscribe() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                writeHistory('permissionState: ' + permissionState);

                if(permissionState == 'denied') {
                }

                if(permissionState == 'prompt' || permissionState == 'granted') {
                    ServiceWorkerRegistration.pushManager.subscribe({applicationServerKey: urlBase64ToUint8Array(applicationServerKey), userVisibleOnly: true}).then(function(pushSubscription) {
                        console.log(pushSubscription);

                        if(pushSubscription) {
                            var toJSON = pushSubscription.toJSON();

                            writeHistory('endpoint: ' + pushSubscription.endpoint);
                            writeHistory('public_key: ' + toJSON.keys.p256dh);
                            writeHistory('authentication_secret: ' + toJSON.keys.auth);
                        }
                    });
                }
            });
        });
    }
}

function unsubscribe() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.pushManager.getSubscription().then(function(PushSubscription) {
                console.log(PushSubscription);

                if(PushSubscription) {
                    PushSubscription.unsubscribe().then(function() {
                        writeHistory('unsubcribe done');
                    });
                }
            });
        });
    }
}

function permissionState() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                writeHistory('permissionState: ' + permissionState);
            });
        });
    }
}

function message(content) {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function() {
            return new Promise(function(resolve, reject) {
                var messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function(event) {
                if(event.data.error) {
                    reject(event.data.error);
                } else {
                    resolve(event.data);
                }
                };
                navigator.serviceWorker.controller.postMessage(content, [messageChannel.port2]);
            });
        });
    }
}

function update() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.update().then(function() {
                writeHistory('update done');
            });
        });
    }
}

function sync_register() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('sync' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.sync.register('test-sync').then();
            }
        });
    }
}

function periodic_sync_register() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('periodicSync' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.periodicSync.register({
                    tag: 'get-latest-news',         // default: ''
                    minPeriod: 12 * 60 * 60 * 1000, // default: 0
                    powerState: 'avoid-draining',   // default: 'auto'
                    networkState: 'avoid-cellular'  // default: 'online'
                }).then();
            }
        });
    }
}

function writeHistory(message) {
    var history = document.getElementById('history');
    var node = document.createElement('li');
    var textnode = document.createTextNode(message);
    node.appendChild(textnode); 
    history.insertBefore(node, history.firstChild);
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for(let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

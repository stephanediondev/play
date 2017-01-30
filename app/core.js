var snackbarContainer = document.querySelector('.mdl-snackbar');

var TAG = 'playground-pwa';

if('serviceWorker' in navigator && window.location.protocol == 'https:') {
    var serviceWorkerEnabled = true;

    register();

    navigator.serviceWorker.onmessage = function (ServiceWorkerMessageEvent) {
        console.log(ServiceWorkerMessageEvent);

        if(ServiceWorkerMessageEvent.data.type == 'snackbar') {
            setSnackbar(ServiceWorkerMessageEvent.data.content);
        }

        if(ServiceWorkerMessageEvent.data.type == 'history') {
            writeHistory(ServiceWorkerMessageEvent.data.content);
        }
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
var buttonMessageUnknown = document.getElementById('btn_message_unknown');

var buttonNotificationPage = document.getElementById('btn_notification_page');
var buttonNotificationWorker = document.getElementById('btn_notification_worker');

var buttonShare = document.getElementById('btn_share');

var buttonGeolocationGet = document.getElementById('btn_geolocation_get');

var buttonClearHistory = document.getElementById('btn_clear_history');

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

buttonNotificationPage.addEventListener('click', function() {
    showNotificationPage('from page', 'body', TAG);
});

buttonNotificationWorker.addEventListener('click', function() {
    showNotificationWorker();
});

buttonMessageUnknown.addEventListener('click', function() {
    message({});
});

buttonShare.addEventListener('click', function() {
    share();
});

buttonGeolocationGet.addEventListener('click', function() {
    geolocationGet();
});

buttonClearHistory.addEventListener('click', function() {
    document.getElementById('history').innerHTML = '';
});

window.addEventListener('online', updateOnlineStatus);

window.addEventListener('offline', updateOnlineStatus);

document.addEventListener('DOMContentLoaded', function() {
    updateOnlineStatus();
});

function updateOnlineStatus() {
    if(navigator.onLine) {
        writeHistory('online');
    } else {
        writeHistory('offline');
    }
}

function register() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.register('serviceworker.js').then(function(ServiceWorkerRegistration) {
            console.log(ServiceWorkerRegistration);

            setChip('title-serviceworker', 'green');

            ServiceWorkerRegistration.pushManager.getSubscription().then(function(PushSubscription) {
                console.log(PushSubscription);

                if(PushSubscription && typeof PushSubscription === 'object') {
                    setChip('title-pushapi', 'green');
                } else {
                    setChip('title-pushapi', 'red');
                }
            });

            ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                if(permissionState != 'denied') {
                    setChip('title-notificationsapi', 'green');
                } else {
                    setChip('title-notificationsapi', 'red');
                }
            });

            ServiceWorkerRegistration.addEventListener('updatefound', function() {
                writeHistory('updatefound');
                message({command: 'reload-cache'});
            });

            if(ServiceWorkerRegistration.installing) {
                writeHistory('register installing');

            } else if(ServiceWorkerRegistration.waiting) {
                writeHistory('register waiting');

            } else if(ServiceWorkerRegistration.active) {
                writeHistory('register active');
            }

        }).catch(function(TypeError) {
            console.log(TypeError);
        });
    }
}

function unregister() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.unregister().then(function() {
                writeHistory('unregister done');
                setChip('title-serviceworker', 'red');
                setChip('title-pushapi', 'red');
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
                    setSnackbar(permissionState);
                }

                if(permissionState == 'prompt' || permissionState == 'granted') {
                    ServiceWorkerRegistration.pushManager.subscribe({applicationServerKey: urlBase64ToUint8Array(applicationServerKey), userVisibleOnly: true}).then(function(PushSubscription) {
                        console.log(PushSubscription);

                        if(PushSubscription && typeof PushSubscription === 'object') {
                            setChip('title-pushapi', 'green');

                            var toJSON = PushSubscription.toJSON();

                            writeHistory('endpoint: ' + PushSubscription.endpoint);
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

                if(PushSubscription && typeof PushSubscription === 'object') {
                    PushSubscription.unsubscribe().then(function() {
                        writeHistory('unsubcribe done');
                        setChip('title-pushapi', 'red');
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
                setSnackbar(permissionState);
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
                ServiceWorkerRegistration.sync.register('playground-pwa-sync').then();
            } else {
                setSnackbar('sync not supported');
            }
        });
    }
}

function periodic_sync_register() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('periodicSync' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.periodicSync.register({
                    tag: 'playground-pwa-periodicSync', // default: ''
                    minPeriod: 12 * 60 * 60 * 1000, // default: 0
                    powerState: 'avoid-draining', // default: 'auto'
                    networkState: 'avoid-cellular' // default: 'online'
                }).then();
            } else {
                setSnackbar('periodic sync not supported');
            }
        });
    }
}

function share() {
    if('share' in navigator) {
        navigator.share({
            title: document.title,
            text: 'Hello World',
            url: window.location.href
        }).then(function() {
            writeHistory('share');
            setChip('title-webshareapi', 'green');
        });
    } else {
        setChip('title-webshareapi', 'red');
        setSnackbar('share not supported');
    }
}

function geolocationGet() {
    if(navigator.geolocation) {
        setSnackbar('In progress');
        navigator.geolocation.getCurrentPosition(
            function(Geoposition) {
                console.log(Geoposition);
                setChip('title-geolocationapi', 'green');
                writeHistory(Geoposition.coords.latitude + ',' + Geoposition.coords.longitude);
                setSnackbar(Geoposition.coords.latitude + ',' + Geoposition.coords.longitude);
            },
            function(PositionError) {
                console.log(PositionError);
                setChip('title-geolocationapi', 'red');
                writeHistory(PositionError.message);
                setSnackbar(PositionError.message);
            },
            {'enableHighAccuracy': true, 'timeout': 10000}
        );
    } else {
        setSnackbar('geolocation not supported');
    }
}

function showNotificationPage(title, body, tag) {
    if(Notification.permission == 'denied') {
        setSnackbar(Notification.permission);
        setChip('title-notificationsapi', 'red');
    } else {
        setChip('title-notificationsapi', 'green');
    }

    var notification = new Notification(title, {
        body: body,
        tag: tag,
        badge: 'app/icons/icon-32x32.png',
        icon: 'app/icons/icon-192x192.png',
        image: 'app/icons/icon-512x512.png'
    });
    notification.addEventListener('click', function(Event) {
        console.log(Event);

        setSnackbar('close notification from page');

        notification.close();
    });
}

function showNotificationWorker() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                writeHistory('permissionState: ' + permissionState);
                if(permissionState != 'denied') {
                    setChip('title-notificationsapi', 'green');
                    message({command: 'send-notification', content: 'body'});
                } else {
                    setSnackbar(permissionState);
                    setChip('title-notificationsapi', 'red');
                }
            });
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
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for(var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function setSnackbar(message) {
    if(typeof message !== 'undefined') {
        snackbarContainer.MaterialSnackbar.showSnackbar({message: message, timeout: 1000});
    }
}

function setChip(id, color) {
    document.getElementById(id).className = 'mdl-chip mdl-color--' + color;
}

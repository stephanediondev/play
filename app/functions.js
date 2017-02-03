function serviceWorkerRegister() {
    if(serviceWorkerEnabled) {
        setChip('title-serviceworker', 'orange');
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

            ServiceWorkerRegistration.addEventListener('updatefound', function(Event) {
                console.log(Event);
                setSnackbar('update found');
                writeHistory('updatefound event from client');
                messageToServiceWorker({command: 'reload-cache'});
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

function serviceWorkerUnregister() {
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

function pushManagerSubscribe() {
    if(serviceWorkerEnabled) {
        setChip('title-pushapi', 'orange');
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

function pushManagerUnsubscribe() {
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

function pushManagerPermissionState() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                writeHistory('permissionState: ' + permissionState);
                setSnackbar(permissionState);
            });
        });
    }
}

function messageToServiceWorker(content) {
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
                if(navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage(content, [messageChannel.port2]);
                }
            });
        });
    }
}

function serviceWorkerUpdate() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.update().then(function() {
                writeHistory('update done');
            });
        });
    }
}

function serviceWorkerSyncRegister() {
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

function serviceWorkerPeriodSyncRegister() {
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
        setChip('title-webshareapi', 'green');
        navigator.share({
            title: document.title,
            text: 'Hello World',
            url: window.location.href
        }).then(function() {
            writeHistory('share');
        });
    } else {
        setChip('title-webshareapi', 'red');
        setSnackbar('Web Share API not supported');
    }
}

function geolocationGet() {
    if(navigator.geolocation) {
        setChip('title-geolocationapi', 'orange');
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
        setSnackbar('Geolocation API not supported');
    }
}

function geolocationState() {
    if(navigator.permissions) {
        navigator.permissions.query({
            'name': 'geolocation'
        }).then(function(permission) {
            setSnackbar(permission.state);
        });
    } else {
        setSnackbar('Permissions API not supported');
    }
}

function screenOrientation() {
    if('screen' in window && 'orientation' in screen) {
        setChip('title-screenorientationapi', 'green');
        setSnackbar(window.screen.orientation.type);
    } else {
        setChip('title-screenorientationapi', 'red');
        setSnackbar('Screen Orientation API not supported');
    }
}

function fullscreenRequest() {
    var requestFullscreen = false;
    if('requestFullscreen' in document.documentElement) {
        requestFullscreen = 'requestFullscreen';
    } else if('mozRequestFullScreen' in document.documentElement) {
        requestFullscreen = 'mozRequestFullScreen';
    } else if('webkitRequestFullscreen' in document.documentElement) {
        requestFullscreen = 'webkitRequestFullscreen';
    } else if('msRequestFullscreen') {
        requestFullscreen = 'msRequestFullscreen';
    }
    if(requestFullscreen) {
        setChip('title-fullscreen', 'green');
        document.documentElement[requestFullscreen]();
    } else {
        setChip('title-fullscreen', 'red');
    }
}

function fullscreenExit() {
    var exitFullscreen = false;
    if('exitFullscreen' in document) {
        exitFullscreen = 'exitFullscreen';
    } else if('mozCancelFullScreen' in document) {
        exitFullscreen = 'mozCancelFullScreen';
    } else if('webkitExitFullscreen' in document) {
        exitFullscreen = 'webkitExitFullscreen';
    } else if('msExitFullscreen') {
        exitFullscreen = 'msExitFullscreen';
    }
    if(exitFullscreen) {
        setChip('title-fullscreen', 'green');
        document[exitFullscreen]();
    } else {
        setChip('title-fullscreen', 'red');
    }
}

function showNotificationPage() {
    if('Notification' in window) {
        if(Notification.permission == 'denied') {
            setSnackbar(Notification.permission);
            setChip('title-notificationsapi', 'red');
        } else {
            setChip('title-notificationsapi', 'green');
        }

        var notification = new Notification('from page', {
            body: 'body',
            tag: TAG,
            badge: 'app/icons/icon-32x32.png',
            icon: 'app/icons/icon-192x192.png',
            image: 'app/icons/icon-512x512.png'
        });
        notification.addEventListener('click', function(Event) {
            console.log(Event);

            setSnackbar('close notification from page');

            notification.close();
        });
    } else {
        setSnackbar('Notifications API not supported');
    }
}

function showNotificationWorker() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                writeHistory('permissionState: ' + permissionState);
                if(permissionState != 'denied') {
                    setChip('title-notificationsapi', 'green');
                    messageToServiceWorker({command: 'send-notification', content: 'body'});
                } else {
                    setSnackbar(permissionState);
                    setChip('title-notificationsapi', 'red');
                }
            });
        });
    }
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

function updateOnlineStatus() {
    if(navigator.onLine) {
        writeHistory('online');
    } else {
        writeHistory('offline');
    }
}

function writeHistory(message) {
    var history = document.getElementById('history');
    var node = document.createElement('li');
    var textnode = document.createTextNode(message);
    node.appendChild(textnode);
    history.insertBefore(node, history.firstChild);
}

function setSnackbar(message) {
    if(typeof message !== 'undefined') {
        snackbarContainer.MaterialSnackbar.showSnackbar({message: message, timeout: 1000});
    }
}

function setChip(id, color) {
    document.getElementById(id).className = 'mdl-chip mdl-color--' + color;
}

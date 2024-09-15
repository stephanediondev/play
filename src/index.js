const bootstrap = require('bootstrap');

const storedTheme = localStorage.getItem('theme')

const getPreferredTheme = () => {
    if (storedTheme) {
        return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

setTheme(getPreferredTheme())

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (storedTheme !== 'light' || storedTheme !== 'dark') {
        setTheme(getPreferredTheme());
    }
})

function setTheme(theme) {
    if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-bs-theme', 'dark')
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
    }
}

document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        const theme = toggle.getAttribute('data-bs-theme-value');
        localStorage.setItem('theme', theme);
        setTheme(theme);
    });
});

var applicationServerKey = 'BOL1MjOgSneIArw6ZdxxL1UqSdnDnsxGT8WaNqBVgwtSPSHJdlY3tLffFwLzPiuUWr_87KyxLKcUsAImyBKTusU';
var availableItems = new Array();

var listOpenedTab = document.getElementById('listOpenedTab');

writeHistory(Intl.DateTimeFormat().resolvedOptions().timeZone);

detectItems();

function detectItems() {
    if ('storage' in navigator) {
        if ('persist' in navigator.storage) {
            navigator.storage.persist()
            .then(function(persistent) {
                if (persistent) {
                    writeHistory('Storage will not be cleared except by explicit user action');
                } else {
                    writeHistory('Storage may be cleared by the UA under storage pressure');
                }
            });
        }

        if ('estimate' in navigator.storage) {
            navigator.storage.estimate()
            .then(function(estimate) {
                console.log(estimate);

                var percent = (estimate.usage / estimate.quota * 100).toFixed(2);

                writeHistory('Quota: ' + formatBytes(estimate.quota));
                writeHistory('Usage: ' + formatBytes(estimate.usage) + ' (' + percent + '%)');

                document.getElementById('buttonUsage').textContent = formatBytes(estimate.usage);
                show('buttonUsage');

                if (typeof estimate.usageDetails != 'undefined') {
                    for (const property in estimate.usageDetails) {
                        var percent = (estimate.usageDetails[property] / estimate.usage * 100).toFixed(2);
                        writeHistory(property + ': ' + formatBytes(estimate.usageDetails[property]) + ' (' + percent + '%)');
                    }
                }
            });
        }
    }

    if ('localStorage' in window) {
        localStorage.setItem('playground_local_storage', 'localStorage available');
        writeHistory(localStorage.getItem('playground_local_storage'));
    }

    if ('sessionStorage' in window) {
        sessionStorage.setItem('playground_session_storage', 'sessionStorage available');
        writeHistory(sessionStorage.getItem('playground_session_storage'));
    }

    if ('indexedDB' in window) {
        var IDBOpenDBRequest = window.indexedDB.open('playground', 1);
        console.log(IDBOpenDBRequest);

        IDBOpenDBRequest.onupgradeneeded = function(IDBVersionChangeEvent) {
            console.log(IDBVersionChangeEvent);

            var IDBDatabase = IDBVersionChangeEvent.target.result;

            if (!IDBDatabase.objectStoreNames.contains('data')) {
                var IDBObjectStore = IDBDatabase.createObjectStore('data', {keyPath: 'id'});
                console.log(IDBObjectStore);
                IDBObjectStore.createIndex('date_created', 'date_created', { unique: false });
            }
        };

        IDBOpenDBRequest.onerror = function(event) {
            console.log(event);
            writeHistory(event.target.error);
        };

        IDBOpenDBRequest.onsuccess = function(event) {
            console.log(event);

            var IDBDatabase = event.target.result;
            IDBDatabase.transaction('data', 'readwrite').objectStore('data').put({'id': 1, 'label': 'indexedDB available', 'date_created': utcDate()});

            var IDBRequest = IDBDatabase.transaction('data', 'readonly').objectStore('data').get(1);
            console.log(IDBRequest);
            IDBRequest.onsuccess = function(event) {
                console.log(event);
                writeHistory(event.target.result.label);
            };
        };
    }

    if ('deviceMemory' in navigator) {
        writeHistory(navigator.deviceMemory + ' GB device memory');
    }

    if ('getBattery' in navigator) {
        navigator.getBattery()
        .then(function(BatteryManager) {
            console.log(BatteryManager);

            document.getElementById('buttonBattery').textContent = BatteryManager.level * 100 + '%';
            show('buttonBattery');

            BatteryManager.addEventListener('levelchange', function(event) {
                console.log(event);

                document.getElementById('buttonBattery').textContent = BatteryManager.level * 100 + '%';
            });
        });
    }

    var imageCapture = false;

    if ('serviceWorker' in navigator && window.location.protocol == 'https:') {
        availableItems['serviceworker'] = true;

        executeAction('serviceWorkerRegister');

        navigator.serviceWorker.addEventListener('message', function(messageEvent) {
            console.log(messageEvent);

            writeHistory('message event from service worker: ' + messageEvent.data.command);

            if (messageEvent.data.command == 'snackbar') {
                setToast({'title': messageEvent.data.content});
            }

            if (messageEvent.data.command == 'history') {
                writeHistory(messageEvent.data.content);
            }

            if (messageEvent.data.command == 'reload') {
                setToast({'title': 'reload'});
                document.location.reload(messageEvent.data.content);
            }

            if (messageEvent.data.command == 'opened-tabs') {
                //window.name = messageEvent.data.content.id;
                writeHistory('window.name: ' + window.name);
                messageToServiceWorker({'command': 'client-info', 'content': {'window': window.name, 'title': document.title, 'url': messageEvent.data.content.url, 'id': messageEvent.data.content.id}});
            }

            if (messageEvent.data.command == 'show-tab') {
                writeHistory('opened client: ' + messageEvent.data.content.window + ' (' + messageEvent.data.content.url + ')');

                var node = document.createElement('a');
                var textnode = document.createTextNode(messageEvent.data.content.url);
                node.setAttribute('href', messageEvent.data.content.url);
                node.setAttribute('target', messageEvent.data.content.window);
                node.appendChild(textnode);
                listOpenedTab.insertBefore(node, listOpenedTab.firstChild);

                var br = document.createElement('br');
                listOpenedTab.insertBefore(br, listOpenedTab.firstChild);

                node.addEventListener('click', (event) => {
                    event.preventDefault();

                    const myWindow = window.open(messageEvent.data.content.url, messageEvent.data.content.window);
                    if (myWindow) {
                        console.log(myWindow);
                        listOpenedTab.innerHTML = '';
                        myWindow.focus();
                    } else {
                        console.log('Window is not open.');
                    }
                });
            }
        });

        navigator.serviceWorker.addEventListener('controllerchange', function(Event) {
            console.log(Event);

            writeHistory('controllerchange event from client');
        });
    }

    if ('share' in navigator) {
        show('detect-webshareapi');
    }

    if ('geolocation' in navigator) {
        show('detect-geolocationapi');
    }

    if (navigator.setAppBadge || navigator.setExperimentalAppBadge) {
        show('detect-badgingapi');
    }

    if ('screen' in window && 'orientation' in screen) {
        console.log(window.screen.orientation);

        executeAction('screenOrientation');

        window.screen.orientation.addEventListener('change', function(e) {
            console.log(e);
            executeAction('screenOrientation');
        });
    }

    if ('connection' in navigator) {
        console.log(navigator.connection);

        executeAction('networkInformation');

        navigator.connection.addEventListener('change', function(e) {
            console.log(e);
            executeAction('networkInformation');
        });
    }

    if ('bluetooth' in navigator) {
        show('detect-bluetooth');
    }

    var standalone = window.matchMedia('(display-mode: standalone)');
    if (standalone.matches) {
        show('buttonStandalone');
    } else {
        hide('buttonStandalone');
    }
}

function isAvailable(item) {
    if ('undefined' !== availableItems[item] && true === availableItems[item]) {
        return true;
    }

    return false;
}

function generateUniqueID(prefix) {
    function chr4() {
    return Math.random().toString(16).slice(-4);
    }

    return prefix + chr4() + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() + chr4() + chr4();
}

function reload() {
    document.location.reload();
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function executeAction(action) {
    console.log(action);

    switch(action) {
        case 'openedClients':
            messageToServiceWorker({'command': 'opened-tabs'});
            listOpenedTab.innerHTML = '';
            break;

        case 'setBadge':
            if ('setAppBadge' in navigator) {
                navigator.setAppBadge(randomIntFromInterval(1, 99))
                .catch(function(error) {
                    writeHistory(error);
                    console.log(error);
                });
            } else if ('setExperimentalAppBadge' in navigator) {
                navigator.setExperimentalAppBadge(randomIntFromInterval(1, 99)).catch(function(error) {
                    writeHistory(error);
                    console.log(error);
                });
            }
            break;

        case 'clearBadge':
            if (navigator.clearAppBadge) {
                navigator.clearAppBadge().catch(function(error) {
                    writeHistory(error);
                    console.log(error);
                });
            }
            break;

        case 'bluetooth':
            navigator.bluetooth.requestDevice({
                acceptAllDevices: true
            })
            .then(function(BluetoothDevice) {
                console.log(BluetoothDevice);
            })
            .catch(function(error) {
                console.log(error);
            });
            break;

        case 'getCameras':
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                var constraints = {'video': {'facingMode': 'environment'}};
                navigator.mediaDevices.getUserMedia(constraints)
                .then(function(MediaStream) {
                    navigator.mediaDevices.enumerateDevices()
                    .then(function(gotDevices) {
                        console.log(gotDevices);

                        var selectCamera = document.getElementById('selectCamera');
                        selectCamera.parentNode.classList.remove('d-none');
                        selectCamera.innerHTML = '';

                        for(var i = 0; i !== gotDevices.length; ++i) {
                            var deviceInfo = gotDevices[i];
                            if (deviceInfo.kind === 'videoinput') {
                                //console.log(deviceInfo.getCapabilities());
                                if (deviceInfo.label) {
                                    writeHistory(deviceInfo.label);
                                    selectCamera.innerHTML += '<option value="' + deviceInfo.deviceId + '">'+ deviceInfo.label + '</option>';
                                }
                            }
                        }

                        show('detect-mediastreamapi');

                        if ('ImageCapture' in window) {
                            show('detect-imagecaptureapi');
                        }
                    })
                    .catch(function(handleError) {
                        console.log(handleError);
                    });
                });
            }
            break;

        case 'getStream':
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                setToast({'title': 'in progress'});
                var camera = document.getElementById('selectCamera').value;

                if ('' !== camera) {
                    var constraints = {'video': {'facingMode': 'environment', 'deviceId': { 'exact': document.getElementById('selectCamera').value}}};
                } else {
                    var constraints = {'video': {'facingMode': 'environment'}};
                }
                navigator.mediaDevices.getUserMedia(constraints)
                .then(function(MediaStream) {
                    console.log(MediaStream);

                    var video = document.getElementById('video');
                    video.parentNode.classList.remove('d-none');
                    video.srcObject = MediaStream;

                    if ('ImageCapture' in window) {
                        console.log(MediaStream.getVideoTracks());
                        console.log(MediaStream.getVideoTracks()[0].getSettings());
                        var track = MediaStream.getVideoTracks()[0];
                        imageCapture = new ImageCapture(track);
                    }
                })
                .catch(function(NavigatorUserMediaError) {
                    console.log(NavigatorUserMediaError);

                    if ('NotFoundError' == NavigatorUserMediaError.name) {
                        setToast({'title': 'Not found'});
                    }

                    if ('DevicesNotFoundError' == NavigatorUserMediaError.name) {
                        setToast({'title': 'Device not found'});
                    }

                    if ('PermissionDeniedError' == NavigatorUserMediaError.name) {
                        setToast({'title': 'Permission denied'});
                    }
                });
            }
            break;

        case 'takePhoto':
            if (imageCapture) {
                imageCapture.getPhotoCapabilities()
                .then(function(photoCapabilities) {
                    console.log(photoCapabilities);
                    return imageCapture.getPhotoSettings();
                })
                .then(function(photoSettings) {
                    console.log(photoSettings);
                })
                .catch(function(error) {
                    console.log(error);
                });

                imageCapture.takePhoto()
                .then(function(blob) {
                    console.log(blob);

                    var image = document.getElementById('image');
                    image.parentNode.classList.remove('d-none');
                    image.src = URL.createObjectURL(blob);
                })
                .catch(function(err) {
                    console.log(err);
                });
            }
            break;

        case 'serviceWorkerRegister':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.register('serviceworker.js')
                .then(function(ServiceWorkerRegistration) {
                    console.log(ServiceWorkerRegistration);

                    setToast({'title': 'Service Worker', 'body': 'register'});

                    messageToServiceWorker({command: 'cache-key'});

                    show('detect-serviceworker');

                    if ('pushManager' in ServiceWorkerRegistration) {
                        show('detect-pushapi');
                        ServiceWorkerRegistration.pushManager.getSubscription()
                        .then(function(PushSubscription) {
                            if (PushSubscription && 'object' === typeof PushSubscription) {
                                console.log(PushSubscription);
                            }
                            console.log(PushManager.supportedContentEncodings);
                        })
                        .catch(function(error) {
                            console.log(error);
                        });
                    }

                    ServiceWorkerRegistration.addEventListener('updatefound', function(Event) {
                        console.log(Event);
                        messageToServiceWorker({command: 'reload-cache'});
                    });

                    if (ServiceWorkerRegistration.installing) {
                        writeHistory('register installing');

                    } else if (ServiceWorkerRegistration.waiting) {
                        writeHistory('register waiting');

                    } else if (ServiceWorkerRegistration.active) {
                        writeHistory('register active');
                    }

                })
                .catch(function(TypeError) {
                    console.log(TypeError);
                });
            }
            break;

        case 'serviceWorkerUnregister':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.ready
                .then(function(ServiceWorkerRegistration) {
                    ServiceWorkerRegistration.unregister()
                    .then(function() {
                        setToast({'title': 'Service Worker', 'body': 'unregister'});
                    });
                });
            }
            break;

        case 'pushManagerSubscribe':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.ready
                .then(function(ServiceWorkerRegistration) {
                    if ('pushManager' in ServiceWorkerRegistration) {
                        ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                            writeHistory('permissionState: ' + permissionState);

                            setToast({'title': 'Push API', 'body': permissionState});

                            if (permissionState == 'prompt' || permissionState == 'granted') {
                                ServiceWorkerRegistration.pushManager.subscribe({'applicationServerKey': urlBase64ToUint8Array(applicationServerKey), 'userVisibleOnly': true})
                                .then(function(PushSubscription) {
                                    console.log(PushSubscription);

                                    if (PushSubscription && 'object' === typeof PushSubscription) {
                                        setToast({'title': 'Push API', 'body': 'done'});

                                        var toJSON = PushSubscription.toJSON();

                                        writeHistory('endpoint: ' + PushSubscription.endpoint);
                                        writeHistory('public_key: ' + toJSON.keys.p256dh);
                                        writeHistory('authentication_secret: ' + toJSON.keys.auth);
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                });
                            }
                        });
                    }
                });
            }
            break;

        case 'pushManagerUnsubscribe':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.ready
                .then(function(ServiceWorkerRegistration) {
                    if ('pushManager' in ServiceWorkerRegistration) {
                        ServiceWorkerRegistration.pushManager.getSubscription()
                        .then(function(PushSubscription) {
                            console.log(PushSubscription);

                            if (PushSubscription && 'object' === typeof PushSubscription) {
                                PushSubscription.unsubscribe()
                                .then(function() {
                                    setToast({'title': 'Push API', 'body': 'done'});
                                });
                            }
                        });
                    }
                });
            }
            break;

        case 'pushManagerPermissionState':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.ready
                .then(function(ServiceWorkerRegistration) {
                    if ('pushManager' in ServiceWorkerRegistration) {
                        ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true})
                        .then(function(permissionState) {
                            writeHistory('permissionState: ' + permissionState);
                            setToast({'title': 'Push API', 'body': permissionState});
                        });
                    }
                });
            }
            break;

        case 'serviceWorkerUpdate':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.ready
                .then(function(ServiceWorkerRegistration) {
                    ServiceWorkerRegistration.update()
                    .then(function() {
                        writeHistory('update done');
                    });
                });
            }
            break;

        case 'serviceWorkerSyncRegister':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.ready
                .then(function(ServiceWorkerRegistration) {
                    if ('sync' in ServiceWorkerRegistration) {
                        ServiceWorkerRegistration.sync.register('playground-pwa-sync')
                        .then();
                    } else {
                        setToast({'title': 'Service Worker', 'body': 'sync not supported'});
                    }
                });
            }
            break;

        case 'serviceWorkerPeriodSyncRegister':
            if (isAvailable('serviceworker')) {
                navigator.serviceWorker.ready
                .then(function(ServiceWorkerRegistration) {
                    if ('periodicSync' in ServiceWorkerRegistration) {
                        ServiceWorkerRegistration.periodicSync.register({
                            tag: 'playground-pwa-periodicSync', // default: ''
                            minPeriod: 12 * 60 * 60 * 1000, // default: 0
                            powerState: 'avoid-draining', // default: 'auto'
                            networkState: 'avoid-cellular' // default: 'online'
                        })
                        .then();
                    } else {
                        setToast({'title': 'Service Worker', 'body': 'periodic sync not supported'});
                    }
                });
            }
            break;

        case 'share':
            if ('share' in navigator) {
                navigator.share({
                    title: document.title,
                    text: 'Hello World',
                    url: window.location.href
                })
                .then(function() {
                    writeHistory('share');
                });
            }
            break;

        case 'geolocationGet':
            if ('geolocation' in navigator) {
                setToast({'title': 'Geolocation API', 'body': 'in progress'});
                navigator.geolocation.getCurrentPosition(
                    function(Geoposition) {
                        console.log(Geoposition);
                        writeHistory(Geoposition.coords.latitude + ',' + Geoposition.coords.longitude);
                        setToast({'title': 'Geolocation API', 'body': Geoposition.coords.latitude + ',' + Geoposition.coords.longitude});
                    },
                    function(PositionError) {
                        console.log(PositionError);
                        writeHistory(PositionError.message);
                        setToast({'title': 'Geolocation API', 'body': PositionError.message});
                    },
                    {'enableHighAccuracy': true, 'timeout': 10000}
                );
            }
            break;

        case 'geolocationState':
            if ('permissions' in navigator) {
                navigator.permissions.query({
                    'name': 'geolocation'
                })
                .then(function(permission) {
                    setToast({'title': 'Geolocation API', 'body': permission.state});
                });
            } else {
                setToast({'title': 'Permissions API not supported'});
            }
            break;

        case 'cameraState':
            if ('permissions' in navigator) {
                navigator.permissions.query({
                    'name': 'camera'
                })
                .then(function(permission) {
                    setToast({'title': permission.state});
                });
            } else {
                setToast({'title': 'Permissions API not supported'});
            }
            break;

        case 'screenOrientation':
            hide('buttonOrientation');
            if ('screen' in window && 'orientation' in screen) {
                document.getElementById('buttonOrientation').textContent = window.screen.orientation.type;
                show('buttonOrientation');
            }
            break;

        case 'updateOnlineStatus':
            if (navigator.onLine) {
                hide('buttonOffline');
                show('buttonOnline');
            } else {
                hide('buttonOnline');
                show('buttonOffline');
            }
            break;

        case 'networkInformation':
            hide('buttonNetwork');
            if ('connection' in navigator) {
                if ('undefined' !== typeof navigator.connection.type) {
                    document.getElementById('buttonNetwork').textContent = navigator.connection.type;
                    show('buttonNetwork');
                } else if ('undefined' !== typeof navigator.connection.effectiveType) {
                    document.getElementById('buttonNetwork').textContent = navigator.connection.effectiveType;
                    show('buttonNetwork');
                }
            }
            break;

        case 'pushEvent':
            if ('Notification' in window) {
                if (isAvailable('serviceworker')) {
                    navigator.serviceWorker.ready
                    .then(function(ServiceWorkerRegistration) {
                        ServiceWorkerRegistration.pushManager.getSubscription()
                        .then(function(PushSubscription) {
                            if (PushSubscription && 'object' === typeof PushSubscription) {
                                var toJSON = PushSubscription.toJSON();
                                var url = 'notification.php';
                                var data = {
                                    endpoint: PushSubscription.endpoint,
                                    public_key: toJSON.keys.p256dh,
                                    authentication_secret: toJSON.keys.auth,
                                    content_encoding: (PushManager.supportedContentEncodings || ['aesgcm'])[0]
                                };

                                fetch(url, {
                                    method: 'POST',
                                    body: JSON.stringify(data),
                                    headers: new Headers({
                                        'Content-Type': 'application/json'
                                    })
                                })
                                .then(function(Response) {
                                    console.log(Response);
                                })
                                .catch(function(error) {
                                    console.log(error);
                                });
                            }
                        })
                        .catch(function(err) {
                            console.log(err);
                        });
                    });
                }
            }
            break;
    }
}

function utcDate() {
    var d = new Date();
    var utc = d.getUTCFullYear() + '-' + addZero(d.getUTCMonth() + 1) + '-' + addZero(d.getUTCDate()) + ' ' + addZero(d.getUTCHours()) + ':' + addZero(d.getUTCMinutes()) + ':' + addZero(d.getUTCSeconds());
    return utc;

    function addZero(i) {
        if (i < 10) {
            i = '0' + i;
        }
        return i;
    }
}

function formatBytes(bytes, decimals) {
    if(bytes == 0) return '0 B';
    var k = 1024,
        dm = decimals || 2,
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];

}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function show(id) {
    console.log('show: ' + id);
    document.getElementById(id).classList.remove('d-none');
}

function hide(id) {
    document.getElementById(id).classList.add('d-none');
}

function writeHistory(message) {
    var history = document.getElementById('history');
    var node = document.createElement('li');
    var textnode = document.createTextNode(message);
    node.appendChild(textnode);
    history.insertBefore(node, history.firstChild);
}

function setToast(content) {
    if ('undefined' !== typeof content.body) {
        document.querySelector('.navbar-brand').innerText = content.title + ': ' + content.body;
    } else {
        document.querySelector('.navbar-brand').innerText = content.title;
    }
}

function messageToServiceWorker(content) {
    if (isAvailable('serviceworker')) {
        navigator.serviceWorker.ready
        .then(function() {
            return new Promise(function(resolve, reject) {
                var messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function(event) {
                    if (event.data.error) {
                        reject(event.data.error);
                    } else {
                        resolve(event.data);
                    }
                };
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage(content, [messageChannel.port2]);
                }
            });
        });
    }
}

document.querySelectorAll('.is-action').forEach(toggle => {
    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        executeAction(toggle.getAttribute('id'));
    });
});

window.addEventListener('beforeinstallprompt', function(BeforeInstallPromptEvent) {
    console.log(BeforeInstallPromptEvent);

    BeforeInstallPromptEvent.preventDefault();

    document.getElementById('install').addEventListener('click', function(event) {
        BeforeInstallPromptEvent.userChoice
        .then(function(AppBannerPromptResult) {
            console.log(AppBannerPromptResult);

            setToast({'title': AppBannerPromptResult.outcome});
        })
        .catch(function(error) {
            console.log(error);
        });

        BeforeInstallPromptEvent.prompt();
    });

    show('detect-promptinstall');
});

window.addEventListener('appinstalled', function(appinstalled) {
    console.log(appinstalled);
});

window.addEventListener('online', function() {
    executeAction('updateOnlineStatus');
});

window.addEventListener('offline', function() {
    executeAction('updateOnlineStatus');
});

document.addEventListener('DOMContentLoaded', function() {
    executeAction('updateOnlineStatus');
});

document.getElementById('clearHistory').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('history').innerHTML = '';
});

document.getElementById('reload').addEventListener('click', function(event) {
    event.preventDefault();
    reload();
});

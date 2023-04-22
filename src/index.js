var bootstrap = require('bootstrap');

import Handlebars from 'handlebars/dist/cjs/handlebars'

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

function getTemplate(key) {
    return Handlebars.compile( document.getElementById(key).innerText );
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function setBadge() {
    if (navigator.setAppBadge) {
        navigator.setAppBadge(randomIntFromInterval(1, 99))
        .catch(function(error) {
            writeHistory(error);
            console.log(error);
        });
    } else if (navigator.setExperimentalAppBadge) {
        navigator.setExperimentalAppBadge(randomIntFromInterval(1, 99)).catch(function(error) {
            writeHistory(error);
            console.log(error);
        });
    }
}

function clearBadge() {
    if (navigator.clearAppBadge) {
        navigator.clearAppBadge().catch(function(error) {
            writeHistory(error);
            console.log(error);
        });
    }
}

function bluetooth() {
    navigator.bluetooth.requestDevice({
        acceptAllDevices: true
    })
    .then(function(BluetoothDevice) {
        console.log(BluetoothDevice);
    })
    .catch(function(error) {
        console.log(error);
    });
}

function getCameras() {
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
}

function getStream() {
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
}

function takePhoto() {
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
}

function serviceWorkerRegister() {
    if (serviceWorkerEnabled) {
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
}

function serviceWorkerUnregister() {
    if (serviceWorkerEnabled) {
        navigator.serviceWorker.ready
        .then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.unregister()
            .then(function() {
                setToast({'title': 'Service Worker', 'body': 'unregister'});
            });
        });
    }
}

function pushManagerSubscribe() {
    if (serviceWorkerEnabled) {
        navigator.serviceWorker.ready
        .then(function(ServiceWorkerRegistration) {
            if ('pushManager' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                    writeHistory('permissionState: ' + permissionState);

                    setToast({'title': 'Push API', 'body': permissionState});

                    if (permissionState == 'prompt' || permissionState == 'granted') {
                        ServiceWorkerRegistration.pushManager.subscribe({applicationServerKey: urlBase64ToUint8Array(applicationServerKey), userVisibleOnly: true})
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
}

function pushManagerUnsubscribe() {
    if (serviceWorkerEnabled) {
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
}

function pushManagerPermissionState() {
    if (serviceWorkerEnabled) {
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
}

function messageToServiceWorker(content) {
    if (serviceWorkerEnabled) {
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

function serviceWorkerUpdate() {
    if (serviceWorkerEnabled) {
        navigator.serviceWorker.ready
        .then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.update()
            .then(function() {
                writeHistory('update done');
            });
        });
    }
}

function serviceWorkerSyncRegister() {
    if (serviceWorkerEnabled) {
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
}

function serviceWorkerPeriodSyncRegister() {
    if (serviceWorkerEnabled) {
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
}

function share() {
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
}

function geolocationGet() {
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
}

function geolocationState() {
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
}

function cameraState() {
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
}

function screenOrientation() {
    hide('buttonOrientation');
    if ('screen' in window && 'orientation' in screen) {
        document.getElementById('buttonOrientation').textContent = window.screen.orientation.type;
        show('buttonOrientation');
    }
}

function networkInformation() {
    hide('buttonNetwork');
    if ('connection' in navigator) {
        if (typeof navigator.connection.type !== 'undefined') {
            document.getElementById('buttonNetwork').textContent = navigator.connection.type;
            show('buttonNetwork');
        } else if (typeof navigator.connection.effectiveType !== 'undefined') {
            document.getElementById('buttonNetwork').textContent = navigator.connection.effectiveType;
            show('buttonNetwork');
        }
    }
}

function pushEvent() {
    if ('Notification' in window) {
        if (serviceWorkerEnabled) {
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

function updateOnlineStatus() {
    if (navigator.onLine) {
        hide('buttonOffline');
        show('buttonOnline');
    } else {
        hide('buttonOnline');
        show('buttonOffline');
    }
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
    if (typeof content.body !== 'undefined') {
        document.querySelector('.navbar-brand').innerText = content.title + ': ' + content.body;
    } else {
        document.querySelector('.navbar-brand').innerText = content.title;
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

var applicationServerKey = 'BOL1MjOgSneIArw6ZdxxL1UqSdnDnsxGT8WaNqBVgwtSPSHJdlY3tLffFwLzPiuUWr_87KyxLKcUsAImyBKTusU';

writeHistory(Intl.DateTimeFormat().resolvedOptions().timeZone);

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

var serviceWorkerEnabled = false;
var imageCapture = false;

if ('serviceWorker' in navigator && window.location.protocol == 'https:') {
    serviceWorkerEnabled = true;

    serviceWorkerRegister();

    navigator.serviceWorker.addEventListener('message', function(MessageEvent) {
        console.log(MessageEvent);

        writeHistory('message event from client');

        if (MessageEvent.data.type == 'snackbar') {
            setToast({'title': MessageEvent.data.content});
        }

        if (MessageEvent.data.type == 'history') {
            writeHistory(MessageEvent.data.content);
        }

        if (MessageEvent.data.type == 'reload') {
            setToast({'title': 'reload'});
            document.location.reload(MessageEvent.data.content);
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

    screenOrientation();

    window.screen.orientation.addEventListener('change', function(e) {
        console.log(e);
        screenOrientation();
    });
}

if ('connection' in navigator) {
    console.log(navigator.connection);

    networkInformation();

    navigator.connection.addEventListener('change', function(e) {
        console.log(e);
        networkInformation();
    });
}

if ('bluetooth' in navigator) {
    show('detect-bluetooth');
}

if ('https:' === window.location.protocol) {
    show('buttonHttps');
} else {
    show('buttonHttp');
}

var standalone = window.matchMedia('(display-mode: standalone)');
if (standalone.matches) {
    show('buttonStandalone');
} else {
    hide('buttonStandalone');
}

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
    updateOnlineStatus();
});

window.addEventListener('offline', function() {
    updateOnlineStatus();
});

document.addEventListener('DOMContentLoaded', function() {
    updateOnlineStatus();
});

document.getElementById('clearHistory').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('history').innerHTML = '';
});

document.getElementById('getCameras').addEventListener('click', function(event) {
    event.preventDefault();
    getCameras();
});

document.getElementById('getStream').addEventListener('click', function(event) {
    event.preventDefault();
    getStream();
});

document.getElementById('cameraState').addEventListener('click', function(event) {
    event.preventDefault();
    cameraState();
});

document.getElementById('takePhoto').addEventListener('click', function(event) {
    event.preventDefault();
    takePhoto();
});

document.getElementById('serviceWorkerRegister').addEventListener('click', function(event) {
    event.preventDefault();
    serviceWorkerRegister();
});

document.getElementById('serviceWorkerUnregister').addEventListener('click', function(event) {
    event.preventDefault();
    serviceWorkerUnregister();
});

document.getElementById('pushManagerSubscribe').addEventListener('click', function(event) {
    event.preventDefault();
    pushManagerSubscribe();
});

document.getElementById('pushManagerUnsubscribe').addEventListener('click', function(event) {
    event.preventDefault();
    pushManagerUnsubscribe();
});

document.getElementById('pushManagerPermissionState').addEventListener('click', function(event) {
    event.preventDefault();
    pushManagerPermissionState();
});

document.getElementById('serviceWorkerUpdate').addEventListener('click', function(event) {
    event.preventDefault();
    serviceWorkerUpdate();
});

document.getElementById('serviceWorkerSyncRegister').addEventListener('click', function(event) {
    event.preventDefault();
    serviceWorkerSyncRegister();
});

document.getElementById('serviceWorkerPeriodSyncRegister').addEventListener('click', function(event) {
    event.preventDefault();
    serviceWorkerPeriodSyncRegister();
});

document.getElementById('serviceWorkerReloadCache').addEventListener('click', function(event) {
    event.preventDefault();
    messageToServiceWorker({command: 'reload-cache'});
});

document.getElementById('pushEvent').addEventListener('click', function(event) {
    event.preventDefault();
    pushEvent();
});

document.getElementById('share').addEventListener('click', function(event) {
    event.preventDefault();
    share();
});

document.getElementById('bluetooth').addEventListener('click', function(event) {
    event.preventDefault();
    bluetooth();
});

document.getElementById('geolocationGet').addEventListener('click', function(event) {
    event.preventDefault();
    geolocationGet();
});

document.getElementById('geolocationState').addEventListener('click', function(event) {
    event.preventDefault();
    geolocationState();
});

document.getElementById('setBadge').addEventListener('click', function(event) {
    event.preventDefault();
    setBadge();
});

document.getElementById('clearBadge').addEventListener('click', function(event) {
    event.preventDefault();
    clearBadge();
});

document.getElementById('reload').addEventListener('click', function(event) {
    event.preventDefault();
    reload();
});

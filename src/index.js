import MaterialSnackbar from 'material-design-lite';

function setBadge(value) {
    if (navigator.setExperimentalAppBadge) {
        navigator.setExperimentalAppBadge(value).catch(function(error) {
            console.log(error);
        });
    } else if (navigator.setAppBadge) {
        navigator.setAppBadge(value).catch(function(error) {
            console.log(error);
        });
    } else {
        setSnackbar('badge api not supported');
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

function getStream() {
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setSnackbar('in progress');
        var constraints = {video: {'facingMode': 'environment'}};
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function(MediaStream) {
            console.log(MediaStream);

            var video = document.getElementById('video');
            video.srcObject = MediaStream;

            if('ImageCapture' in window) {
                console.log(MediaStream.getVideoTracks());
                var track = MediaStream.getVideoTracks()[0];
                imageCapture = new ImageCapture(track);
            }
        })
        .catch(function(NavigatorUserMediaError) {
            console.log(NavigatorUserMediaError);

            if('NotFoundError' == NavigatorUserMediaError.name) {
                setSnackbar('Not found');
            }

            if('DevicesNotFoundError' == NavigatorUserMediaError.name) {
                setSnackbar('Device not found');
            }

            if('PermissionDeniedError' == NavigatorUserMediaError.name) {
                setSnackbar('Permission denied');
            }
        });
    }
}

function takePhoto() {
    if(imageCapture) {
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
            image.src = URL.createObjectURL(blob);
        })
        .catch(function(err) {
            console.log(err);
        });
    }
}

function serviceWorkerRegister() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.register('serviceworker.js')
        .then(function(ServiceWorkerRegistration) {
            console.log(ServiceWorkerRegistration);

            messageToServiceWorker({command: 'cache-key'});

            document.getElementById('detect-serviceworker').classList.remove('hidden');

            if('pushManager' in ServiceWorkerRegistration) {
                document.getElementById('detect-pushapi').classList.remove('hidden');
                ServiceWorkerRegistration.pushManager.getSubscription().then(function(PushSubscription) {
                    if(PushSubscription && 'object' === typeof PushSubscription) {
                        console.log(PushSubscription);
                    }
                    console.log(PushManager.supportedContentEncodings);
                });
            }

            ServiceWorkerRegistration.addEventListener('updatefound', function(Event) {
                console.log(Event);
                messageToServiceWorker({command: 'reload-cache'});
            });

            if(ServiceWorkerRegistration.installing) {
                writeHistory('register installing');

            } else if(ServiceWorkerRegistration.waiting) {
                writeHistory('register waiting');

            } else if(ServiceWorkerRegistration.active) {
                writeHistory('register active');
            }

        })
        .catch(function(TypeError) {
            console.log(TypeError);
        });
    }
}

function serviceWorkerUnregister() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            ServiceWorkerRegistration.unregister().then(function() {
                setSnackbar('done');
            });
        });
    }
}

function pushManagerSubscribe() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('pushManager' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                    writeHistory('permissionState: ' + permissionState);

                    setSnackbar(permissionState);

                    if(permissionState == 'prompt' || permissionState == 'granted') {
                        ServiceWorkerRegistration.pushManager.subscribe(
                            {applicationServerKey: urlBase64ToUint8Array(applicationServerKey), userVisibleOnly: true}
                        ).then(function(PushSubscription) {
                            console.log(PushSubscription);

                            if(PushSubscription && 'object' === typeof PushSubscription) {
                                setSnackbar('done');

                                var toJSON = PushSubscription.toJSON();

                                writeHistory('endpoint: ' + PushSubscription.endpoint);
                                writeHistory('public_key: ' + toJSON.keys.p256dh);
                                writeHistory('authentication_secret: ' + toJSON.keys.auth);
                            }
                        });
                    }
                });
            }
        });
    }
}

function pushManagerUnsubscribe() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('pushManager' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.pushManager.getSubscription().then(function(PushSubscription) {
                    console.log(PushSubscription);

                    if(PushSubscription && 'object' === typeof PushSubscription) {
                        PushSubscription.unsubscribe().then(function() {
                            setSnackbar('done');
                        });
                    }
                });
            }
        });
    }
}

function pushManagerPermissionState() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('pushManager' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                    writeHistory('permissionState: ' + permissionState);
                    setSnackbar(permissionState);
                });
            }
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
        navigator.share({
            title: document.title,
            text: 'Hello World',
            url: window.location.href
        }).then(function() {
            writeHistory('share');
        });
    }
}

function geolocationGet() {
    if('geolocation' in navigator) {
        setSnackbar('in progress');
        navigator.geolocation.getCurrentPosition(
            function(Geoposition) {
                console.log(Geoposition);
                writeHistory(Geoposition.coords.latitude + ',' + Geoposition.coords.longitude);
                setSnackbar(Geoposition.coords.latitude + ',' + Geoposition.coords.longitude);
            },
            function(PositionError) {
                console.log(PositionError);
                writeHistory(PositionError.message);
                setSnackbar(PositionError.message);
            },
            {'enableHighAccuracy': true, 'timeout': 10000}
        );
    }
}

function geolocationState() {
    if('permissions' in navigator) {
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
    hide('buttonOrientation');
    if('screen' in window && 'orientation' in screen) {
        document.getElementById('buttonOrientationResult').textContent = window.screen.orientation.type;
        show('buttonOrientation');
    }
}

function networkInformation() {
    hide('buttonNetwork');
    if('connection' in navigator) {
        if(typeof navigator.connection.type !== 'undefined') {
            document.getElementById('buttonNetworkResult').textContent = navigator.connection.type;
            show('buttonNetwork');
        } else if(typeof navigator.connection.effectiveType !== 'undefined') {
            document.getElementById('buttonNetworkResult').textContent = navigator.connection.effectiveType;
            show('buttonNetwork');
        }
    }
}

function paymentRequest() {
    if('PaymentRequest' in window) {
        var methodData = [
            {
                supportedMethods: ['basic-card'],
                data: {
                    supportedNetworks: ['visa', 'mastercard', 'amex'],
                    supportedTypes: ['credit']
                }
            }
        ];

        var details =  {
            displayItems: [
                {
                    label: "Sub-total",
                    amount: { currency: "USD", value : 90 }, // US$100.00
                },
                {
                    label: "Sales Tax",
                    amount: { currency: "USD", value : 10 }, // US$9.00
                },
                {
                    label: "Shipping",
                    amount: { currency: "USD", value : 10 }, // US$9.00
                }
            ],
            total:  {
                label: "Total due",
                amount: { currency: "USD", value : 110 }, // US$109.00
            },
            shippingOptions: [
              {
                id: 'economy',
                selected: true,
                label: 'Economy Shipping (5-7 Days)',
                amount: {
                  currency: 'USD',
                  value: 10,
                },
              }
            ]
        };

        var options = {
            requestShipping: true,
            shippingType: "shipping"
        };

        var paymentRequest = new PaymentRequest(methodData, details, options);

        paymentRequest.addEventListener('shippingaddresschange', function(PaymentRequestUpdateEvent) {
            console.log(PaymentRequestUpdateEvent);

            event.updateWith({
                displayItems: [
                    {
                        label: "Sub-total",
                        amount: { currency: "USD", value : 90 }, // US$100.00
                    },
                    {
                        label: "Sales Tax",
                        amount: { currency: "USD", value : 10 }, // US$9.00
                    },
                    {
                        label: "Shipping",
                        amount: { currency: "USD", value : 10 }, // US$9.00
                    }
                ],
              total: {
                label: 'Total',
                amount: {
                  currency: 'USD',
                  value: 110,
                },
              },
              shippingOptions: [
                {
                  id: 'economy',
                  label: 'Economy Shipping (5-7 Days)',
                  amount: {
                    currency: 'USD',
                    value: 10,
                  },
                }
              ]
          });
        });

        paymentRequest.addEventListener('shippingoptionchange', function(event) {
            console.log(event);

            event.updateWith({
              total: {
                label: 'Total',
                amount: {
                  currency: 'USD',
                  value: 110,
                },
              },
              shippingOptions: [
                {
                  id: 'economy',
                  label: 'Economy Shipping (5-7 Days)',
                  amount: {
                    currency: 'USD',
                    value: 10,
                  },
                }
              ]
            });
        });

        paymentRequest.show()
        .then(function(paymentResponse) {
            console.log(paymentResponse);

            return paymentResponse.complete()
            .then(function() {
                setSnackbar('Payment done');
            });
        })
        .catch(function(err) {
            console.log(err);
        });
    }
}

function pushEvent() {
    if('Notification' in window) {
        if(serviceWorkerEnabled) {
            navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
                ServiceWorkerRegistration.pushManager.getSubscription().then(function(PushSubscription) {
                    if(PushSubscription && 'object' === typeof PushSubscription) {
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
                        }).then(function(Response) {
                            console.log(Response);
                        })
                        .catch(function(error) {
                            console.log(error);
                        });
                    }
                });
            });
        }
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
        hide('buttonOffline');
        show('buttonOnline');
    } else {
        hide('buttonOnline');
        show('buttonOffline');
    }
}

function show(id) {
    document.getElementById(id).style.display = 'block';
}

function hide(id) {
    document.getElementById(id).style.display = 'none';
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

function convert_size(result) {
    if(result >= 1073741824) {
        result = Math.round(result/1073741824) + ' GB';
    } else if(result >= 1048576) {
        result = Math.round(result/1048576) + ' MB';
    } else if(result >= 1024) {
        result = Math.round(result/1024) + ' KB';
    } else {
        result = result + ' B';
    }
    if(result == 0) {
        result = '-';
    }
    return result;
}

function utcDate() {
    var d = new Date();
    var utc = d.getUTCFullYear() + '-' + addZero(d.getUTCMonth() + 1) + '-' + addZero(d.getUTCDate()) + ' ' + addZero(d.getUTCHours()) + ':' + addZero(d.getUTCMinutes()) + ':' + addZero(d.getUTCSeconds());
    return utc;

    function addZero(i) {
        if(i < 10) {
            i = '0' + i;
        }
        return i;
    }
}

var applicationServerKey = 'BOQ0NVE+w6/fJYX3co0H8w1zre4T7uT4ssMOLfWd1rWzMmuowf7NC/pz5X9roHNTu2Qhvt0pAcKnvjnM3Aw/ssA=';

var snackbarContainer = document.querySelector('.mdl-snackbar');

var TAG = 'playground-pwa';

writeHistory(Intl.DateTimeFormat().resolvedOptions().timeZone);

if('storage' in navigator) {
    if('persist' in navigator.storage) {
        navigator.storage.persist().then(function(persistent) {
            if(persistent) {
                writeHistory('Storage will not be cleared except by explicit user action');
            } else {
                writeHistory('Storage may be cleared by the UA under storage pressure');
            }
        });
    }

    if('estimate' in navigator.storage) {
        navigator.storage.estimate().then(function(data) {
            writeHistory(convert_size(data.usage) + ' used out of ' + convert_size(data.quota) + ' storage quota');
        });
    }
}

if('localStorage' in window) {
    localStorage.setItem('playground_local_storage', 'localStorage available');
    writeHistory(localStorage.getItem('playground_local_storage'));
}

if('sessionStorage' in window) {
    sessionStorage.setItem('playground_session_storage', 'sessionStorage available');
    writeHistory(sessionStorage.getItem('playground_session_storage'));
}

if('indexedDB' in window) {
    var IDBOpenDBRequest = window.indexedDB.open('playground', 1);
    console.log(IDBOpenDBRequest);

    IDBOpenDBRequest.onupgradeneeded = function(IDBVersionChangeEvent) {
        console.log(IDBVersionChangeEvent);

        var IDBDatabase = IDBVersionChangeEvent.target.result;

        if(!IDBDatabase.objectStoreNames.contains('data')) {
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


if('deviceMemory' in navigator) {
    writeHistory(navigator.deviceMemory + ' GB device memory');
}

if('getBattery' in navigator) {
    navigator.getBattery().then(function(BatteryManager) {
        console.log(BatteryManager);

        writeHistory('Battery ' + BatteryManager.level*100 + '%');

        BatteryManager.addEventListener('levelchange', function(event) {
            console.log(event);

            writeHistory('Battery ' + event.target.level*100 + '%');
        });
    });
}

var serviceWorkerEnabled = false;
var pushManagerEnabled = false;
var imageCapture = false;

if('serviceWorker' in navigator && window.location.protocol == 'https:') {
    serviceWorkerEnabled = true;

    serviceWorkerRegister();

    navigator.serviceWorker.addEventListener('message', function(MessageEvent) {
        console.log(MessageEvent);

        writeHistory('message event from client');

        if(MessageEvent.data.type == 'snackbar') {
            setSnackbar(MessageEvent.data.content);
        }

        if(MessageEvent.data.type == 'history') {
            writeHistory(MessageEvent.data.content);
        }

        if(MessageEvent.data.type == 'reload') {
            setSnackbar('reload');
            document.location.reload(MessageEvent.data.content);
        }
    });

    navigator.serviceWorker.addEventListener('controllerchange', function(Event) {
        console.log(Event);

        writeHistory('controllerchange event from client');
    });
}

if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var videoDevices = 0;
    navigator.mediaDevices.enumerateDevices()
    .then(function(gotDevices) {
        console.log(gotDevices);

        for(var i = 0; i !== gotDevices.length; ++i) {
            var deviceInfo = gotDevices[i];
            if(deviceInfo.kind === 'videoinput') {
                if(deviceInfo.label) {
                    videoDevices++;
                    writeHistory(deviceInfo.label);
                }
            }
        }
    })
    .catch(function(handleError) {
        console.log(handleError);
    });

    //if(0 < videoDevices) {
        document.getElementById('detect-mediastreamapi').classList.remove('hidden');

        if('ImageCapture' in window) {
            document.getElementById('detect-imagecaptureapi').classList.remove('hidden');
        }
    //}
}

if('share' in navigator) {
    document.getElementById('detect-webshareapi').classList.remove('hidden');
}

if('geolocation' in navigator) {
    document.getElementById('detect-geolocationapi').classList.remove('hidden');
}

if('screen' in window && 'orientation' in screen) {
    console.log(window.screen.orientation);

    screenOrientation();

    window.screen.orientation.addEventListener('change', function(e) {
        console.log(e);
        screenOrientation();
    });
}

if('connection' in navigator) {
    console.log(navigator.connection);

    networkInformation();

    navigator.connection.addEventListener('change', function(e) {
        console.log(e);
        networkInformation();
    });
}

if('PaymentRequest' in window) {
    document.getElementById('detect-paymentrequest').classList.remove('hidden');
}

if('bluetooth' in navigator) {
    document.getElementById('detect-bluetooth').classList.remove('hidden');
}

if('https:' === window.location.protocol) {
    show('buttonHttps');
} else {
    show('buttonHttp');
}

var standalone = window.matchMedia('(display-mode: standalone)');
if(standalone.matches) {
    show('buttonStandalone');
} else {
    hide('buttonStandalone');
}

window.addEventListener('beforeinstallprompt', function(BeforeInstallPromptEvent) {
    console.log(BeforeInstallPromptEvent);

    BeforeInstallPromptEvent.preventDefault();

    document.getElementById('install').addEventListener('click', function() {
        BeforeInstallPromptEvent.userChoice.then(function(AppBannerPromptResult) {
            console.log(AppBannerPromptResult);

            setSnackbar(AppBannerPromptResult.outcome);
        });

        BeforeInstallPromptEvent.prompt();
    });

    document.getElementById('detect-promptinstall').classList.remove('hidden');
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

document.getElementById('clearHistory').addEventListener('click', function() {
    document.getElementById('history').innerHTML = '';
});

document.getElementById('getStream').addEventListener('click', function() {
    getStream();
});

document.getElementById('takePhoto').addEventListener('click', function() {
    takePhoto();
});

document.getElementById('serviceWorkerRegister').addEventListener('click', function() {
    serviceWorkerRegister();
});

document.getElementById('serviceWorkerUnregister').addEventListener('click', function() {
    serviceWorkerUnregister();
});

document.getElementById('pushManagerSubscribe').addEventListener('click', function() {
    pushManagerSubscribe();
});

document.getElementById('pushManagerUnsubscribe').addEventListener('click', function() {
    pushManagerUnsubscribe();
});

document.getElementById('pushManagerPermissionState').addEventListener('click', function() {
    pushManagerPermissionState();
});

document.getElementById('serviceWorkerUpdate').addEventListener('click', function() {
    serviceWorkerUpdate();
});

document.getElementById('serviceWorkerSyncRegister').addEventListener('click', function() {
    serviceWorkerSyncRegister();
});

document.getElementById('serviceWorkerPeriodSyncRegister').addEventListener('click', function() {
    serviceWorkerPeriodSyncRegister();
});

document.getElementById('serviceWorkerReloadCache').addEventListener('click', function() {
    messageToServiceWorker({command: 'reload-cache'});
});

document.getElementById('pushEvent').addEventListener('click', function() {
    pushEvent();
});

document.getElementById('share').addEventListener('click', function() {
    share();
});

document.getElementById('bluetooth').addEventListener('click', function() {
    bluetooth();
});

document.getElementById('geolocationGet').addEventListener('click', function() {
    geolocationGet();
});

document.getElementById('geolocationState').addEventListener('click', function() {
    geolocationState();
});

document.getElementById('paymentRequest').addEventListener('click', function() {
    paymentRequest();
});

setBadge(24);

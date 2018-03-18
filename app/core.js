var applicationServerKey = 'BOQ0NVE+w6/fJYX3co0H8w1zre4T7uT4ssMOLfWd1rWzMmuowf7NC/pz5X9roHNTu2Qhvt0pAcKnvjnM3Aw/ssA=';

var snackbarContainer = document.querySelector('.mdl-snackbar');

var TAG = 'playground-pwa';

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
    document.getElementById('detect-mediastreamapi').classList.remove('hidden');
}

if('ImageCapture' in window) {
    document.getElementById('detect-imagecaptureapi').classList.remove('hidden');
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

    BeforeInstallPromptEvent.userChoice.then(function(AppBannerPromptResult) {
        console.log(AppBannerPromptResult);

        setSnackbar(AppBannerPromptResult.outcome);
    });
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

document.getElementById('geolocationGet').addEventListener('click', function() {
    geolocationGet();
});

document.getElementById('geolocationState').addEventListener('click', function() {
    geolocationState();
});

document.getElementById('paymentRequest').addEventListener('click', function() {
    paymentRequest();
});

var applicationServerKey = 'BPjjzF6mMnplDTu3U8XVwkrgxK7cclGZpiqM3iICEhWa8HyaowqKCXeANyND9+ikuXN0+cnjsSrDPkwd6T/w8tA=';

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

if('deviceMemory' in navigator) {
    writeHistory(navigator.deviceMemory + ' MB device memory');
}

if('getBattery' in navigator) {
    navigator.getBattery().then(function(BatteryManager) {
        console.log(BatteryManager);

        writeHistory('Battery ' + BatteryManager.level*100 + '%');

        BatteryManager.addEventListener('levelchange', function(event) {
            console.log(event);

            writeHistory('Battery ' + event.level*100 + '%');
        });
    });
}

var serviceWorkerEnabled = false;
var pushManagerEnabled = false;
var imageCapture = false;

if('serviceWorker' in navigator && window.location.protocol == 'https:') {
    serviceWorkerEnabled = true;

    serviceWorkerRegister();

    navigator.serviceWorker.addEventListener('message', function(ServiceWorkerMessageEvent) {
        console.log(ServiceWorkerMessageEvent);

        writeHistory('message event from client');

        if(ServiceWorkerMessageEvent.data.type == 'snackbar') {
            setSnackbar(ServiceWorkerMessageEvent.data.content);
        }

        if(ServiceWorkerMessageEvent.data.type == 'history') {
            writeHistory(ServiceWorkerMessageEvent.data.content);
        }
    });

} else {
    if('serviceWorker' in navigator === false) {
        setChip('title-serviceworker', 'red');
        setChip('title-pushapi', 'red');
    }

    if(window.location.protocol !== 'https:') {
        writeHistory('https only');
    }
}

if(window.location.protocol === 'https:') {
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

document.getElementById('showNotificationPage').addEventListener('click', function() {
    showNotificationPage();
});

document.getElementById('showNotificationWorker').addEventListener('click', function() {
    showNotificationWorker();
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

document.getElementById('screenOrientation').addEventListener('click', function() {
    screenOrientation();
});

document.getElementById('networkInformation').addEventListener('click', function() {
    networkInformation();
});

document.getElementById('paymentRequest').addEventListener('click', function() {
    paymentRequest();
});

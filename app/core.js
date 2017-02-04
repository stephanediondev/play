var applicationServerKey = 'BPjjzF6mMnplDTu3U8XVwkrgxK7cclGZpiqM3iICEhWa8HyaowqKCXeANyND9+ikuXN0+cnjsSrDPkwd6T/w8tA=';

var snackbarContainer = document.querySelector('.mdl-snackbar');

var TAG = 'playground-pwa';

if('serviceWorker' in navigator && window.location.protocol == 'https:') {
    var serviceWorkerEnabled = true;

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
    var serviceWorkerEnabled = false;

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

document.getElementById('fullscreenRequest').addEventListener('click', function() {
    fullscreenRequest();
});

document.getElementById('fullscreenExit').addEventListener('click', function() {
    fullscreenExit();
});

document.getElementById('networkInformation').addEventListener('click', function() {
    networkInformation();
});

document.getElementById('paymentRequest').addEventListener('click', function() {
    paymentRequest();
});

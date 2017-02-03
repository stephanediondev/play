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
        setChip('title-channelmessaging', 'red');
    }

    if(window.location.protocol !== 'https:') {
        writeHistory('https only');
    }
}

var standalone = window.matchMedia('(display-mode: standalone)');
if(standalone.matches) {
    setChip('title-standalone', 'green');
} else {
    setChip('title-standalone', 'red');
}

standalone.addEventListener('change', function(e) {
    console.log(e);
});

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

document.getElementById('btn_clear_history').addEventListener('click', function() {
    document.getElementById('history').innerHTML = '';
});

document.getElementById('btn_register').addEventListener('click', function() {
    serviceWorkerRegister();
});

document.getElementById('btn_unregister').addEventListener('click', function() {
    serviceWorkerUnregister();
});

document.getElementById('btn_subscribe').addEventListener('click', function() {
    pushManagerSubscribe();
});

document.getElementById('btn_unsubscribe').addEventListener('click', function() {
    pushManagerUnsubscribe();
});

document.getElementById('btn_permission_state_push').addEventListener('click', function() {
    pushManagerPermissionState();
});

document.getElementById('btn_update').addEventListener('click', function() {
    serviceWorkerUpdate();
});

document.getElementById('btn_sync').addEventListener('click', function() {
    serviceWorkerSyncRegister();
});

document.getElementById('btn_periodic_sync').addEventListener('click', function() {
    serviceWorkerPeriodSyncRegister();
});

document.getElementById('btn_message_cache').addEventListener('click', function() {
    messageToServiceWorker({command: 'reload-cache'});
});

document.getElementById('btn_notification_page').addEventListener('click', function() {
    showNotificationPage('from page', 'body', TAG);
});

document.getElementById('btn_notification_worker').addEventListener('click', function() {
    showNotificationWorker();
});

document.getElementById('btn_share').addEventListener('click', function() {
    share();
});

document.getElementById('btn_geolocation_get').addEventListener('click', function() {
    geolocationGet();
});

document.getElementById('btn_geolocation_state').addEventListener('click', function() {
    geolocationState();
});

document.getElementById('btn_screen_orientation').addEventListener('click', function() {
    screenOrientation();
});

document.getElementById('btn_fullscreen_request').addEventListener('click', function() {
    fullscreenRequest();
});

document.getElementById('btn_fullscreen_exit').addEventListener('click', function() {
    fullscreenExit();
});

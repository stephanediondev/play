function getStream() {
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setChip('title-mediastreamapi', 'orange');

        navigator.mediaDevices.getUserMedia({'video': true})
        .then(function(MediaStream) {
            console.log(MediaStream);

            var video = document.getElementById('video');
            video.srcObject = MediaStream;

            if('ImageCapture' in window) {
                var track = MediaStream.getVideoTracks()[0];
                imageCapture = new ImageCapture(track);
            }

            setChip('title-mediastreamapi', 'green');
        })
        .catch(function(NavigatorUserMediaError) {
            console.log(NavigatorUserMediaError);

            setChip('title-mediastreamapi', 'red');

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

            setChip('title-imagecaptureapi', 'green');
        })
        .catch(function(err) {
            console.log(err);

            setChip('title-imagecaptureapi', 'red');
        });
    } else {
        setSnackbar('Image Capture API not supported');
        setChip('title-imagecaptureapi', 'red');
    }
}

function serviceWorkerRegister() {
    if(serviceWorkerEnabled) {
        setChip('title-serviceworker', 'orange');
        navigator.serviceWorker.register('serviceworker.js')
        .then(function(ServiceWorkerRegistration) {
            console.log(ServiceWorkerRegistration);

            setChip('title-serviceworker', 'green');

            if('pushManager' in ServiceWorkerRegistration) {
                ServiceWorkerRegistration.pushManager.getSubscription().then(function(PushSubscription) {
                    if(PushSubscription && typeof PushSubscription === 'object') {
                        console.log(PushSubscription);
                        setChip('title-pushapi', 'green');
                    } else {
                        setChip('title-pushapi', 'red');
                    }
                });
            }

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
                writeHistory('unregister done');
                setChip('title-serviceworker', 'red');
                setChip('title-pushapi', 'red');
            });
        });
    }
}

function pushManagerSubscribe() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('pushManager' in ServiceWorkerRegistration) {
                setChip('title-pushapi', 'orange');

                ServiceWorkerRegistration.pushManager.permissionState({userVisibleOnly: true}).then(function(permissionState) {
                    writeHistory('permissionState: ' + permissionState);

                    if(permissionState == 'denied') {
                        setSnackbar(permissionState);
                    }

                    if(permissionState == 'prompt' || permissionState == 'granted') {
                        ServiceWorkerRegistration.pushManager.subscribe(
                            {applicationServerKey: urlBase64ToUint8Array(applicationServerKey), userVisibleOnly: true}
                        ).then(function(PushSubscription) {
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
            } else {
                setSnackbar('Push API not supported');
                setChip('title-pushapi', 'red');
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

                    if(PushSubscription && typeof PushSubscription === 'object') {
                        PushSubscription.unsubscribe().then(function() {
                            writeHistory('unsubcribe done');
                            setChip('title-pushapi', 'red');
                        });
                    }
                });
            } else {
                setSnackbar('Push API not supported');
                setChip('title-pushapi', 'red');
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
            } else {
                setSnackbar('Push API not supported');
                setChip('title-pushapi', 'red');
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
    if('geolocation' in navigator) {
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
    if('screen' in window && 'orientation' in screen) {
        setChip('title-screenorientationapi', 'green');
        setSnackbar(window.screen.orientation.type);
    } else {
        setChip('title-screenorientationapi', 'red');
        setSnackbar('Screen Orientation API not supported');
    }
}

function networkInformation() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
    if(connection) {
        console.log(connection);
        setChip('title-networkinformation', 'green');
        if(typeof connection.type !== 'undefined') {
            setSnackbar(connection.type);
        } else if(typeof connection.effectiveType !== 'undefined') {
            setSnackbar(connection.effectiveType);
        }
        connection.addEventListener('change', function(e) {
            console.log(e);
        });
    } else {
        setChip('title-networkinformation', 'red');
        setSnackbar('Network Information API not supported');
    }
}

function paymentRequest() {
    if('PaymentRequest' in window) {
        setChip('title-paymentrequest', 'green');
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
    } else {
        setChip('title-paymentrequest', 'red');
        setSnackbar('Payment Request API not supported');
    }
}

function showNotificationPage() {
    if('Notification' in window) {
        if(Notification.permission == 'denied') {
            setSnackbar(Notification.permission);
            setChip('title-notificationsapi', 'red');
        }

        var notification = new Notification('from page', {
            body: 'body',
            badge: 'app/icons/icon-32x32.png',
            icon: 'app/icons/icon-192x192.png',
            image: 'app/icons/icon-512x512.png'
        });
        notification.addEventListener('click', function(Event) {
            console.log(Event);

            setSnackbar('close notification from page');

            notification.close();
        });
        notification.onshow = function(Event) {
            console.log(Event);

            setChip('title-notificationsapi', 'green');
        };
        notification.onerror = function(Event) {
            console.log(Event);

            setChip('title-notificationsapi', 'red');
        };
    } else {
        setSnackbar('Notifications API not supported');
    }
}

function showNotificationWorker() {
    if(serviceWorkerEnabled) {
        navigator.serviceWorker.ready.then(function(ServiceWorkerRegistration) {
            if('pushManager' in ServiceWorkerRegistration) {
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
            } else {
                setSnackbar('Push API not supported');
                setChip('title-notificationsapi', 'red');
            }
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

function setChip(id, color) {
    document.getElementById(id).className = 'mdl-chip mdl-color--' + color;
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

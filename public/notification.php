<?php

include('../vendor/autoload.php');

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
//use Minishlink\WebPush\VAPID;

header('Content-Type: application/json');

$postdata = json_decode(file_get_contents('php://input'), true);

$result = [];

//var_dump(VAPID::createVapidKeys());

if(isset($postdata['endpoint']) && isset($postdata['public_key']) && isset($postdata['authentication_secret'])) {
    $apiKeys = [
        'VAPID' => [
            'subject' => 'mailto:divers@sdion.net',
            'publicKey' => 'BOL1MjOgSneIArw6ZdxxL1UqSdnDnsxGT8WaNqBVgwtSPSHJdlY3tLffFwLzPiuUWr_87KyxLKcUsAImyBKTusU',
            'privateKey' => 'PLEgHetu5VUmMCHw1wDE8KBrIfb8nwJyeT1cGNUA83o',
        ],
    ];

    $payload = [
        //'aud' => 'https://web.push.apple.com',
        //'exp' => 1680379437,
        //'sub' => 'mailto:divers@sdion.net',
        'title' => 'Push event',
        'body' => $_SERVER['REMOTE_ADDR'],
    ];

    $webPush = new WebPush($apiKeys);

    $subcription = Subscription::create([
        'endpoint' => $postdata['endpoint'],
        'publicKey' => $postdata['public_key'],
        'authToken' => $postdata['authentication_secret'],
        'contentEncoding' => $postdata['content_encoding'],
    ]);

    $result = $webPush->sendOneNotification($subcription, json_encode($payload));
}
echo json_encode($result);

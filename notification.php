<?php

include('vendor/autoload.php');

use Minishlink\WebPush\WebPush;

header('Content-Type: application/json');

$postdata = json_decode(file_get_contents('php://input'), true);

$result = [];

if(isset($postdata['endpoint']) && isset($postdata['public_key']) && isset($postdata['authentication_secret'])) {
    $apiKeys = [
        'VAPID' => [
            'subject' => 'mailto:divers@sdion.net',
            'publicKey' => 'BOQ0NVE+w6/fJYX3co0H8w1zre4T7uT4ssMOLfWd1rWzMmuowf7NC/pz5X9roHNTu2Qhvt0pAcKnvjnM3Aw/ssA=',
            'privateKey' => '9+1EJiRiJiI8/YdV2Jts94ZJr9k2sCXdNIGypZh0oTo=',
        ],
    ];

    $payload = '{"title": "Push event", "body": "'.$_SERVER['REMOTE_ADDR'].'"}';

    $webPush = new WebPush($apiKeys);

    $result = $webPush->sendNotification(
        $postdata['endpoint'],
        $payload,
        $postdata['public_key'],
        $postdata['authentication_secret'],
        true
    );
}
echo json_encode($result);

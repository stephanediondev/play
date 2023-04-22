git fetch origin
git reset --hard origin/main

composer install
npm install
npm run build

sed -i "s/VERSION =.*/VERSION = '"$(date +%Y-%m-%d.%H-%M-%S)"';/g" public/serviceworker.js

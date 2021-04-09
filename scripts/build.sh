#/bin/bash
yarn
yarn prebuild
yarn build
cp .env build/.env
pm2 restart tdlearning

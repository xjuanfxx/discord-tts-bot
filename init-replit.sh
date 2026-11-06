#!/bin/sh

echo "Removing old node_modules..."
rm -rf node_modules

echo "Installing node@22..."
npm i --save-dev node@22

echo "Configuring npm node@22..."
npm config set prefix=$(pwd)/node_modules/node
export PATH=$(pwd)/node_modules/node/bin:$PATH

echo "Reinstalling dependencies..."
npm install

echo "Installing ffmpeg-static..."
npm install --save-dev ffmpeg-static

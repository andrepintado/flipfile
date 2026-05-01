#!/bin/bash
# Download required libraries for self-hosting
# This script downloads lamejs (MP3 encoder) for audio conversion support

set -e

echo "Downloading audio conversion library to libs/ directory..."

mkdir -p libs
cd libs

echo "Downloading lamejs (MP3 encoder)..."
curl -L -o lame.min.js "https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/lame.all.js"

echo ""
echo "Download complete!"
ls -lh lame.min.js

echo ""
echo "Audio conversion is now ready to work on GitHub Pages!"
echo "Supported audio output formats: MP3, WAV"

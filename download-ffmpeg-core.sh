#!/bin/bash
# Script to download FFmpeg core files for self-hosting
# This avoids CORS issues when running FlipFile

echo "Downloading FFmpeg core files to libs/ directory..."

# Create libs directory if it doesn't exist
mkdir -p libs

# Download FFmpeg core files
cd libs

echo "Downloading ffmpeg-core.js..."
curl -L -o ffmpeg-core.js "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js"

echo "Downloading ffmpeg-core.wasm..."
curl -L -o ffmpeg-core.wasm "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm"

echo "Downloading ffmpeg-core.worker.js..."
curl -L -o ffmpeg-core.worker.js "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js"

echo ""
echo "Download complete! The following files were added:"
ls -lh ffmpeg-core.*

echo ""
echo "You can now run FlipFile with full audio/video conversion support!"

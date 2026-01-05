# FFmpeg Libraries Directory

This directory contains the self-hosted FFmpeg libraries needed for audio/video conversion in FlipFile.

## Current Files

- `ffmpeg.js` - FFmpeg.wasm wrapper library
- `index.js` - FFmpeg utility library (includes toBlobURL)
- `814.ffmpeg.js` - FFmpeg worker chunk

## Required Files (Not Yet Downloaded)

To enable audio/video conversion, you need to download the FFmpeg core files:

1. `ffmpeg-core.js` - Main FFmpeg core JavaScript
2. `ffmpeg-core.wasm` - FFmpeg WebAssembly binary
3. `ffmpeg-core.worker.js` - FFmpeg Web Worker

## How to Download

### Option 1: Run the download script (Recommended)

From the project root directory, run:

```bash
./download-ffmpeg-core.sh
```

### Option 2: Manual download

Download these files from the CDN and place them in this directory:

```bash
cd libs
curl -L -o ffmpeg-core.js "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js"
curl -L -o ffmpeg-core.wasm "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm"
curl -L -o ffmpeg-core.worker.js "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js"
```

## Why Self-Host?

Self-hosting these files avoids CORS (Cross-Origin Resource Sharing) issues that occur when loading Web Workers from external CDNs. By serving all files from the same origin (your GitHub Pages domain), the browser allows the Workers to load without security restrictions.

## Note

Audio/video conversion requires proper COEP and COOP headers, which are not supported by GitHub Pages. For full audio/video conversion support, deploy to:

- Netlify
- Vercel
- Cloudflare Pages
- Or run locally with a proper development server

For local development, you can use the provided `server.py` script.

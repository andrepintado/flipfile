# Libs Directory

This directory contains self-hosted JavaScript libraries used by FlipFile.

## Required Files

- `lame.min.js` - lamejs MP3 encoder (pure JavaScript, no SharedArrayBuffer required)

## Setup

Run the download script from the project root:

```bash
./download-libs.sh
```

Or download manually:

```bash
curl -L -o lame.min.js "https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/lame.all.js"
```

## Why Self-Host?

Self-hosting libraries:
- Avoids CORS issues on GitHub Pages
- Ensures privacy (no third-party CDN tracking)
- Works offline once loaded
- More reliable (no CDN downtime)

## Audio Conversion

FlipFile uses Web Audio API + lamejs for audio conversion. This works on **GitHub Pages** without any special headers:

- **Input formats**: MP3, WAV, OGG, M4A, AAC (any format browser can decode)
- **Output formats**: MP3, WAV

## Why Not FFmpeg.wasm?

FFmpeg.wasm requires `SharedArrayBuffer`, which requires `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers. **GitHub Pages does not support these headers**, so FFmpeg.wasm cannot work there.

For full video conversion support, you'd need to deploy to Netlify, Vercel, or Cloudflare Pages.

# FlipFile 🔄

**Fast, Private, Browser-Based File Converter**

Convert files instantly in your browser. No uploads, no storage, complete privacy. We use minimal Google Analytics tracking to understand how users interact with the app.

🌐 **Live at:** [flipfile.tools](https://flipfile.tools)

## ✨ Features

- **🔒 100% Private** - All conversions happen locally in your browser
- **⚡ Fast** - Instant conversion without server round-trips
- **🆓 Free** - No limits, no signup
- **📱 Responsive** - Works on desktop, tablet, and mobile

## 🎯 Supported Conversions

### Images
- **Input:** PNG, JPG, JPEG, GIF, BMP, WebP, HEIC/HEIF (iPhone photos), and more
- **Output:** PNG, JPG, WebP, GIF, BMP, ICO

### Documents
- **Input:** TXT, JSON, HTML, MD, DOC, DOCX
- **Output:** TXT, JSON, HTML, MD

### Audio/Video
- **Input:** MP3, WAV, OGG, M4A, AAC, MP4, WebM, AVI
- **Output:** MP3, WAV, OGG, M4A, AAC, MP4, WebM, GIF
- **Note:** Audio/video conversion requires specific server headers. Works locally or on Netlify/Vercel/Cloudflare Pages, but **not on GitHub Pages**.

## 🛠️ Technology Stack

- **Pure HTML/CSS/JavaScript** - No frameworks needed
- **Canvas API** - For image manipulation
- **Mammoth.js** - For DOC/DOCX conversion
- **jsPDF** - For PDF generation
- **PDF.js** - For PDF reading/conversion
<<<<<<< claude/flipfile-converter-app-U96DJ
- **heic2any** - For HEIC/HEIF (iPhone photos) decoding
- **FFmpeg.wasm** - For audio/video conversion
- **Web APIs** - File, Blob, and URL APIs

## 🚀 Setup for Audio/Video Conversion

To enable audio and video conversion features, you need to download the FFmpeg core files:

### Quick Setup

Run the provided download script:

```bash
./download-ffmpeg-core.sh
```

This will download the required FFmpeg core files (`ffmpeg-core.js`, `ffmpeg-core.wasm`, `ffmpeg-core.worker.js`) to the `libs/` directory.

### Manual Setup

Alternatively, download the files manually:

```bash
cd libs
curl -L -o ffmpeg-core.js "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js"
curl -L -o ffmpeg-core.wasm "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm"
curl -L -o ffmpeg-core.worker.js "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js"
```

### Why Self-Host?

Self-hosting FFmpeg files avoids CORS issues when loading Web Workers from external CDNs.

### Deployment Notes

Audio/video conversion requires `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers:

- ❌ **GitHub Pages** - Does not support required headers
- ✅ **Netlify** - Supports custom headers
- ✅ **Vercel** - Supports custom headers
- ✅ **Cloudflare Pages** - Supports custom headers
- ✅ **Local Development** - Use the provided `server.py` script
=======
- **FFmpeg.wasm** - For audio/video conversion
- **Web APIs** - File, Blob, and URL APIs
>>>>>>> main

## 🔐 Privacy & Security

FlipFile is designed with privacy as the #1 priority:

- ✅ **No server uploads** - Files never leave your device
- ✅ **Minimal tracking** - Only Google Analytics for usage insights
- ✅ **No storage** - Files aren't saved anywhere
- ✅ **Open source** - Fully transparent code
- ✅ **Offline capable** - Works without internet (after first load)

## 🗺️ Roadmap

- [x] Image conversion (PNG, JPG, WebP, GIF, BMP, ICO)
- [x] Text/document conversion (TXT, JSON, HTML, MD)
- [x] DOC/DOCX conversion (TXT, HTML, MD)
- [x] Batch conversion support
- [ ] Audio conversion (MP3, WAV, OGG, M4A) using FFmpeg.wasm
- [ ] Video conversion (MP4, WebM, AVI) using FFmpeg.wasm
- [ ] PDF operations (split, merge, compress)
- [ ] Archive operations (ZIP, RAR)
- [ ] Image editing tools (resize, crop, filters)
- [ ] PWA support for offline usage
- [ ] Dark mode
- [ ] Multiple language support

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - Feel free to use this project for any purpose.

## 🙏 Credits

Built with love for privacy and simplicity.

---

**No servers. No databases. Just your browser.** 🚀

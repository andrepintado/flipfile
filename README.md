# FlipFile 🔄

**Convert files instantly privately in your browser**

🌐 **Live:** [flipfile.tools](https://flipfile.tools)

## Features

- 🔒 **100% Private** - Files never leave your browser
- ⚡ **Fast** - Instant conversion
- 🆓 **Free** - No limits, no signup
- 📱 **Responsive** - Works on all devices

## Supported Formats

**Images:** PNG, JPG, WebP, GIF, BMP, HEIC/HEIF (iPhone), ICO  
**Documents:** TXT, JSON, HTML, MD, DOC/DOCX, PDF  
**Audio/Video:** MP3, WAV, OGG, M4A, AAC, MP4, WebM, AVI

See the [live site](https://flipfile.tools) for complete list of input/output combinations.

## Development

To enable audio/video conversion locally:

```bash
./download-ffmpeg-core.sh
```

**Note:** Audio/video conversion requires COEP/COOP headers (not supported on GitHub Pages). Deploy to Netlify, Vercel, or Cloudflare Pages.

## Tech Stack

Pure HTML/CSS/JavaScript • Canvas API • Mammoth.js • jsPDF • PDF.js • heic2any • FFmpeg.wasm

## License

MIT License

---

**No servers. No databases. Just your browser.** 🚀

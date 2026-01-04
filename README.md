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
- **Input:** PNG, JPG, JPEG, GIF, BMP, WebP, and more
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
- **FFmpeg.wasm** - For audio/video conversion
- **Web APIs** - File, Blob, and URL APIs

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

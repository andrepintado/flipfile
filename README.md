# FlipFile 🔄

**Fast, Private, Browser-Based File Converter**

Convert files instantly in your browser. No uploads, no storage, complete privacy.

🌐 **Live at:** [flipfile.tools](https://flipfile.tools)

## ✨ Features

- **🔒 100% Private** - All conversions happen locally in your browser
- **⚡ Fast** - Instant conversion without server round-trips
- **🆓 Free** - No limits, no signup, no tracking
- **📱 Responsive** - Works on desktop, tablet, and mobile
- **🎨 Beautiful UI** - Clean, modern interface

## 🎯 Supported Conversions

### Images
- **Input:** PNG, JPG, JPEG, GIF, BMP, WebP, and more
- **Output:** PNG, JPG, WebP, GIF, BMP, ICO

### Documents
- **Input:** TXT, JSON, HTML, MD
- **Output:** TXT, JSON, HTML, MD

### Audio/Video (Coming Soon)
- MP3, WAV, OGG, M4A
- MP4, WebM, AVI, GIF

## 🚀 How It Works

1. **Drop or select your file** - Drag & drop or click to browse
2. **Choose output format** - Select from available formats
3. **Download instantly** - Your converted file is ready!

All processing happens in your browser using modern Web APIs:
- Canvas API for image conversions
- File API for reading/writing files
- Blob API for file generation

## 🛠️ Technology Stack

- **Pure HTML/CSS/JavaScript** - No frameworks needed
- **Canvas API** - For image manipulation
- **Web APIs** - File, Blob, and URL APIs
- **Future:** FFmpeg.wasm for audio/video conversion

## 📦 Installation & Development

### Run Locally

1. Clone the repository:
```bash
git clone https://github.com/andrepintado/flipfile.git
cd flipfile
```

2. Start a local server:
```bash
# Using Python 3
python3 -m http.server 8000

# OR using Node.js
npx serve .

# OR using PHP
php -S localhost:8000
```

3. Open your browser:
```
http://localhost:8000
```

### Deploy

This is a static website and can be deployed to any static hosting service:

- **Netlify:** Drop the folder or connect your repo
- **Vercel:** Import your GitHub repository
- **GitHub Pages:** Enable in repository settings
- **Cloudflare Pages:** Connect your repository
- **Any CDN or static host**

No build process required - just upload the files!

## 🔐 Privacy & Security

FlipFile is designed with privacy as the #1 priority:

- ✅ **No server uploads** - Files never leave your device
- ✅ **No tracking** - No analytics, no cookies
- ✅ **No storage** - Files aren't saved anywhere
- ✅ **Open source** - Fully transparent code
- ✅ **Offline capable** - Works without internet (after first load)

## 🗺️ Roadmap

- [x] Image conversion (PNG, JPG, WebP, GIF, BMP, ICO)
- [x] Text/document conversion (TXT, JSON, HTML, MD)
- [ ] Audio conversion (MP3, WAV, OGG, M4A) using FFmpeg.wasm
- [ ] Video conversion (MP4, WebM, AVI) using FFmpeg.wasm
- [ ] PDF operations (split, merge, compress)
- [ ] Archive operations (ZIP, RAR)
- [ ] Batch conversion support
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

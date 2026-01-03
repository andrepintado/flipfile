// FlipFile - Browser-based File Converter
// All conversions happen locally in your browser

class FlipFile {
    constructor() {
        this.currentFile = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const resetBtn = document.getElementById('resetBtn');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        // Reset button
        resetBtn.addEventListener('click', () => this.reset());
    }

    handleFile(file) {
        this.currentFile = file;
        this.displayFileInfo(file);
        this.showConversionOptions(file);
        this.toggleView('conversion');
    }

    displayFileInfo(file) {
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const fileIcon = document.getElementById('fileIcon');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileIcon.textContent = this.getFileIcon(file.type);
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('text')) return '📄';
        if (mimeType.includes('json')) return '📋';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        return '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    showConversionOptions(file) {
        const formatGrid = document.getElementById('formatGrid');
        const formats = this.getAvailableFormats(file.type);

        formatGrid.innerHTML = '';
        formats.forEach(format => {
            const btn = document.createElement('button');
            btn.className = 'format-btn';
            btn.textContent = format;
            btn.addEventListener('click', () => this.convertFile(file, format));
            formatGrid.appendChild(btn);
        });
    }

    getAvailableFormats(mimeType) {
        if (mimeType.startsWith('image/')) {
            return ['PNG', 'JPG', 'WebP', 'GIF', 'BMP', 'ICO'];
        }
        if (mimeType.startsWith('audio/')) {
            return ['MP3', 'WAV', 'OGG', 'M4A'];
        }
        if (mimeType.startsWith('video/')) {
            return ['MP4', 'WebM', 'GIF', 'AVI'];
        }
        if (mimeType.includes('pdf')) {
            return ['PNG', 'JPG', 'TXT'];
        }
        if (mimeType.includes('text') || mimeType.includes('json')) {
            return ['TXT', 'JSON', 'HTML', 'MD'];
        }

        // Default options
        return ['TXT'];
    }

    async convertFile(file, targetFormat) {
        this.showProgress(true);
        this.updateProgress(0, 'Preparing conversion...');

        try {
            let result;
            const mimeType = file.type;

            if (mimeType.startsWith('image/')) {
                result = await this.convertImage(file, targetFormat);
            } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
                result = await this.convertMedia(file, targetFormat);
            } else if (mimeType.includes('text') || mimeType.includes('json')) {
                result = await this.convertText(file, targetFormat);
            } else {
                throw new Error('Unsupported file type');
            }

            this.updateProgress(100, 'Conversion complete!');
            setTimeout(() => {
                this.downloadFile(result.blob, result.filename);
                this.showProgress(false);
            }, 500);

        } catch (error) {
            console.error('Conversion error:', error);
            alert('Conversion failed: ' + error.message);
            this.showProgress(false);
        }
    }

    // IMAGE CONVERSION
    async convertImage(file, format) {
        this.updateProgress(20, 'Loading image...');

        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    this.updateProgress(40, 'Converting image...');

                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    // Handle transparency for formats that don't support it
                    if (format === 'JPG') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    ctx.drawImage(img, 0, 0);

                    this.updateProgress(60, 'Encoding...');

                    const mimeType = this.getMimeType(format);
                    const quality = format === 'JPG' ? 0.92 : undefined;

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                this.updateProgress(80, 'Finalizing...');
                                const filename = this.changeFileExtension(file.name, format);
                                resolve({ blob, filename });
                            } else {
                                reject(new Error('Failed to create image'));
                            }
                        },
                        mimeType,
                        quality
                    );
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // MEDIA CONVERSION (Audio/Video)
    async convertMedia(file, format) {
        this.updateProgress(30, 'Loading media converter...');

        // For now, show a message that FFmpeg is needed
        // In production, we would load FFmpeg.wasm here
        alert('Audio and video conversion requires FFmpeg.wasm. This feature will be added in the next update!\n\nFor now, please use image or document conversion.');

        throw new Error('Media conversion not yet implemented');
    }

    // TEXT/DOCUMENT CONVERSION
    async convertText(file, format) {
        this.updateProgress(30, 'Reading file...');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    this.updateProgress(50, 'Converting...');

                    let content = e.target.result;
                    let blob;
                    const filename = this.changeFileExtension(file.name, format);

                    switch (format) {
                        case 'TXT':
                            blob = new Blob([content], { type: 'text/plain' });
                            break;

                        case 'JSON':
                            // Try to format as JSON if possible
                            try {
                                const parsed = JSON.parse(content);
                                content = JSON.stringify(parsed, null, 2);
                            } catch {
                                // If not valid JSON, just save as is
                            }
                            blob = new Blob([content], { type: 'application/json' });
                            break;

                        case 'HTML':
                            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name}</title>
    <style>
        body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>${file.name}</h1>
    <pre>${this.escapeHtml(content)}</pre>
</body>
</html>`;
                            blob = new Blob([htmlContent], { type: 'text/html' });
                            break;

                        case 'MD':
                            const mdContent = `# ${file.name}\n\n\`\`\`\n${content}\n\`\`\``;
                            blob = new Blob([mdContent], { type: 'text/markdown' });
                            break;

                        default:
                            blob = new Blob([content], { type: 'text/plain' });
                    }

                    this.updateProgress(80, 'Finalizing...');
                    resolve({ blob, filename });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // UTILITY FUNCTIONS
    getMimeType(format) {
        const mimeTypes = {
            'PNG': 'image/png',
            'JPG': 'image/jpeg',
            'WebP': 'image/webp',
            'GIF': 'image/gif',
            'BMP': 'image/bmp',
            'ICO': 'image/x-icon',
            'MP3': 'audio/mpeg',
            'WAV': 'audio/wav',
            'OGG': 'audio/ogg',
            'M4A': 'audio/mp4',
            'MP4': 'video/mp4',
            'WebM': 'video/webm',
            'AVI': 'video/x-msvideo',
            'TXT': 'text/plain',
            'JSON': 'application/json',
            'HTML': 'text/html',
            'MD': 'text/markdown'
        };
        return mimeTypes[format] || 'application/octet-stream';
    }

    changeFileExtension(filename, newExt) {
        const lastDot = filename.lastIndexOf('.');
        const nameWithoutExt = lastDot > 0 ? filename.substring(0, lastDot) : filename;
        return `${nameWithoutExt}.${newExt.toLowerCase()}`;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // UI FUNCTIONS
    showProgress(show) {
        const container = document.getElementById('progressContainer');
        container.style.display = show ? 'block' : 'none';
        if (!show) {
            this.updateProgress(0, '');
        }
    }

    updateProgress(percent, message) {
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        fill.style.width = percent + '%';
        text.textContent = message;
    }

    toggleView(view) {
        const uploadArea = document.getElementById('uploadArea');
        const conversionPanel = document.getElementById('conversionPanel');

        if (view === 'conversion') {
            uploadArea.style.display = 'none';
            conversionPanel.style.display = 'block';
        } else {
            uploadArea.style.display = 'block';
            conversionPanel.style.display = 'none';
        }
    }

    reset() {
        this.currentFile = null;
        document.getElementById('fileInput').value = '';
        this.toggleView('upload');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new FlipFile();
});

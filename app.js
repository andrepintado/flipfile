// FlipFile - Browser-based File Converter
// All conversions happen locally in your browser

class FlipFile {
    constructor() {
        this.files = new Map(); // Store files with unique IDs
        this.fileCounter = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const conversionPanel = document.getElementById('conversionPanel');
        const fileInput = document.getElementById('fileInput');
        const resetBtn = document.getElementById('resetBtn');
        const convertAllBtn = document.getElementById('convertAllBtn');
        const convertDownloadBtn = document.getElementById('convertDownloadBtn');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFiles(Array.from(e.target.files));
            }
        });

        // Drag and drop on upload area
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
                this.handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        // Drag and drop on conversion panel (when files are already present)
        conversionPanel.addEventListener('dragover', (e) => {
            e.preventDefault();
            conversionPanel.style.opacity = '0.7';
        });

        conversionPanel.addEventListener('dragleave', () => {
            conversionPanel.style.opacity = '1';
        });

        conversionPanel.addEventListener('drop', (e) => {
            e.preventDefault();
            conversionPanel.style.opacity = '1';
            if (e.dataTransfer.files.length > 0) {
                this.handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        // Reset button - add more files
        resetBtn.addEventListener('click', () => fileInput.click());

        // Convert All button (without download)
        convertAllBtn.addEventListener('click', () => this.convertAll(false));

        // Convert and Download All button
        convertDownloadBtn.addEventListener('click', () => this.convertAll(true));
    }

    handleFiles(fileList) {
        fileList.forEach(file => {
            const fileId = `file-${this.fileCounter++}`;
            this.files.set(fileId, {
                file: file,
                selectedFormat: null,
                status: 'pending' // pending, converting, completed
            });
            this.addFileToUI(fileId, file);
        });

        this.toggleView('conversion');
    }

    addFileToUI(fileId, file) {
        const filesList = document.getElementById('filesList');
        const formats = this.getAvailableFormats(file.type, file.name);

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = fileId;

        fileItem.innerHTML = `
            <div class="file-icon">${this.getFileIcon(file.type)}</div>
            <div class="file-details">
                <h3>${file.name}</h3>
                <p>${this.formatFileSize(file.size)}</p>
            </div>
            <select class="format-select" data-file-id="${fileId}">
                <option value="">Select format</option>
                ${formats.map(format => `<option value="${format}">${format}</option>`).join('')}
            </select>
            <button class="convert-btn" data-file-id="${fileId}" disabled>Convert</button>
        `;

        filesList.appendChild(fileItem);

        // Add event listeners
        const select = fileItem.querySelector('.format-select');
        const convertBtn = fileItem.querySelector('.convert-btn');

        select.addEventListener('change', (e) => {
            const selectedFormat = e.target.value;
            const fileData = this.files.get(fileId);
            fileData.selectedFormat = selectedFormat;
            convertBtn.disabled = !selectedFormat;

            // Reset completed state when format changes
            if (fileData.status === 'completed') {
                fileData.status = 'pending';
                fileItem.classList.remove('completed');
                convertBtn.textContent = 'Convert';
            }
        });

        convertBtn.addEventListener('click', () => {
            this.convertFile(fileId);
        });
    }

    async convertFile(fileId, autoDownload = true) {
        const fileData = this.files.get(fileId);
        if (!fileData || !fileData.selectedFormat) return;

        const fileItem = document.getElementById(fileId);
        const convertBtn = fileItem.querySelector('.convert-btn');
        const select = fileItem.querySelector('.format-select');

        // Update UI state
        fileData.status = 'converting';
        fileItem.classList.add('converting');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';
        select.disabled = true;

        try {
            let result;
            const mimeType = fileData.file.type;
            const fileName = fileData.file.name;
            const targetFormat = fileData.selectedFormat;

            if (mimeType.startsWith('image/')) {
                result = await this.convertImage(fileData.file, targetFormat);
            } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
                result = await this.convertMedia(fileData.file, targetFormat);
            } else if (mimeType.includes('text') || mimeType.includes('json')) {
                result = await this.convertText(fileData.file, targetFormat);
            } else if (this.isDocumentFile(fileName)) {
                result = await this.convertDocument(fileData.file, targetFormat);
            } else {
                throw new Error('Unsupported file type');
            }

            // Store the converted result
            fileData.convertedBlob = result.blob;
            fileData.convertedFilename = result.filename;

            // Download the file if autoDownload is true
            if (autoDownload) {
                this.downloadFile(result.blob, result.filename);
                convertBtn.textContent = '✓ Downloaded';
            } else {
                convertBtn.textContent = '✓ Converted';
            }

            // Update UI to completed state
            fileData.status = 'completed';
            fileItem.classList.remove('converting');
            fileItem.classList.add('completed');
            convertBtn.disabled = false;
            select.disabled = false;

        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Conversion failed: ${error.message}`);

            // Reset UI state
            fileData.status = 'pending';
            fileItem.classList.remove('converting');
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert';
            select.disabled = false;
        }
    }

    async convertAll(autoDownload = true) {
        const pendingFiles = Array.from(this.files.entries())
            .filter(([id, data]) => data.selectedFormat && data.status !== 'converting');

        for (const [fileId, _] of pendingFiles) {
            await this.convertFile(fileId, autoDownload);
        }

        // If not auto-downloading, offer to download all at once
        if (!autoDownload && pendingFiles.length > 0) {
            const downloadAll = confirm(`${pendingFiles.length} file(s) converted. Download all now?`);
            if (downloadAll) {
                this.downloadAllConverted();
            }
        }
    }

    downloadAllConverted() {
        const convertedFiles = Array.from(this.files.values())
            .filter(data => data.status === 'completed' && data.convertedBlob);

        convertedFiles.forEach(data => {
            this.downloadFile(data.convertedBlob, data.convertedFilename);
        });
    }

    // IMAGE CONVERSION
    async convertImage(file, format) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
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

                    const mimeType = this.getMimeType(format);
                    const quality = format === 'JPG' ? 0.92 : undefined;

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
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
        // For now, show a message that FFmpeg is needed
        alert('Audio and video conversion requires FFmpeg.wasm. This feature will be added in the next update!\n\nFor now, please use image or document conversion.');
        throw new Error('Media conversion not yet implemented');
    }

    // TEXT/DOCUMENT CONVERSION
    async convertText(file, format) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
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

                    resolve({ blob, filename });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // DOCUMENT CONVERSION (DOC/DOCX using Mammoth.js)
    async convertDocument(file, format) {
        if (!window.mammoth) {
            throw new Error('Document conversion library not loaded');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;

                    // Convert DOCX to HTML using mammoth
                    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                    const htmlContent = result.value;

                    let blob;
                    const filename = this.changeFileExtension(file.name, format);

                    switch (format) {
                        case 'HTML':
                            const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name}</title>
    <style>
        body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        p { margin-bottom: 1em; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
                            blob = new Blob([fullHtml], { type: 'text/html' });
                            break;

                        case 'TXT':
                            const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                            const textContent = textResult.value;
                            blob = new Blob([textContent], { type: 'text/plain' });
                            break;

                        case 'MD':
                            // Convert HTML to simple markdown
                            const mdText = htmlContent
                                .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
                                .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
                                .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
                                .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
                                .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                                .replace(/<em>(.*?)<\/em>/g, '*$1*')
                                .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags
                            blob = new Blob([mdText], { type: 'text/markdown' });
                            break;

                        default:
                            throw new Error(`Unsupported format: ${format}`);
                    }

                    resolve({ blob, filename });

                } catch (error) {
                    reject(new Error(`Document conversion failed: ${error.message}`));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read document file'));
            reader.readAsArrayBuffer(file);
        });
    }

    isDocumentFile(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        return ['doc', 'docx'].includes(ext);
    }

    // UTILITY FUNCTIONS
    getAvailableFormats(mimeType, filename = '') {
        // Check for DOC/DOCX files by extension
        if (this.isDocumentFile(filename)) {
            return ['TXT', 'HTML', 'MD'];
        }

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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new FlipFile();
});

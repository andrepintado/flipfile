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
                selectedPostProcess: 'None',
                status: 'pending' // pending, converting, completed
            });
            this.addFileToUI(fileId, file);
        });

        this.toggleView('conversion');
    }

    addFileToUI(fileId, file) {
        const filesList = document.getElementById('filesList');
        const formats = this.getAvailableFormats(file.type, file.name);
        const postProcesses = this.getAvailablePostProcesses(file.type, file.name);

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
            <select class="postprocess-select" data-file-id="${fileId}">
                ${postProcesses.map(pp => `<option value="${pp}">${pp}</option>`).join('')}
            </select>
            <button class="convert-btn" data-file-id="${fileId}" disabled>Convert</button>
            <button class="clear-btn" data-file-id="${fileId}" title="Remove file">×</button>
        `;

        filesList.appendChild(fileItem);

        // Add event listeners
        const formatSelect = fileItem.querySelector('.format-select');
        const postProcessSelect = fileItem.querySelector('.postprocess-select');
        const convertBtn = fileItem.querySelector('.convert-btn');
        const clearBtn = fileItem.querySelector('.clear-btn');

        formatSelect.addEventListener('change', (e) => {
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

        postProcessSelect.addEventListener('change', (e) => {
            const fileData = this.files.get(fileId);
            fileData.selectedPostProcess = e.target.value;

            // Reset completed state when post-process changes
            if (fileData.status === 'completed') {
                fileData.status = 'pending';
                fileItem.classList.remove('completed');
                convertBtn.textContent = 'Convert';
            }
        });

        convertBtn.addEventListener('click', () => {
            // Check if already converted - then download
            const fileData = this.files.get(fileId);
            if (fileData.status === 'completed' && fileData.convertedBlob) {
                this.downloadFile(fileData.convertedBlob, fileData.convertedFilename);
            } else {
                this.convertFile(fileId, false); // false = don't auto-download
            }
        });

        clearBtn.addEventListener('click', () => {
            this.removeFile(fileId);
        });
    }

    removeFile(fileId) {
        // Remove from files map
        this.files.delete(fileId);

        // Remove from UI
        const fileItem = document.getElementById(fileId);
        if (fileItem) {
            fileItem.remove();
        }

        // If no files left, show upload area
        if (this.files.size === 0) {
            this.toggleView('upload');
        }
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

            // Apply post-processing if selected
            if (fileData.selectedPostProcess && fileData.selectedPostProcess !== 'None') {
                result = await this.applyPostProcessing(result.blob, fileData.selectedPostProcess, mimeType, result.filename);
            }

            // Store the converted result
            fileData.convertedBlob = result.blob;
            fileData.convertedFilename = result.filename;

            // Download the file if autoDownload is true
            if (autoDownload) {
                this.downloadFile(result.blob, result.filename);
                convertBtn.textContent = 'Download';
            } else {
                convertBtn.textContent = 'Download';
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

                        case 'LaTeX':
                            // Convert HTML to LaTeX
                            const latexText = this.htmlToLatex(htmlContent, file.name);
                            blob = new Blob([latexText], { type: 'application/x-latex' });
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
            return ['TXT', 'HTML', 'MD', 'LaTeX'];
        }

        if (mimeType.startsWith('image/')) {
            return ['PNG', 'JPG', 'WebP', 'GIF', 'BMP', 'ICO'];
        }
        if (mimeType.startsWith('audio/')) {
            return ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'];
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

    getAvailablePostProcesses(mimeType, filename = '') {
        if (mimeType.startsWith('image/')) {
            return ['None', 'Squarify', 'Grayscale', 'Resize 50%', 'Resize 200%', 'Rotate 90°', 'Rotate 180°', 'Flip Horizontal', 'Flip Vertical', 'Invert Colors'];
        }
        if (this.isDocumentFile(filename) || mimeType.includes('pdf')) {
            return ['None', 'Text Only', 'Remove Formatting'];
        }
        if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
            return ['None'];
        }
        return ['None'];
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
            'AAC': 'audio/aac',
            'MP4': 'video/mp4',
            'WebM': 'video/webm',
            'AVI': 'video/x-msvideo',
            'TXT': 'text/plain',
            'JSON': 'application/json',
            'HTML': 'text/html',
            'MD': 'text/markdown',
            'LaTeX': 'application/x-latex'
        };
        return mimeTypes[format] || 'application/octet-stream';
    }

    // POST-PROCESSING
    async applyPostProcessing(blob, postProcess, mimeType, filename) {
        if (mimeType.startsWith('image/')) {
            return await this.applyImagePostProcessing(blob, postProcess, filename);
        }
        // Document post-processing would go here
        return { blob, filename };
    }

    async applyImagePostProcessing(blob, postProcess, filename) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                // Apply different post-processes
                switch (postProcess) {
                    case 'Squarify':
                        const size = Math.min(width, height);
                        const offsetX = (width - size) / 2;
                        const offsetY = (height - size) / 2;
                        canvas.width = size;
                        canvas.height = size;
                        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
                        break;

                    case 'Grayscale':
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0);
                        const imageData = ctx.getImageData(0, 0, width, height);
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
                            data[i] = data[i + 1] = data[i + 2] = gray;
                        }
                        ctx.putImageData(imageData, 0, 0);
                        break;

                    case 'Resize 50%':
                        canvas.width = width * 0.5;
                        canvas.height = height * 0.5;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        break;

                    case 'Resize 200%':
                        canvas.width = width * 2;
                        canvas.height = height * 2;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        break;

                    case 'Rotate 90°':
                        canvas.width = height;
                        canvas.height = width;
                        ctx.translate(height, 0);
                        ctx.rotate(Math.PI / 2);
                        ctx.drawImage(img, 0, 0);
                        break;

                    case 'Rotate 180°':
                        canvas.width = width;
                        canvas.height = height;
                        ctx.translate(width, height);
                        ctx.rotate(Math.PI);
                        ctx.drawImage(img, 0, 0);
                        break;

                    case 'Flip Horizontal':
                        canvas.width = width;
                        canvas.height = height;
                        ctx.scale(-1, 1);
                        ctx.drawImage(img, -width, 0);
                        break;

                    case 'Flip Vertical':
                        canvas.width = width;
                        canvas.height = height;
                        ctx.scale(1, -1);
                        ctx.drawImage(img, 0, -height);
                        break;

                    case 'Invert Colors':
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0);
                        const invertData = ctx.getImageData(0, 0, width, height);
                        const invertPixels = invertData.data;
                        for (let i = 0; i < invertPixels.length; i += 4) {
                            invertPixels[i] = 255 - invertPixels[i];
                            invertPixels[i + 1] = 255 - invertPixels[i + 1];
                            invertPixels[i + 2] = 255 - invertPixels[i + 2];
                        }
                        ctx.putImageData(invertData, 0, 0);
                        break;

                    default:
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0);
                }

                canvas.toBlob((newBlob) => {
                    URL.revokeObjectURL(url);
                    if (newBlob) {
                        resolve({ blob: newBlob, filename });
                    } else {
                        reject(new Error('Post-processing failed'));
                    }
                }, blob.type);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image for post-processing'));
            };

            img.src = url;
        });
    }

    // HTML to LaTeX conversion
    htmlToLatex(html, title = 'Document') {
        // Convert HTML to LaTeX
        let latex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}

\\title{${this.escapeLatex(title)}}
\\date{}

\\begin{document}

\\maketitle

`;

        // Convert HTML elements to LaTeX
        let content = html
            // Headings
            .replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}\n')
            .replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}\n')
            .replace(/<h3>(.*?)<\/h3>/g, '\\subsubsection{$1}\n')
            // Paragraphs
            .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
            // Lists
            .replace(/<ul>/g, '\\begin{itemize}\n')
            .replace(/<\/ul>/g, '\\end{itemize}\n')
            .replace(/<ol>/g, '\\begin{enumerate}\n')
            .replace(/<\/ol>/g, '\\end{enumerate}\n')
            .replace(/<li>(.*?)<\/li>/g, '\\item $1\n')
            // Text formatting
            .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
            .replace(/<b>(.*?)<\/b>/g, '\\textbf{$1}')
            .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
            .replace(/<i>(.*?)<\/i>/g, '\\textit{$1}')
            .replace(/<u>(.*?)<\/u>/g, '\\underline{$1}')
            // Links
            .replace(/<a href="(.*?)">(.*?)<\/a>/g, '\\href{$1}{$2}')
            // Line breaks
            .replace(/<br\s*\/?>/g, '\\\\\n')
            // Remove remaining HTML tags
            .replace(/<[^>]+>/g, '');

        // Escape LaTeX special characters in content
        content = this.escapeLatex(content);

        latex += content;
        latex += '\n\\end{document}';

        return latex;
    }

    escapeLatex(text) {
        // Don't escape if it already looks like LaTeX commands
        if (text.includes('\\')) return text;

        return text
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/&/g, '\\&')
            .replace(/%/g, '\\%')
            .replace(/\$/g, '\\$')
            .replace(/#/g, '\\#')
            .replace(/_/g, '\\_')
            .replace(/{/g, '\\{')
            .replace(/}/g, '\\}')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
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

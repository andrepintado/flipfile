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
        convertAllBtn.addEventListener('click', async () => {
            convertAllBtn.disabled = true;
            convertAllBtn.classList.add('loading');
            const originalText = convertAllBtn.textContent;
            convertAllBtn.textContent = 'Converting...';

            await this.convertAll(false);

            convertAllBtn.disabled = false;
            convertAllBtn.classList.remove('loading');
            convertAllBtn.textContent = originalText;
        });

        // Convert and Download All button
        convertDownloadBtn.addEventListener('click', async () => {
            convertDownloadBtn.disabled = true;
            convertDownloadBtn.classList.add('loading');
            const originalText = convertDownloadBtn.textContent;
            convertDownloadBtn.textContent = 'Converting...';

            await this.convertAll(true);

            convertDownloadBtn.disabled = false;
            convertDownloadBtn.classList.remove('loading');
            convertDownloadBtn.textContent = originalText;
        });
    }

    handleFiles(fileList) {
        const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit
        const validFiles = [];
        const oversizedFiles = [];

        fileList.forEach(file => {
            if (file.size > MAX_FILE_SIZE) {
                oversizedFiles.push(`${file.name} (${this.formatFileSize(file.size)})`);
            } else {
                validFiles.push(file);
            }
        });

        // Show alert for oversized files
        if (oversizedFiles.length > 0) {
            alert(`The following files exceed the 20MB limit and were not added:\n\n${oversizedFiles.join('\n')}\n\nPlease use smaller files for browser-based conversion.`);
        }

        // Add valid files
        validFiles.forEach(file => {
            const fileId = `file-${this.fileCounter++}`;
            this.files.set(fileId, {
                file: file,
                selectedFormat: null,
                selectedPostProcess: 'No post-process',
                status: 'pending' // pending, converting, completed
            });
            this.addFileToUI(fileId, file);
        });

        if (validFiles.length > 0) {
            this.toggleView('conversion');
        }
    }

    addFileToUI(fileId, file) {
        const filesList = document.getElementById('filesList');
        const formats = this.getAvailableFormats(file.type, file.name);
        const postProcesses = this.getAvailablePostProcesses(file.type, file.name);
        const hasPostProcess = postProcesses.length > 1 || (postProcesses.length === 1 && postProcesses[0] !== 'No post-process');

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = fileId;
        if (!hasPostProcess) {
            fileItem.classList.add('no-postprocess');
        }

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
            ${hasPostProcess ? `<select class="postprocess-select" data-file-id="${fileId}">
                ${postProcesses.map(pp => `<option value="${pp}">${pp}</option>`).join('')}
            </select>` : ''}
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

            // Check if conversion is needed
            this.updateConvertButtonState(fileId, file, convertBtn);

            // Reset completed state when format changes
            if (fileData.status === 'completed') {
                fileData.status = 'pending';
                fileItem.classList.remove('completed');
                convertBtn.textContent = 'Convert';
            }
        });

        if (postProcessSelect) {
            postProcessSelect.addEventListener('change', (e) => {
                const fileData = this.files.get(fileId);
                fileData.selectedPostProcess = e.target.value;

                // Check if conversion is needed
                this.updateConvertButtonState(fileId, file, convertBtn);

                // Reset completed state when post-process changes
                if (fileData.status === 'completed') {
                    fileData.status = 'pending';
                    fileItem.classList.remove('completed');
                    convertBtn.textContent = 'Convert';
                }
            });
        }

        convertBtn.addEventListener('click', async () => {
            // Check if already converted - then download
            const fileData = this.files.get(fileId);
            if (fileData.status === 'completed' && fileData.convertedBlob) {
                // Show loading state during download
                convertBtn.disabled = true;
                convertBtn.classList.add('loading');
                const originalText = convertBtn.textContent;
                convertBtn.textContent = 'Downloading...';

                await this.downloadFile(fileData.convertedBlob, fileData.convertedFilename);

                // Reset button state
                setTimeout(() => {
                    convertBtn.disabled = false;
                    convertBtn.classList.remove('loading');
                    convertBtn.textContent = originalText;
                }, 500);
            } else {
                this.convertFile(fileId, false); // false = don't auto-download
            }
        });

        clearBtn.addEventListener('click', () => {
            this.removeFile(fileId);
        });
    }

    updateConvertButtonState(fileId, file, convertBtn) {
        const fileData = this.files.get(fileId);

        // No format selected - disable button
        if (!fileData.selectedFormat) {
            convertBtn.disabled = true;
            convertBtn.title = '';
            return;
        }

        // Check if source format matches target format
        const sourceFormat = this.getFormatFromMimeType(file.type, file.name);
        const sameFormat = sourceFormat === fileData.selectedFormat;
        const hasPostProcess = fileData.selectedPostProcess && fileData.selectedPostProcess !== 'No post-process';

        // Same format with no post-processing - disable button
        if (sameFormat && !hasPostProcess) {
            convertBtn.disabled = true;
            convertBtn.title = 'No conversion needed - same format';
        } else {
            // Different format or has post-processing - enable button
            convertBtn.disabled = false;
            convertBtn.title = '';
        }
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
        convertBtn.classList.add('loading');
        convertBtn.textContent = 'Converting...';
        select.disabled = true;

        try {
            let result;
            const mimeType = fileData.file.type;
            const fileName = fileData.file.name;
            const targetFormat = fileData.selectedFormat;
            const hasPostProcess = fileData.selectedPostProcess && fileData.selectedPostProcess !== 'No post-process';

            // Check if source format matches target format
            const sourceFormat = this.getFormatFromMimeType(mimeType, fileName);
            const sameFormat = sourceFormat === targetFormat;

            // Optimize: if same format and no post-processing, return original
            if (sameFormat && !hasPostProcess) {
                result = {
                    blob: fileData.file,
                    filename: fileName
                };
            }
            // If same format but has post-processing, skip conversion and apply post-process directly
            else if (sameFormat && hasPostProcess) {
                result = await this.applyPostProcessing(fileData.file, fileData.selectedPostProcess, mimeType, fileName);
            }
            // Different format, do conversion
            else {
                // Special handling for PDF conversion
                if (targetFormat === 'PDF') {
                    result = await this.convertToPDF(fileData.file, mimeType, fileName);
                } else if (mimeType.startsWith('image/')) {
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

                // Apply post-processing if selected (only if format changed)
                if (hasPostProcess) {
                    result = await this.applyPostProcessing(result.blob, fileData.selectedPostProcess, mimeType, result.filename);
                }
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
            convertBtn.classList.remove('loading');
            select.disabled = false;

        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Conversion failed: ${error.message}`);

            // Reset UI state
            fileData.status = 'pending';
            fileItem.classList.remove('converting');
            convertBtn.disabled = false;
            convertBtn.classList.remove('loading');
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

    async convertToPDF(file, mimeType, fileName) {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('PDF library not loaded');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const doc = new jsPDF();
                    const filename = this.changeFileExtension(file.name, 'PDF');

                    if (mimeType.startsWith('image/')) {
                        // Convert image to PDF
                        const img = new Image();
                        img.onload = () => {
                            const imgWidth = img.width;
                            const imgHeight = img.height;
                            const pageWidth = doc.internal.pageSize.getWidth();
                            const pageHeight = doc.internal.pageSize.getHeight();

                            // Calculate scaling to fit page while maintaining aspect ratio
                            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                            const scaledWidth = imgWidth * ratio;
                            const scaledHeight = imgHeight * ratio;

                            // Center the image
                            const x = (pageWidth - scaledWidth) / 2;
                            const y = (pageHeight - scaledHeight) / 2;

                            doc.addImage(img, 'JPEG', x, y, scaledWidth, scaledHeight);
                            const pdfBlob = doc.output('blob');
                            resolve({ blob: pdfBlob, filename });
                        };
                        img.onerror = () => reject(new Error('Failed to load image for PDF conversion'));
                        img.src = e.target.result;

                    } else if (this.isDocumentFile(fileName)) {
                        // Convert DOC/DOCX to text first, then to PDF
                        if (!window.mammoth) {
                            throw new Error('Document conversion library not loaded');
                        }
                        const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                        const text = result.value;

                        // Add text to PDF with word wrapping
                        const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 20);
                        doc.text(lines, 10, 10);

                        const pdfBlob = doc.output('blob');
                        resolve({ blob: pdfBlob, filename });

                    } else {
                        // Convert text to PDF
                        const text = e.target.result;
                        const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 20);
                        doc.text(lines, 10, 10);

                        const pdfBlob = doc.output('blob');
                        resolve({ blob: pdfBlob, filename });
                    }

                } catch (error) {
                    reject(new Error(`PDF conversion failed: ${error.message}`));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file for PDF conversion'));

            if (mimeType.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else if (this.isDocumentFile(fileName)) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
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
            return ['TXT', 'HTML', 'MD', 'LaTeX', 'PDF'];
        }

        if (mimeType.startsWith('image/')) {
            return ['PNG', 'JPG', 'WebP', 'GIF', 'BMP', 'ICO', 'PDF'];
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
            return ['TXT', 'JSON', 'HTML', 'MD', 'PDF'];
        }

        // Default options
        return ['TXT'];
    }

    getAvailablePostProcesses(mimeType, filename = '') {
        if (mimeType.startsWith('image/')) {
            return ['No post-process', 'Compress', 'Make Squared', 'Grayscale', 'Resize 50%', 'Resize 200%', 'Rotate 90°', 'Rotate 180°', 'Flip Horizontal', 'Flip Vertical'];
        }
        if (this.isDocumentFile(filename) || mimeType.includes('pdf')) {
            return ['No post-process', 'Text Only', 'Remove Formatting'];
        }
        if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
            return ['No post-process'];
        }
        return ['No post-process'];
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

    getFormatFromMimeType(mimeType, filename = '') {
        // Check for document files by extension
        if (this.isDocumentFile(filename)) {
            return null; // DOC/DOCX don't match back to themselves
        }

        const formatMap = {
            'image/png': 'PNG',
            'image/jpeg': 'JPG',
            'image/jpg': 'JPG',
            'image/webp': 'WebP',
            'image/gif': 'GIF',
            'image/bmp': 'BMP',
            'image/x-icon': 'ICO',
            'audio/mpeg': 'MP3',
            'audio/wav': 'WAV',
            'audio/ogg': 'OGG',
            'audio/mp4': 'M4A',
            'audio/aac': 'AAC',
            'video/mp4': 'MP4',
            'video/webm': 'WebM',
            'video/x-msvideo': 'AVI',
            'text/plain': 'TXT',
            'application/json': 'JSON',
            'text/html': 'HTML',
            'text/markdown': 'MD'
        };
        return formatMap[mimeType] || null;
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
                let quality = 0.92; // Default quality
                switch (postProcess) {
                    case 'Compress':
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0);
                        quality = 0.6; // Reduced quality for compression
                        break;

                    case 'Make Squared':
                        const size = Math.max(width, height);
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
                }, blob.type, quality);
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

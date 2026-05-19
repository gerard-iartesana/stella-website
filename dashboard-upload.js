// ============================================
// Upload Module — Supabase Storage
// Roots by Stella Dashboard
// ============================================

const UploadModule = {
    BUCKET: 'imagenes',

    getPublicUrl(filePath) {
        return `${SUPABASE_URL}/storage/v1/object/public/${this.BUCKET}/${filePath}`;
    },

    async uploadFile(file, folder) {
        if (!supabaseClient) throw new Error('Supabase no conectado');
        const ext = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { data, error } = await supabaseClient.storage
            .from(this.BUCKET)
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;
        return this.getPublicUrl(data.path);
    },

    async uploadMultiple(files, folder, onProgress) {
        const urls = [];
        for (let i = 0; i < files.length; i++) {
            const url = await this.uploadFile(files[i], folder);
            urls.push(url);
            if (onProgress) onProgress(i + 1, files.length);
        }
        return urls;
    },

    setupZone(zoneId, fileInputId, previewsId, progressId, fillId, textId, opts = {}) {
        const zone = document.getElementById(zoneId);
        const fileInput = document.getElementById(fileInputId);
        const previews = document.getElementById(previewsId);
        if (!zone || !fileInput) return;

        // Store uploaded URLs on the zone element
        zone._uploadedUrls = [];
        zone._multiple = opts.multiple || false;
        zone._folder = opts.folder || 'general';

        // Click to select
        zone.addEventListener('click', (e) => {
            if (e.target.closest('.remove-preview')) return;
            fileInput.click();
        });

        // Drag & drop
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files, zone, previews, progressId, fillId, textId);
        });

        // File input change
        fileInput.addEventListener('change', () => {
            this.handleFiles(fileInput.files, zone, previews, progressId, fillId, textId);
            fileInput.value = '';
        });
    },

    async handleFiles(files, zone, previews, progressId, fillId, textId) {
        if (!files || files.length === 0) return;

        const progressEl = document.getElementById(progressId);
        const fillEl = document.getElementById(fillId);
        const textEl = document.getElementById(textId);

        if (!zone._multiple) {
            zone._uploadedUrls = [];
            previews.innerHTML = '';
        }

        if (supabaseClient) {
            // Upload to Supabase Storage
            progressEl.style.display = 'block';
            fillEl.style.width = '0%';
            textEl.textContent = 'Subiendo...';

            try {
                const urls = await this.uploadMultiple(Array.from(files), zone._folder, (done, total) => {
                    const pct = Math.round((done / total) * 100);
                    fillEl.style.width = pct + '%';
                    textEl.textContent = `${done}/${total} subidas`;
                });
                zone._uploadedUrls.push(...urls);
                textEl.textContent = '✓ Subida completada';
                setTimeout(() => { progressEl.style.display = 'none'; }, 2000);
            } catch (err) {
                textEl.textContent = '✗ Error: ' + err.message;
                console.error('Upload error:', err);
                return;
            }
        } else {
            // Local mode: use local file paths
            for (const file of files) {
                zone._uploadedUrls.push(`./imagenes/${file.name}`);
            }
        }

        // Render previews
        this.renderPreviews(zone, previews);
    },

    renderPreviews(zone, previews) {
        previews.innerHTML = '';
        zone._uploadedUrls.forEach((url, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'preview-thumb';
            thumb.innerHTML = `
                <img src="${url}" alt="Preview">
                <button class="remove-preview" data-index="${i}" title="Eliminar">✕</button>
            `;
            thumb.querySelector('.remove-preview').addEventListener('click', (e) => {
                e.stopPropagation();
                zone._uploadedUrls.splice(i, 1);
                this.renderPreviews(zone, previews);
            });
            previews.appendChild(thumb);
        });
    },

    getUrls(zoneId) {
        const zone = document.getElementById(zoneId);
        return zone ? zone._uploadedUrls || [] : [];
    },

    setUrls(zoneId, previewsId, urls) {
        const zone = document.getElementById(zoneId);
        const previews = document.getElementById(previewsId);
        if (!zone) return;
        zone._uploadedUrls = [...urls];
        if (previews) this.renderPreviews(zone, previews);
    },

    clearZone(zoneId, previewsId) {
        const zone = document.getElementById(zoneId);
        const previews = document.getElementById(previewsId);
        if (zone) zone._uploadedUrls = [];
        if (previews) previews.innerHTML = '';
    }
};

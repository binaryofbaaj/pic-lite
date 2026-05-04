/**
 * PIC-lite | Ultimate Pro Camera Engine
 * High-Performance Implementation with Cyber-Lux HUD
 */

class PicLiteEngine {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        this.currentFacingMode = 'user';
        this.activeFilter = 'NORMAL';
        this.stream = null;
        this.captures = [];
        
        // Final Preference State
        this.prefs = {
            hud: true,
            highRes: true,
            haptics: true
        };
        
        this.filters = [
            { id: 'NORMAL', label: 'Raw', icon: 'camera' },
            { id: 'GRAYSCALE', label: 'B&W', icon: 'zap' },
            { id: 'SEPIA', label: 'Retro', icon: 'sun' },
            { id: 'VIVID', label: 'Pop', icon: 'palette' },
            { id: 'NOIR', label: 'Film', icon: 'moon' },
            { id: 'WARM', label: 'Heat', icon: 'coffee' },
            { id: 'COOL', label: 'Icy', icon: 'wind' },
            { id: 'GLITCH', label: 'Glitch', icon: 'cpu' },
            { id: 'MIRROR', label: 'Mirror', icon: 'columns' },
            { id: 'REVERSE', label: 'Reverse', icon: 'repeat' },
            { id: 'VIGNETTE', label: 'Focus', icon: 'target' },
            { id: 'PIXELATE', label: 'Pixel', icon: 'grid' },
            { id: 'NEON', label: 'Neon', icon: 'activity' }
        ];

        this.init();
    }

    async init() {
        // Cinematic Startup: Remove loader after 2 seconds
        setTimeout(() => document.body.classList.remove('loading'), 2000);
        
        try {
            this.setupEventListeners();
            this.renderCarousel();
            await this.startCamera();
            this.renderLoop();
            
            if (window.lucide) lucide.createIcons();
            window.addEventListener('resize', () => this.resizeCanvas());
        } catch (err) {
            console.error("PIC-lite Engine Error:", err);
            document.getElementById('error-screen').classList.remove('hidden');
        }
    }

    setupEventListeners() {
        // Global Close Shortcut
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });

        // Main Interaction Set
        document.getElementById('capture-btn').addEventListener('click', () => this.capturePhoto());
        
        document.getElementById('gallery-btn').addEventListener('click', () => {
            this.vibrate();
            if (this.captures.length === 0) {
                this.showToast("Archive is empty");
            } else {
                this.toggleGallery(true);
            }
        });

        document.getElementById('settings-btn').addEventListener('click', () => { this.vibrate(); this.toggleSettings(true); });
        document.getElementById('flip-btn').addEventListener('click', () => { this.vibrate(30); this.switchCamera(); });
        document.getElementById('close-settings').addEventListener('click', () => { this.vibrate(); this.toggleSettings(false); });
        document.getElementById('close-photo').addEventListener('click', () => { this.vibrate(); this.togglePhotoView(false); });
        document.getElementById('close-gallery').addEventListener('click', () => { this.vibrate(); this.toggleGallery(false); });
        document.getElementById('retry-btn').addEventListener('click', () => this.startCamera());
        document.getElementById('zap-btn').addEventListener('click', () => this.pickRandomFilter());

        // Mode Switching Logic
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.vibrate(20);
                this.mode = e.target.dataset.mode;
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.body.classList.toggle('mode-video', this.mode === 'video');
            });
        });

        // Review Actions
        document.getElementById('save-desktop-btn').addEventListener('click', () => { this.vibrate(); this.downloadLast(); });
        document.getElementById('share-wa-btn').addEventListener('click', () => { this.vibrate(); this.shareToWhatsApp(); });
        
        // Preference Handlers
        document.getElementById('toggle-hud').addEventListener('change', (e) => {
            this.vibrate();
            this.prefs.hud = e.target.checked;
            document.querySelector('.hud-layer').style.opacity = this.prefs.hud ? '1' : '0';
        });

        document.getElementById('toggle-res').addEventListener('change', (e) => {
            this.vibrate();
            this.prefs.highRes = e.target.checked;
            this.startCamera(); // Hot-swap resolution
        });

        document.getElementById('toggle-haptics').addEventListener('change', (e) => {
            this.prefs.haptics = e.target.checked;
            this.vibrate(20);
        });

        document.getElementById('toggle-filters-btn').addEventListener('click', (e) => {
            this.vibrate();
            const wrapper = document.querySelector('.carousel-wrapper');
            const isHidden = wrapper.classList.toggle('hidden-ui');
            const icon = isHidden ? 'eye-off' : 'eye';
            e.currentTarget.innerHTML = `<i data-lucide="${icon}"></i>`;
            if (window.lucide) lucide.createIcons();
        });

        // Carousel Snapping Engine
        const carousel = document.getElementById('filter-carousel');
        let isScrolling;
        carousel.addEventListener('scroll', () => {
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(() => this.handleCarouselSnap(), 150);
        }, { passive: true });
    }

    vibrate(pattern = 15) {
        if (this.prefs.haptics && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    switchCamera() {
        this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        this.startCamera();
        this.showToast(`SWITCHED TO ${this.currentFacingMode === 'user' ? 'FRONT' : 'BACK'} SENSOR`);
    }

    async startCamera() {
        try {
            if (this.stream) this.stream.getTracks().forEach(track => track.stop());
            
            const width = this.prefs.highRes ? { ideal: 3840 } : { ideal: 1280 };
            const height = this.prefs.highRes ? { ideal: 2160 } : { ideal: 720 };
            
            const constraints = {
                video: { facingMode: this.currentFacingMode, width, height },
                audio: true // Enabled hardware microphone
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            await this.video.play();
            document.getElementById('error-screen').classList.add('hidden');
            this.resizeCanvas();
        } catch (err) {
            console.error("Camera Handshake Failed:", err);
            // Fallback to video-only if audio is denied
            if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
                this.startCameraVideoOnly();
            } else {
                document.getElementById('error-screen').classList.remove('hidden');
            }
        }
    }

    async startCameraVideoOnly() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.stream = stream;
        this.video.srcObject = stream;
        await this.video.play();
        document.getElementById('error-screen').classList.add('hidden');
        this.resizeCanvas();
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }

    renderCarousel() {
        const carousel = document.getElementById('filter-carousel');
        carousel.innerHTML = '';
        this.filters.forEach(filter => {
            const item = document.createElement('div');
            item.className = `filter-item ${filter.id === this.activeFilter ? 'active' : ''}`;
            item.dataset.id = filter.id;
            item.innerHTML = `
                <div class="filter-thumb"><i data-lucide="${filter.icon}"></i></div>
                <div class="filter-label">${filter.label}</div>
            `;
            item.onclick = () => { this.vibrate(10); this.setFilter(filter.id, item); };
            carousel.appendChild(item);
        });
        if (window.lucide) lucide.createIcons();
    }

    setFilter(id, element) {
        if (this.activeFilter === id) return;
        this.activeFilter = id;
        document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    handleCarouselSnap() {
        const carousel = document.getElementById('filter-carousel');
        const center = carousel.scrollLeft + carousel.offsetWidth / 2;
        let closest = null; let minDiff = Infinity;
        document.querySelectorAll('.filter-item').forEach(item => {
            const itemCenter = item.offsetLeft + item.offsetWidth / 2;
            const diff = Math.abs(center - itemCenter);
            if (diff < minDiff) { minDiff = diff; closest = item; }
        });
        if (closest && closest.dataset.id !== this.activeFilter) this.setFilter(closest.dataset.id, closest);
    }

    pickRandomFilter() {
        this.vibrate(25);
        const randomIndex = Math.floor(Math.random() * this.filters.length);
        const randomFilter = this.filters[randomIndex];
        const element = document.querySelector(`.filter-item[data-id="${randomFilter.id}"]`);
        if (element) {
            this.setFilter(randomFilter.id, element);
            this.showToast(`ZAPPED: ${randomFilter.label}`);
        }
    }

    renderLoop() {
        this.draw();
        requestAnimationFrame(() => this.renderLoop());
    }

    draw() {
        if (this.video.paused || this.video.ended) return;
        const cw = this.canvas.width; const ch = this.canvas.height;
        this.ctx.save();
        
        // Handle mirroring logic
        let sm = this.currentFacingMode === 'user';
        if (this.activeFilter === 'REVERSE') sm = !sm;
        if (sm) { this.ctx.translate(cw, 0); this.ctx.scale(-1, 1); }
        
        this.applyContextFilters();
        
        const vw = this.video.videoWidth; const vh = this.video.videoHeight;
        const vr = vw / vh; const cr = cw / ch;
        let sx, sy, sw, sh;
        
        if (cr > vr) { sw = vw; sh = vw / cr; sx = 0; sy = (vh - sh) / 2; }
        else { sw = vh * cr; sh = vh; sx = (vw - sw) / 2; sy = 0; }
        
        this.ctx.drawImage(this.video, sx, sy, sw, sh, 0, 0, cw, ch);
        this.ctx.restore();
        this.applyPostProcessing(cw, ch);
    }

    applyContextFilters() {
        let f = 'none';
        switch (this.activeFilter) {
            case 'GRAYSCALE': f = 'grayscale(100%)'; break;
            case 'SEPIA': f = 'sepia(100%)'; break;
            case 'VIVID': f = 'saturate(180%) brightness(110%)'; break;
            case 'NOIR': f = 'grayscale(100%) contrast(150%) brightness(80%)'; break;
            case 'WARM': f = 'sepia(30%) saturate(140%) hue-rotate(-10deg)'; break;
            case 'COOL': f = 'saturate(110%) hue-rotate(180deg) brightness(90%)'; break;
            case 'NEON': f = 'brightness(150%) contrast(120%) saturate(200%)'; break;
        }
        this.ctx.filter = f;
    }

    applyPostProcessing(w, h) {
        if (this.activeFilter === 'MIRROR') {
            this.ctx.drawImage(this.canvas, 0, 0, w/2, h, 0, 0, w/2, h);
            this.ctx.save(); this.ctx.translate(w, 0); this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.canvas, 0, 0, w/2, h, 0, 0, w/2, h);
            this.ctx.restore();
        } else if (this.activeFilter === 'GLITCH' && Math.random() > 0.85) {
            this.ctx.drawImage(this.canvas, (Math.random()-0.5)*40, 0);
            this.ctx.fillStyle = `rgba(255,0,120,0.15)`; this.ctx.fillRect(0,0,w,h);
        } else if (this.activeFilter === 'VIGNETTE') {
            const grad = this.ctx.createRadialGradient(w/2, h/2, w/4, w/2, h/2, w/0.8);
            grad.addColorStop(0, 'transparent'); grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            this.ctx.fillStyle = grad; this.ctx.fillRect(0, 0, w, h);
        } else if (this.activeFilter === 'PIXELATE') {
            const size = 20; const temp = document.createElement('canvas');
            temp.width = w/size; temp.height = h/size;
            const tCtx = temp.getContext('2d'); tCtx.imageSmoothingEnabled = false;
            tCtx.drawImage(this.canvas, 0, 0, w/size, h/size);
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(temp, 0, 0, w/size, h/size, 0, 0, w, h);
        } else if (this.activeFilter === 'NEON') {
            this.ctx.globalCompositeOperation = 'overlay'; this.ctx.strokeStyle = '#00f5ff'; this.ctx.lineWidth = 4;
            this.ctx.strokeRect(0, 0, w, h); this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fillStyle = 'rgba(0, 245, 255, 0.1)'; this.ctx.fillRect(0,0,w,h);
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    capturePhoto() {
        if (this.mode === 'video') {
            this.toggleRecording();
            return;
        }

        this.vibrate([25, 10, 25]); // Mechanical shutter feel
        const flash = document.getElementById('flash');
        flash.classList.add('flash-active');
        setTimeout(() => flash.classList.remove('flash-active'), 400);
        
        const dataURL = this.canvas.toDataURL('image/png');
        this.captures.unshift({ type: 'image', url: dataURL });
        
        const preview = document.querySelector('.gallery-preview');
        preview.style.backgroundImage = `url(${dataURL})`;
        preview.style.opacity = '1';
        
        this.updateGallery();
        document.getElementById('detail-img').src = dataURL;
        document.getElementById('detail-img').classList.remove('hidden');
        const vid = document.getElementById('detail-video');
        if (vid) vid.classList.add('hidden');
        this.togglePhotoView(true);
    }

    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        this.vibrate([40, 20]);
        this.isRecording = true;
        this.recordedChunks = [];
        
        // Merge Filtered Video + Hardware Audio
        const videoStream = this.canvas.captureStream(30);
        const audioTrack = this.stream.getAudioTracks()[0];
        
        const combinedStream = new MediaStream([videoStream.getVideoTracks()[0]]);
        if (audioTrack) combinedStream.addTrack(audioTrack);
        
        this.mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.recordedChunks.push(e.data);
        };
        
        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            this.saveVideo(url);
        };
        
        this.mediaRecorder.start();
        document.body.classList.add('recording');
        document.getElementById('recording-hud').classList.remove('hidden');
        this.startTimer();
    }

    stopRecording() {
        this.vibrate([20, 40]);
        this.isRecording = false;
        this.mediaRecorder.stop();
        document.body.classList.remove('recording');
        document.getElementById('recording-hud').classList.add('hidden');
        this.stopTimer();
    }

    startTimer() {
        this.recStartTime = Date.now();
        this.recInterval = setInterval(() => {
            const delta = Date.now() - this.recStartTime;
            const sec = Math.floor(delta / 1000) % 60;
            const min = Math.floor(delta / 60000);
            document.getElementById('rec-timer').textContent = 
                `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.recInterval);
        document.getElementById('rec-timer').textContent = "00:00";
    }

    saveVideo(url) {
        this.captures.unshift({ type: 'video', url });
        const preview = document.querySelector('.gallery-preview');
        preview.style.backgroundImage = `url(${this.canvas.toDataURL()})`;
        preview.style.opacity = '1';
        this.updateGallery();
        
        // Show video preview
        document.getElementById('detail-img').classList.add('hidden');
        let videoPreview = document.getElementById('detail-video');
        if (!videoPreview) {
            videoPreview = document.createElement('video');
            videoPreview.id = 'detail-video';
            videoPreview.controls = true;
            videoPreview.autoplay = true;
            document.querySelector('.photo-card').appendChild(videoPreview);
        }
        videoPreview.classList.remove('hidden');
        videoPreview.src = url;
        this.togglePhotoView(true);
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.querySelector('span').textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }

    async shareToWhatsApp() {
        const last = document.getElementById('detail-img').src;
        if (!last) return;
        if (navigator.share) {
            try {
                const blob = await (await fetch(last)).blob();
                const file = new File([blob], `pic_lite_snap.png`, { type: 'image/png' });
                await navigator.share({ files: [file], title: 'PIC-lite Snap' });
            } catch (err) { this.fallbackWhatsApp(); }
        } else { this.fallbackWhatsApp(); }
    }

    fallbackWhatsApp() { window.open(`https://api.whatsapp.com/send?text=Check my snap from PIC-lite!`, '_blank'); }

    downloadLast() {
        const lastImg = document.getElementById('detail-img').src;
        const lastVid = document.getElementById('detail-video')?.src;
        const url = !document.getElementById('detail-img').classList.contains('hidden') ? lastImg : lastVid;
        if (!url) return;
        const link = document.createElement('a'); link.href = url;
        link.download = `pic_lite_snap_${Date.now()}.${lastVid && url === lastVid ? 'webm' : 'png'}`; 
        link.click();
    }

    updateGallery() {
        const grid = document.getElementById('gallery-grid'); grid.innerHTML = '';
        this.captures.forEach(item => {
            const img = document.createElement('div'); img.className = 'gallery-item';
            if (item.type === 'video') {
                img.classList.add('video-thumb');
                img.innerHTML = '<i data-lucide="play-circle"></i>';
            }
            img.style.backgroundImage = `url(${item.type === 'video' ? '' : item.url})`;
            img.onclick = () => { 
                this.vibrate(10);
                if (item.type === 'image') {
                    document.getElementById('detail-img').src = item.url;
                    document.getElementById('detail-img').classList.remove('hidden');
                    if (document.getElementById('detail-video')) document.getElementById('detail-video').classList.add('hidden');
                } else {
                    document.getElementById('detail-img').classList.add('hidden');
                    let vid = document.getElementById('detail-video');
                    if (!vid) {
                        vid = document.createElement('video'); vid.id = 'detail-video'; vid.controls = true;
                        document.querySelector('.photo-card').appendChild(vid);
                    }
                    vid.src = item.url; vid.classList.remove('hidden'); vid.play();
                }
                this.toggleGallery(false);
                this.togglePhotoView(true); 
            };
            grid.appendChild(img);
        });
        if (window.lucide) lucide.createIcons();
    }

    closeAllModals() {
        this.toggleSettings(false);
        this.togglePhotoView(false);
        this.toggleGallery(false);
    }

    toggleSettings(show) { this._toggleElement('settings-modal', show); }
    togglePhotoView(show) { this._toggleElement('photo-view', show); }
    toggleGallery(show) { this._toggleElement('gallery-overlay', show); }

    _toggleElement(id, show) {
        const el = document.getElementById(id);
        if (!el) return;
        if (show) {
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('visible'), 20);
        } else {
            el.classList.remove('visible');
            setTimeout(() => el.classList.add('hidden'), 600);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => { new PicLiteEngine(); });

document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================================================
    // 1. WEB AUDIO API SYNTHESIZER SOUND EFFECTS (ZERO EXTERNAL FILES)
    // ===================================================================
    let sfxEnabled = true;
    let audioCtx = null;

    const playBlip = (freq = 800, type = 'sine', duration = 0.04) => {
        if (!sfxEnabled) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context fallback
        }
    };

    const sfxBtn = document.getElementById('sfx-toggle');
    const sfxIcon = document.getElementById('sfx-icon');
    const sfxLabel = document.getElementById('sfx-label');

    if (sfxBtn) {
        sfxBtn.addEventListener('click', () => {
            sfxEnabled = !sfxEnabled;
            sfxLabel.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: OFF';
            sfxIcon.className = sfxEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            playBlip(600, 'triangle', 0.05);
        });
    }

    // Play blip on interactive buttons & cards
    document.querySelectorAll('.bento-card, .filter-tag, .theme-btn, .brutal-btn, .modal-btn').forEach(elem => {
        elem.addEventListener('mouseenter', () => playBlip(900, 'sine', 0.03));
        elem.addEventListener('click', () => playBlip(450, 'square', 0.05));
    });

    // ===================================================================
    // 2. THEME SWITCHER SYSTEM (OBSIDIAN, AMBER, EMERALD, COBALT)
    // ===================================================================
    const themeButtons = document.querySelectorAll('[data-set-theme]');
    const savedTheme = localStorage.getItem('fatah_theme') || 'obsidian';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeButtons.forEach(btn => {
        if (btn.getAttribute('data-set-theme') === savedTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-set-theme');
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('fatah_theme', theme);
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ===================================================================
    // 3. REAL-TIME JAKARTA CLOCK & DATE
    // ===================================================================
    const updateClock = () => {
        const now = new Date();
        const timeOptions = {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const timeString = new Intl.DateTimeFormat('id-ID', timeOptions).format(now);
        const clockElem = document.getElementById('clock-time');
        if (clockElem) clockElem.textContent = timeString.replace(/\./g, ':');

        const dateOptions = {
            timeZone: 'Asia/Jakarta',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const dateString = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
        const dateElem = document.getElementById('clock-date');
        if (dateElem) dateElem.textContent = dateString;
    };

    updateClock();
    setInterval(updateClock, 1000);

    // ===================================================================
    // 4. INTERACTIVE CATEGORY FILTERS
    // ===================================================================
    const filterButtons = document.querySelectorAll('.filter-tag');
    const projectCards = document.querySelectorAll('.card-project');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden-card');
                } else {
                    card.classList.add('hidden-card');
                }
            });
        });
    });

    // ===================================================================
    // 5. UPTIME KUMA HEARTBEAT & LATENCY CHART VISUALIZER
    // ===================================================================
    const uptimeContainer = document.getElementById('uptime-container');

    const renderUptimeCharts = (services) => {
        if (!uptimeContainer || !Array.isArray(services)) return;

        uptimeContainer.innerHTML = services.map(s => {
            const isOnline = s.status === 'online';
            const history = Array.isArray(s.history) && s.history.length > 0
                ? s.history
                : Array(20).fill({ status: isOnline ? 'up' : 'down', ping: 15 });

            // Generate 20 heartbeat bars
            const barsHtml = history.map(h => {
                const barClass = h.status === 'up' ? 'hb-bar' : 'hb-bar down';
                return `<div class="${barClass}" title="Latency: ${h.ping}ms (${h.status})"></div>`;
            }).join('');

            return `
                <div class="service-chart-card">
                    <div class="service-chart-top">
                        <span class="service-chart-name">${escapeHtml(s.name)}</span>
                        <span class="service-chart-ping">${escapeHtml(s.avgPing || s.ping || 'OK')}</span>
                    </div>
                    <div class="heartbeat-bar-row">
                        ${barsHtml}
                    </div>
                    <div class="chart-meta-row">
                        <span>24h Uptime: ${escapeHtml(s.uptime24h || '100%')}</span>
                        <span>STATUS: ${isOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    const fetchUptimeData = async () => {
        try {
            const res = await fetch('/api/status-stream');
            if (res.ok) {
                const data = await res.json();
                if (data.services) {
                    renderUptimeCharts(data.services);
                }
            }
        } catch (e) {
            console.error('[Uptime Fetch Error]', e);
        }
    };

    fetchUptimeData();
    setInterval(fetchUptimeData, 10000);

    // ===================================================================
    // 6. BRUTALIST PROJECT DETAIL MODAL OVERLAY DATA DICTIONARY
    // ===================================================================
    const projectDetails = {
        'modal-gateway': {
            badge: '[PROJECT_INSPECT // 02]',
            title: 'FATAH Gateway',
            desc: 'Portal tautan pribadi ultra-cepat dan responsif dengan React 18, Vite, GSAP 3D tilt interaction, Glassmorphism CSS, & Sveltia CMS serverless OAuth.',
            demo: 'https://fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/gateway'
        },
        'modal-blog': {
            badge: '[PROJECT_INSPECT // 03]',
            title: 'fmr.blog Platform',
            desc: 'Blog pribadi & galeri portofolio interaktif berkinerja tinggi berbasis Astro 5, TypeScript, React 19, & Cloudflare Pages.',
            demo: 'https://blog.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/blog'
        },
        'modal-portfolio': {
            badge: '[PROJECT_INSPECT // 04]',
            title: 'IT Lab & NSA Portfolio',
            desc: 'Portofolio pribadi berbasis Astro 5 & Google Sheets Headless CMS untuk mengarsip laboratorium IT Network, Server, & otomatisasi AI (Juara 1 LKS IT NSA 2026).',
            demo: 'https://fatahmr.my.id',
            repo: 'https://github.com/fatahilah-mr/portfolio'
        },
        'modal-arifin': {
            badge: '[PROJECT_INSPECT // 05]',
            title: 'Chef Arifin Culinary Portfolio',
            desc: 'Platform portofolio digital mobile-first untuk chef & professional cook Arifin Prasetyo (React 19, TanStack Router, Tailwind CSS 4).',
            demo: 'https://arifin.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/arifin-prasetyo-portofolio'
        },
        'modal-kwettiau': {
            badge: '[PROJECT_INSPECT // 06]',
            title: 'Kwettiau Setia Wati Portfolio',
            desc: 'Website portofolio interaktif bertema pink pastel untuk Setia Wati (React 19, Motion, Lucide React).',
            demo: 'https://kwettiau.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/web-setia-wati'
        },
        'modal-ayom': {
            badge: '[PROJECT_INSPECT // 07]',
            title: 'PERISAI Ayom Temon',
            desc: 'Platform digital pengaduan anonim & penanganan cepat kekerasan perempuan dan anak (PPA) Kapanewon Temon berbasis Next.js 16, Supabase, Google Gemini 2.5 Flash, & Leaflet GIS.',
            demo: 'https://ayom-temon.vercel.app',
            repo: 'https://github.com/temonkec-cpu/AYOM-TEMON'
        },
        'modal-gis': {
            badge: '[PROJECT_INSPECT // 08]',
            title: 'PERISAI Temon GIS',
            desc: 'Platform pengaduan publik dengan triase AI Google Gemini 2.0 Flash (1-3 detik), notifikasi email instan, & peta interaktif GIS 15 Kalurahan.',
            demo: 'https://perisai-media-sosial.vercel.app',
            repo: 'https://github.com/temonkec-cpu/Media-Sosial'
        },
        'modal-9router': {
            badge: '[PROJECT_INSPECT // 09]',
            title: '9Router AI Gateway',
            desc: 'Multi-gateway AI router OpenAI/Claude/Groq/Ollama dengan SSE streaming engine & dashboard publik topologi node.',
            demo: 'https://9router.fatah.web.id/public-usage',
            repo: 'https://9router.fatah.web.id'
        },
        'modal-uptime': {
            badge: '[PROJECT_INSPECT // 10]',
            title: 'Uptime Kuma Status Page',
            desc: 'Platform pemantauan kesehatan server, endpoint API, & bot 24/7 real-time dengan notifikasi push ke Telegram.',
            demo: 'https://status.fatah.web.id',
            repo: 'https://status.fatah.web.id'
        }
    };

    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalBadge = document.getElementById('modal-badge');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalDemoBtn = document.getElementById('modal-demo-btn');
    const modalRepoBtn = document.getElementById('modal-repo-btn');

    document.querySelectorAll('[data-modal]').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-modal');
            const data = projectDetails[key];
            if (data && modalOverlay) {
                modalBadge.textContent = data.badge;
                modalTitle.textContent = data.title;
                modalBody.textContent = data.desc;
                modalDemoBtn.setAttribute('href', data.demo);
                modalRepoBtn.setAttribute('href', data.repo);
                modalOverlay.classList.add('active');
                modalOverlay.setAttribute('aria-hidden', 'false');
                playBlip(700, 'sine', 0.05);
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.setAttribute('aria-hidden', 'true');
            playBlip(350, 'sine', 0.03);
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                modalOverlay.setAttribute('aria-hidden', 'true');
            }
        });
    }
});

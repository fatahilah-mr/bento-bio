document.addEventListener('DOMContentLoaded', () => {
    
    const chartInstances = {};

    // 1. INTERACTIVE CATEGORY FILTERS
    const filterButtons = document.querySelectorAll('.filter-btn');
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

    // 2. REAL-TIME JAKARTA CLOCK & DATE
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

    // 3. SVG SPEEDOMETER DIAL GENERATOR
    const generateSpeedometerSvg = (pingMs, isOnline) => {
        const numericPing = typeof pingMs === 'number' ? pingMs : parseInt(pingMs) || 25;
        const percentage = Math.min(100, Math.max(5, (numericPing / 2000) * 100));
        const strokeDash = (percentage / 100) * 126;

        const color = !isOnline ? '#f43f5e' : (numericPing < 200 ? '#10b981' : numericPing < 2000 ? '#f59e0b' : '#f43f5e');

        return `
            <svg class="speedometer-svg" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="22" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-dasharray="138" stroke-dashoffset="35" stroke-linecap="round" />
                <circle cx="30" cy="30" r="22" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="${strokeDash} 138" stroke-linecap="round" />
                <text x="30" y="32" font-family="JetBrains Mono" font-size="9" font-weight="bold" fill="#000000" text-anchor="middle">${numericPing}ms</text>
            </svg>
        `;
    };

    // 4. CHART.JS & SPEEDOMETER RADAR MONITORS RENDERER
    const radarContainer = document.getElementById('radar-monitors-grid');

    const renderRadarMonitors = (services) => {
        if (!radarContainer || !Array.isArray(services)) return;

        radarContainer.innerHTML = services.map((s, idx) => {
            const isOnline = s.status === 'online';
            const canvasId = `radar-chart-${idx}`;
            const numericPing = parseInt(s.ping) || parseInt(s.avgPing) || 25;
            const speedometerSvg = generateSpeedometerSvg(numericPing, isOnline);

            return `
                <div class="gauge-card">
                    <div class="gauge-card-header">
                        <div class="gauge-title-group">
                            <span class="pulse-emerald" style="background-color: ${isOnline ? '#10b981' : '#f43f5e'}; box-shadow: 0 0 8px ${isOnline ? '#10b981' : '#f43f5e'};"></span>
                            <span class="gauge-name">${escapeHtml(s.name)}</span>
                        </div>
                        <span class="gauge-ping-val" style="background-color: ${isOnline ? '#a7f3d0' : '#fecdd3'};">${escapeHtml(s.ping || 'OK')}</span>
                    </div>

                    <div class="speedometer-wrap">
                        ${speedometerSvg}
                        <div class="chart-canvas-box">
                            <canvas id="${canvasId}"></canvas>
                        </div>
                    </div>

                    <div class="gauge-card-footer">
                        <span>24h Uptime: ${escapeHtml(s.uptime24h || '99.9%')}</span>
                        <span>STATUS: ${isOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Initialize Chart.js Area Curves
        services.forEach((s, idx) => {
            const canvasId = `radar-chart-${idx}`;
            const ctx = document.getElementById(canvasId)?.getContext('2d');
            if (!ctx) return;

            if (chartInstances[canvasId]) {
                chartInstances[canvasId].destroy();
            }

            const isOnline = s.status === 'online';
            const history = Array.isArray(s.history) && s.history.length > 0
                ? s.history
                : [{ ping: 35 }, { ping: 45 }, { ping: 38 }, { ping: 92 }, { ping: 40 }];

            const pings = history.map(h => typeof h.ping === 'number' && h.ping > 0 ? h.ping : 25);
            const labels = pings.map((_, i) => `-${pings.length - i}m`);

            const minVal = Math.max(0, Math.min(...pings) * 0.85);
            const maxVal = Math.max(...pings) * 1.15;

            const strokeColor = isOnline ? '#10b981' : '#f43f5e';
            const gradient = ctx.createLinearGradient(0, 0, 0, 50);
            gradient.addColorStop(0, isOnline ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

            chartInstances[canvasId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Latency (ms)',
                        data: pings,
                        borderColor: strokeColor,
                        borderWidth: 2.2,
                        fill: true,
                        backgroundColor: gradient,
                        tension: 0.45,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 600 },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `Ping: ${ctx.parsed.y} ms`
                            },
                            backgroundColor: '#000000',
                            titleFont: { family: 'Space Grotesk', size: 11, weight: 'bold' },
                            bodyFont: { family: 'JetBrains Mono', size: 12 },
                            padding: 8,
                            cornerRadius: 6
                        }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false, min: minVal, max: maxVal }
                    }
                }
            });
        });
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
                    renderRadarMonitors(data.services);
                }
            }
        } catch (e) {
            console.error('[Uptime Fetch Error]', e);
        }
    };

    fetchUptimeData();
    setInterval(fetchUptimeData, 90000); // Refresh every 90s

    // 5. BUILT-IN AI ASSISTANT CHAT DRAWER LOGIC
    const aiDrawer = document.getElementById('ai-chat-drawer');
    const openAiBtn = document.getElementById('open-ai-chat-btn');
    const closeAiBtn = document.getElementById('close-ai-chat-btn');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (openAiBtn) {
        openAiBtn.addEventListener('click', () => {
            aiDrawer.classList.add('active');
            aiDrawer.setAttribute('aria-hidden', 'false');
        });
    }

    if (closeAiBtn) {
        closeAiBtn.addEventListener('click', () => {
            aiDrawer.classList.remove('active');
            aiDrawer.setAttribute('aria-hidden', 'true');
        });
    }

    const getAiResponse = (query) => {
        const q = query.toLowerCase();

        if (q.includes('proyek') || q.includes('project') || q.includes('web')) {
            return "Fatahilah memiliki 9 proyek web unggulan di antaranya:\n1. FATAH Gateway (fatah.web.id)\n2. fmr.blog (blog.fatah.web.id)\n3. IT Lab & NSA Portfolio (fatahmr.my.id)\n4. Chef Arifin Culinary (arifin.fatah.web.id)\n5. Kwettiau Setia Wati (kwettiau.fatah.web.id)\n6. PERISAI Ayom Temon (ayom-temon.vercel.app)\n7. PERISAI Temon GIS (perisai-media-sosial.vercel.app)\n8. 9Router AI Gateway (9router.fatah.web.id)\n9. Status Page Uptime Kuma (status.fatah.web.id)";
        } else if (q.includes('lks') || q.includes('prestasi') || q.includes('nsa') || q.includes('juara')) {
            return "Fatahilah M.R adalah Juara 1 LKS IT Network System Administration 2026 tingkat provinsi/nasional, ahli dalam konfigurasi Cisco, MikroTik, Linux Enterprise, & otomatisasi AI!";
        } else if (q.includes('9router') || q.includes('ai') || q.includes('gateway')) {
            return "9Router adalah AI Gateway multi-provider (OpenAI, Claude, Groq, Ollama) yang dibangun Fatah dengan fitur SSE streaming real-time, public usage topology graph, dan rate-limiting pintar.";
        } else if (q.includes('kontak') || q.includes('contact') || q.includes('github') || q.includes('telegram')) {
            return "Anda bisa menghubungi Fatahilah via Telegram @BotFather atau melihat repositori kode lengkapnya di GitHub: github.com/fatahilah-mr";
        } else {
            return "Terima kasih atas pertanyaannya! Fatahilah M.R adalah Network Engineer & AI Systems Architect (Juara 1 LKS IT NSA 2026). Ada yang ingin Anda ketahui lebih lanjut tentang proyek web atau arsitektur servernya?";
        }
    };

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            const userMsgElem = document.createElement('div');
            userMsgElem.className = 'chat-msg user';
            userMsgElem.textContent = text;
            chatMessages.appendChild(userMsgElem);
            chatInput.value = '';

            chatMessages.scrollTop = chatMessages.scrollHeight;

            setTimeout(() => {
                const botMsgElem = document.createElement('div');
                botMsgElem.className = 'chat-msg bot';
                botMsgElem.innerText = getAiResponse(text);
                chatMessages.appendChild(botMsgElem);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 600);
        });
    }

    // 6. NEO-BRUTALIST MODAL OVERLAY DATA DICTIONARY
    const projectDetails = {
        'modal-gateway': {
            badge: '[PROJECT_INSPECT // 01]',
            title: 'FATAH Gateway',
            desc: 'Portal tautan pribadi ultra-cepat dan responsif dengan React 18, Vite, GSAP 3D tilt interaction, Glassmorphism CSS, & Sveltia CMS serverless OAuth.',
            demo: 'https://fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/gateway'
        },
        'modal-blog': {
            badge: '[PROJECT_INSPECT // 02]',
            title: 'fmr.blog Platform',
            desc: 'Blog pribadi & galeri portofolio interaktif berkinerja tinggi berbasis Astro 5, TypeScript, React 19, & Cloudflare Pages.',
            demo: 'https://blog.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/blog'
        },
        'modal-portfolio': {
            badge: '[PROJECT_INSPECT // 03]',
            title: 'IT Lab & NSA Portfolio',
            desc: 'Portofolio pribadi berbasis Astro 5 & Google Sheets Headless CMS untuk mengarsip laboratorium IT Network, Server, & otomatisasi AI (Juara 1 LKS IT NSA 2026).',
            demo: 'https://fatahmr.my.id',
            repo: 'https://github.com/fatahilah-mr/portfolio'
        },
        'modal-arifin': {
            badge: '[PROJECT_INSPECT // 04]',
            title: 'Chef Arifin Culinary Portfolio',
            desc: 'Platform portofolio digital mobile-first untuk chef & professional cook Arifin Prasetyo (React 19, TanStack Router, Tailwind CSS 4).',
            demo: 'https://arifin.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/arifin-prasetyo-portofolio'
        },
        'modal-kwettiau': {
            badge: '[PROJECT_INSPECT // 05]',
            title: 'Kwettiau Setia Wati Portfolio',
            desc: 'Website portofolio interaktif bertema pink pastel untuk Setia Wati (React 19, Motion, Lucide React).',
            demo: 'https://kwettiau.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/web-setia-wati'
        },
        'modal-ayom': {
            badge: '[PROJECT_INSPECT // 06]',
            title: 'PERISAI Ayom Temon',
            desc: 'Platform digital pengaduan anonim & penanganan cepat kekerasan perempuan dan anak (PPA) Kapanewon Temon berbasis Next.js 16, Supabase, Google Gemini 2.5 Flash, & Leaflet GIS.',
            demo: 'https://ayom-temon.vercel.app',
            repo: 'https://github.com/temonkec-cpu/AYOM-TEMON'
        },
        'modal-gis': {
            badge: '[PROJECT_INSPECT // 07]',
            title: 'PERISAI Temon GIS',
            desc: 'Platform pengaduan publik dengan triase AI Google Gemini 2.0 Flash (1-3 detik), notifikasi email instan, & peta interaktif GIS 15 Kalurahan.',
            demo: 'https://perisai-media-sosial.vercel.app',
            repo: 'https://github.com/temonkec-cpu/Media-Sosial'
        },
        'modal-9router': {
            badge: '[PROJECT_INSPECT // 08]',
            title: '9Router AI Gateway',
            desc: 'Multi-gateway AI router OpenAI/Claude/Groq/Ollama dengan SSE streaming engine & dashboard publik topologi node.',
            demo: 'https://9router.fatah.web.id/public-usage',
            repo: 'https://9router.fatah.web.id'
        },
        'modal-uptime': {
            badge: '[PROJECT_INSPECT // 09]',
            title: 'Uptime Kuma Status Page',
            desc: 'Platform pemantauan kesehatan server, endpoint API, & bot 24/7 real-time dengan notifikasi push ke Telegram.',
            demo: 'https://status.fatah.web.id',
            repo: 'https://status.fatah.web.id'
        }
    };

    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close-btn');
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
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.setAttribute('aria-hidden', 'true');
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

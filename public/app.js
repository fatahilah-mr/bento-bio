document.addEventListener('DOMContentLoaded', () => {
    
    // Store Chart.js instances to destroy/update properly
    const chartInstances = {};

    // 1. INTERACTIVE CATEGORY FILTERS
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectCards = document.querySelectorAll('.project-card');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.getAttribute('data-filter');
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

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

    // 2. CHART.JS SMOOTH AREA CURVE RENDERER FOR UPTIME KUMA MONITORS
    const monitorsContainer = document.getElementById('monitors-container');

    const renderMonitorCharts = (services) => {
        if (!monitorsContainer || !Array.isArray(services)) return;

        // Render Monitor HTML Cards
        monitorsContainer.innerHTML = services.map((s, idx) => {
            const isOnline = s.status === 'online';
            const canvasId = `chart-canvas-${idx}`;

            return `
                <div class="monitor-card">
                    <div class="monitor-card-header">
                        <div class="monitor-name-group">
                            <span class="dot-status ${isOnline ? 'online' : 'offline'}"></span>
                            <span class="monitor-name">${escapeHtml(s.name)}</span>
                        </div>
                        <span class="monitor-ping-badge">${escapeHtml(s.avgPing || s.ping || 'OK')}</span>
                    </div>

                    <!-- CHART.JS SMOOTH AREA CURVE CANVAS -->
                    <div class="chart-canvas-wrapper">
                        <canvas id="${canvasId}"></canvas>
                    </div>

                    <div class="chart-card-footer">
                        <span>24h Uptime: ${escapeHtml(s.uptime24h || '100%')}</span>
                        <span>LIVE STREAM</span>
                    </div>
                </div>
            `;
        }).join('');

        // Initialize Chart.js for each canvas
        services.forEach((s, idx) => {
            const canvasId = `chart-canvas-${idx}`;
            const ctx = document.getElementById(canvasId)?.getContext('2d');
            if (!ctx) return;

            // Destroy previous chart instance if exists
            if (chartInstances[canvasId]) {
                chartInstances[canvasId].destroy();
            }

            const history = Array.isArray(s.history) && s.history.length > 0
                ? s.history
                : [
                    { ping: 12 }, { ping: 18 }, { ping: 14 }, { ping: 25 },
                    { ping: 16 }, { ping: 11 }, { ping: 20 }, { ping: 13 },
                    { ping: 19 }, { ping: 15 }
                  ];

            const pings = history.map(h => typeof h.ping === 'number' ? h.ping : 10);
            const labels = pings.map((_, i) => `-${(pings.length - i) * 10}s`);

            // Create Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 70);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            // Create Chart.js Line Chart with Bezier Curve (tension: 0.4)
            chartInstances[canvasId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Latency (ms)',
                        data: pings,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        fill: true,
                        backgroundColor: gradient,
                        tension: 0.4, // Smooth Bezier Curve
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#07090e',
                        pointRadius: 2.5,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.parsed.y} ms`
                            },
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleFont: { family: 'Plus Jakarta Sans', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 12 },
                            padding: 8,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            display: false,
                            suggestedMin: Math.min(...pings) - 2,
                            suggestedMax: Math.max(...pings) + 5
                        }
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

    // 3. FETCH DATA FROM VERCEL SERVERLESS FUNCTION & UPTIME KUMA
    const fetchUptimeData = async () => {
        try {
            const res = await fetch('/api/status-stream');
            if (res.ok) {
                const data = await res.json();
                if (data.services) {
                    renderMonitorCharts(data.services);
                }
            }
        } catch (e) {
            console.error('[Uptime Fetch Error]', e);
        }
    };

    fetchUptimeData();
    setInterval(fetchUptimeData, 10000);

    // 4. APPLE-STYLE PROJECT DETAIL MODAL OVERLAY DATA DICTIONARY
    const projectDetails = {
        'modal-gateway': {
            badge: 'PROJECT INSPECTOR // 01',
            title: 'FATAH Gateway',
            desc: 'Portal tautan pribadi ultra-cepat dan responsif dengan React 18, Vite, GSAP 3D tilt interaction, Glassmorphism CSS, & Sveltia CMS serverless OAuth.',
            demo: 'https://fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/gateway'
        },
        'modal-blog': {
            badge: 'PROJECT INSPECTOR // 02',
            title: 'fmr.blog Platform',
            desc: 'Blog pribadi & galeri portofolio interaktif berkinerja tinggi berbasis Astro 5, TypeScript, React 19, & Cloudflare Pages.',
            demo: 'https://blog.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/blog'
        },
        'modal-portfolio': {
            badge: 'PROJECT INSPECTOR // 03',
            title: 'IT Lab & NSA Portfolio',
            desc: 'Portofolio pribadi berbasis Astro 5 & Google Sheets Headless CMS untuk mengarsip laboratorium IT Network, Server, & otomatisasi AI (Juara 1 LKS IT NSA 2026).',
            demo: 'https://fatahmr.my.id',
            repo: 'https://github.com/fatahilah-mr/portfolio'
        },
        'modal-arifin': {
            badge: 'PROJECT INSPECTOR // 04',
            title: 'Chef Arifin Culinary Portfolio',
            desc: 'Platform portofolio digital mobile-first untuk chef & professional cook Arifin Prasetyo (React 19, TanStack Router, Tailwind CSS 4).',
            demo: 'https://arifin.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/arifin-prasetyo-portofolio'
        },
        'modal-kwettiau': {
            badge: 'PROJECT INSPECTOR // 05',
            title: 'Kwettiau Setia Wati Portfolio',
            desc: 'Website portofolio interaktif bertema pink pastel untuk Setia Wati (React 19, Motion, Lucide React).',
            demo: 'https://kwettiau.fatah.web.id',
            repo: 'https://github.com/fatahilah-mr/web-setia-wati'
        },
        'modal-ayom': {
            badge: 'PROJECT INSPECTOR // 06',
            title: 'PERISAI Ayom Temon',
            desc: 'Platform digital pengaduan anonim & penanganan cepat kekerasan perempuan dan anak (PPA) Kapanewon Temon berbasis Next.js 16, Supabase, Google Gemini 2.5 Flash, & Leaflet GIS.',
            demo: 'https://ayom-temon.vercel.app',
            repo: 'https://github.com/temonkec-cpu/AYOM-TEMON'
        },
        'modal-gis': {
            badge: 'PROJECT INSPECTOR // 07',
            title: 'PERISAI Temon GIS',
            desc: 'Platform pengaduan publik dengan triase AI Google Gemini 2.0 Flash (1-3 detik), notifikasi email instan, & peta interaktif GIS 15 Kalurahan.',
            demo: 'https://perisai-media-sosial.vercel.app',
            repo: 'https://github.com/temonkec-cpu/Media-Sosial'
        },
        'modal-9router': {
            badge: 'PROJECT INSPECTOR // 08',
            title: '9Router AI Gateway',
            desc: 'Multi-gateway AI router OpenAI/Claude/Groq/Ollama dengan SSE streaming engine & dashboard publik topologi node.',
            demo: 'https://9router.fatah.web.id/public-usage',
            repo: 'https://9router.fatah.web.id'
        },
        'modal-uptime': {
            badge: 'PROJECT INSPECTOR // 09',
            title: 'Uptime Kuma Status Page',
            desc: 'Platform pemantauan kesehatan server, endpoint API, & bot 24/7 real-time dengan notifikasi push ke Telegram.',
            demo: 'https://status.fatah.web.id',
            repo: 'https://status.fatah.web.id'
        }
    };

    const modalBackdrop = document.getElementById('modal-backdrop');
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
            if (data && modalBackdrop) {
                modalBadge.textContent = data.badge;
                modalTitle.textContent = data.title;
                modalBody.textContent = data.desc;
                modalDemoBtn.setAttribute('href', data.demo);
                modalRepoBtn.setAttribute('href', data.repo);
                modalBackdrop.classList.add('active');
                modalBackdrop.setAttribute('aria-hidden', 'false');
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalBackdrop.classList.remove('active');
            modalBackdrop.setAttribute('aria-hidden', 'true');
        });
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.classList.remove('active');
                modalBackdrop.setAttribute('aria-hidden', 'true');
            }
        });
    }
});

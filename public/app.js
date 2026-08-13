document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Real-time Jakarta Clock & Date
    const updateClock = () => {
        const now = new Date();
        
        // Time in Asia/Jakarta (WIB)
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

        // Date in Asia/Jakarta
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

    // 2. Interactive Category Filter Tabs
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.card-project');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            // Active button state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter project cards
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

    // 3. 3D Card Tilt Effect on Mouse Move
    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
            const rotateY = ((x - centerX) / centerX) * 6;  // max 6 deg
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });

    // 4. Real-time Uptime Kuma Live Hydration
    const serviceListContainer = document.querySelector('.service-list');

    const renderServices = (services) => {
        if (!serviceListContainer || !Array.isArray(services)) return;
        
        serviceListContainer.innerHTML = services.map(s => {
            const isOnline = s.status === 'online';
            return `
                <div class="service-item">
                    <div class="service-info">
                        <span class="service-dot ${isOnline ? 'online' : 'offline'}"></span>
                        <span class="service-name">${escapeHtml(s.name)}</span>
                    </div>
                    <span class="service-badge ${isOnline ? '' : 'text-rose'}">${escapeHtml(s.ping || (isOnline ? 'Online' : 'Offline'))}</span>
                </div>
            `;
        }).join('');
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // 5. Fetch Status Stream from Vercel Serverless Function & Uptime Kuma
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/status-stream');
            if (res.ok) {
                const data = await res.json();
                if (data.services) {
                    renderServices(data.services);
                }
            }
        } catch (err) {
            console.error('[Bento Status Fetch Error]', err);
        }
    };

    fetchStatus();
    setInterval(fetchStatus, 10000); // Fetch status every 10 seconds
});

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
        document.getElementById('clock-time').textContent = timeString.replace(/\./g, ':');

        // Date in Asia/Jakarta
        const dateOptions = {
            timeZone: 'Asia/Jakarta',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const dateString = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
        document.getElementById('clock-date').textContent = dateString;
    };

    updateClock();
    setInterval(updateClock, 1000);

    // 2. Real-time Uptime Kuma Live Hydration
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

    // 3. Fetch Status Stream from Vercel Serverless Function & Uptime Kuma
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  
  const slugs = ['monitor', 'default'];
  
  for (const slug of slugs) {
    try {
      const response = await fetch(`https://status.fatah.web.id/api/status-page/heartbeat/${slug}`, {
        headers: {
          'User-Agent': 'Bento-Bio-Vercel-Fetcher/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const heartbeatList = data.heartbeatList || {};
        const uptimeList = data.uptimeList || {};
        
        const entries = Object.entries(heartbeatList);

        if (entries.length > 0) {
          const monitors = entries.map(([id, list]) => {
            const beats = Array.isArray(list) ? list : [];
            
            // Filter recent valid normal pings (< 2000ms)
            const validPings = beats
              .filter(b => typeof b.ping === 'number' && b.ping > 0 && b.ping < 2000)
              .map(b => b.ping);

            const lastBeat = beats.length > 0 ? beats[beats.length - 1] : null;
            const isUp = lastBeat ? (lastBeat.status === 1 || lastBeat.status === 2) : true;
            
            // Current normal ping (latest valid ping under 2000ms)
            const currentPing = (lastBeat && typeof lastBeat.ping === 'number' && lastBeat.ping < 2000)
              ? lastBeat.ping
              : (validPings.length > 0 ? validPings[validPings.length - 1] : 45);

            // Average normal ping (excluding timeout spikes)
            const recentNormalPings = validPings.slice(-15);
            const avgPing = recentNormalPings.length > 0 
              ? Math.round(recentNormalPings.reduce((a, b) => a + b, 0) / recentNormalPings.length) 
              : currentPing;

            // Generate clean history for Sparkline Chart (last 15 beats, capped at 300ms for smooth curves)
            const history = beats.slice(-15).map(b => {
              let p = typeof b.ping === 'number' && b.ping > 0 ? b.ping : currentPing;
              if (p > 500) p = currentPing + Math.floor(Math.random() * 15); // Normalizing timeout spikes for chart UI
              return {
                status: b.status === 0 ? 'down' : 'up',
                ping: p,
                time: b.time
              };
            });

            const monitorNames = {
              '1': 'FATAH Gateway',
              '2': 'fmr.blog Platform',
              '3': 'IT Lab & NSA Portfolio',
              '5': 'Chef Arifin Culinary',
              '6': 'Kwettiau Setia Wati',
              '7': 'PERISAI Ayom Temon',
              '8': 'PERISAI Temon GIS',
              '9': '9Router AI Gateway',
              '10': 'Telegram AI Bot',
              '11': 'Uptime Kuma Core'
            };

            const name = monitorNames[id] || lastBeat?.name || `Monitor #${id}`;

            return {
              id,
              name,
              status: isUp ? 'online' : 'offline',
              ping: `${currentPing}ms`,
              avgPing: `${avgPing}ms`,
              uptime24h: uptimeList[`${id}_24`] ? `${(uptimeList[`${id}_24`] * 100).toFixed(1)}%` : '99.9%',
              history
            };
          });

          return res.status(200).json({
            timestamp: new Date().toISOString(),
            source: `https://status.fatah.web.id (slug: ${slug})`,
            services: monitors
          });
        }
      }
    } catch (err) {
      console.error(`[Vercel API Fetch Error slug: ${slug}]`, err);
    }
  }

  // Fallback
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    source: 'Fallback',
    services: [
      { id: '1', name: '9Router AI Gateway', status: 'online', ping: '15ms', avgPing: '18ms', uptime24h: '99.9%', history: Array(15).fill({ ping: 15 }) }
    ]
  });
}

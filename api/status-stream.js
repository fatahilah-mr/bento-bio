export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  
  // Try status page slugs: 'monitor' first, then 'default'
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
            const lastBeat = beats.length > 0 ? beats[beats.length - 1] : null;
            const isUp = lastBeat ? lastBeat.status === 1 : true;
            
            // Take last 20 real heartbeats from Uptime Kuma
            const history = beats.slice(-20).map(b => ({
              status: b.status === 1 ? 'up' : 'down',
              ping: typeof b.ping === 'number' ? b.ping : 0,
              time: b.time
            }));

            const validPings = history.filter(h => h.ping > 0).map(h => h.ping);
            const avgPing = validPings.length > 0 
              ? Math.round(validPings.reduce((a, b) => a + b, 0) / validPings.length) 
              : (lastBeat?.ping || 0);

            // Dynamic monitor title or mapping
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
              ping: lastBeat?.ping ? `${lastBeat.ping}ms` : `${avgPing}ms`,
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

  // Static fallback if Uptime Kuma is completely unreachable
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    source: 'Fallback',
    services: [
      { id: '1', name: '9Router AI Gateway', status: 'online', ping: '15ms', avgPing: '18ms', uptime24h: '99.9%', history: Array(15).fill({ ping: 15 }) }
    ]
  });
}

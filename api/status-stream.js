export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  
  try {
    const response = await fetch('https://status.fatah.web.id/api/status-page/heartbeat/default', {
      headers: {
        'User-Agent': 'Bento-Bio-Vercel-Fetcher/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const heartbeatList = data.heartbeatList || {};
      
      const monitors = Object.entries(heartbeatList).map(([id, list]) => {
        const lastBeat = Array.isArray(list) ? list[list.length - 1] : null;
        const isUp = lastBeat ? lastBeat.status === 1 : true;
        return {
          id,
          name: lastBeat?.name || `Service #${id}`,
          status: isUp ? 'online' : 'offline',
          ping: lastBeat?.ping ? `${lastBeat.ping}ms` : 'OK'
        };
      });

      if (monitors.length > 0) {
        return res.status(200).json({
          timestamp: new Date().toISOString(),
          source: 'https://status.fatah.web.id',
          services: monitors
        });
      }
    }
  } catch (err) {
    console.error('[Vercel API Fetch Error]', err);
  }

  // Fallback services if Uptime Kuma is default
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    source: 'Static Fallback',
    services: [
      { id: '1', name: '9Router AI Gateway', status: 'online', ping: '20128/v1' },
      { id: '2', name: 'Telegram AI Bot', status: 'online', ping: 'SQLite Sync' },
      { id: '3', name: 'Uptime Kuma', status: 'online', ping: 'Port 3001' },
      { id: '4', name: 'Cloudflare Tunnel', status: 'online', ping: 'Zero Trust' }
    ]
  });
}

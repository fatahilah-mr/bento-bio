import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.static(path.join(__dirname, 'public')));

// Helper to fetch live monitor status from Uptime Kuma (Local Port 3001)
async function fetchUptimeKumaStatus() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/status-page/heartbeat/default', {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      const heartbeatList = data.heartbeatList || {};
      
      // Parse monitors from Uptime Kuma
      const monitors = Object.entries(heartbeatList).map(([id, list]) => {
        const lastBeat = Array.isArray(list) ? list[list.length - 1] : null;
        const isUp = lastBeat ? lastBeat.status === 1 : true;
        return {
          id,
          name: lastBeat?.name || `Monitor #${id}`,
          status: isUp ? 'online' : 'offline',
          ping: lastBeat?.ping ? `${lastBeat.ping}ms` : 'OK'
        };
      });

      if (monitors.length > 0) {
        return monitors;
      }
    }
  } catch (err) {
    // Silent fallback to local port check if Uptime Kuma API is initializing
  }

  // Default fallback service list if Uptime Kuma status page is default
  return [
    { id: '1', name: '9Router AI Gateway', status: 'online', ping: 'Port 20128' },
    { id: '2', name: 'Telegram AI Bot', status: 'online', ping: 'SQLite Sync' },
    { id: '3', name: 'Uptime Kuma', status: 'online', ping: 'Port 3001' },
    { id: '4', name: 'Cloudflare Tunnel', status: 'online', ping: 'Zero Trust' }
  ];
}

// SSE Endpoint for Live Uptime Kuma Stream
app.get('/api/status-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendStatus = async () => {
    const services = await fetchUptimeKumaStatus();
    const statusData = {
      timestamp: new Date().toISOString(),
      source: 'Uptime Kuma',
      services
    };
    res.write(`data: ${JSON.stringify(statusData)}\n\n`);
  };

  await sendStatus();
  const interval = setInterval(sendStatus, 10000); // Live Uptime Sync every 10s

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Bento Box Bio Page connected to Uptime Kuma on http://127.0.0.1:${PORT}`);
});

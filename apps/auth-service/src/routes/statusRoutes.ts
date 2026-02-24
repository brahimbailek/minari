import { Router, Request, Response } from 'express';

const router = Router();

// Lazy load Prisma to avoid connection errors at startup
let prisma: any = null;
const getPrisma = async () => {
  if (!prisma) {
    try {
      const db = await import('@commpro/database');
      prisma = db.prisma;
    } catch (error) {
      console.error('Failed to load Prisma:', error);
      return null;
    }
  }
  return prisma;
};

// Phase 1 progress tracking
const PHASE1_FEATURES = [
  { name: 'Auth Service', module: 'auth-service', status: 'done', progress: 100, details: 'Register, Login, JWT, Refresh, Logout, Profile, Password Reset' },
  { name: '2FA (TOTP)', module: 'auth-service', status: 'done', progress: 100, details: 'Enable, Confirm, Disable, Verify with speakeasy + QR code' },
  { name: 'Numbers Service', module: 'numbers-service', status: 'done', progress: 100, details: 'Search, Purchase, List, Update, Release (Twilio API)' },
  { name: 'Messaging Service', module: 'messaging-service', status: 'pending', progress: 0, details: 'SMS/MMS, E2E encryption, real-time sync' },
  { name: 'Billing Service', module: 'billing-service', status: 'pending', progress: 0, details: 'Stripe subscriptions, invoices, usage tracking' },
  { name: 'Call Service', module: 'call-service', status: 'pending', progress: 0, details: 'Twilio Voice API, HD calls, CallKit/Telecom' },
  { name: 'Mobile iOS', module: 'mobile-ios', status: 'pending', progress: 0, details: 'Swift 5.9+, SwiftUI, CallKit, PushKit' },
  { name: 'Mobile Android', module: 'mobile-android', status: 'pending', progress: 0, details: 'Kotlin 1.9+, Jetpack Compose, Telecom' },
];

const API_ENDPOINTS = [
  // Auth Service
  { method: 'POST', path: '/api/auth/register', status: 'live', auth: false, service: 'auth' },
  { method: 'POST', path: '/api/auth/login', status: 'live', auth: false, service: 'auth' },
  { method: 'POST', path: '/api/auth/refresh', status: 'live', auth: false, service: 'auth' },
  { method: 'POST', path: '/api/auth/forgot-password', status: 'live', auth: false, service: 'auth' },
  { method: 'POST', path: '/api/auth/reset-password', status: 'live', auth: false, service: 'auth' },
  { method: 'GET', path: '/api/auth/me', status: 'live', auth: true, service: 'auth' },
  { method: 'POST', path: '/api/auth/logout', status: 'live', auth: true, service: 'auth' },
  { method: 'PUT', path: '/api/auth/change-password', status: 'live', auth: true, service: 'auth' },
  { method: 'PUT', path: '/api/auth/profile', status: 'live', auth: true, service: 'auth' },
  { method: 'POST', path: '/api/auth/2fa/enable', status: 'live', auth: true, service: 'auth' },
  { method: 'POST', path: '/api/auth/2fa/confirm', status: 'live', auth: true, service: 'auth' },
  { method: 'POST', path: '/api/auth/2fa/disable', status: 'live', auth: true, service: 'auth' },
  { method: 'POST', path: '/api/auth/2fa/verify', status: 'live', auth: false, service: 'auth' },
  // Numbers Service
  { method: 'GET', path: '/api/numbers/available', status: 'live', auth: true, service: 'numbers' },
  { method: 'GET', path: '/api/numbers', status: 'live', auth: true, service: 'numbers' },
  { method: 'GET', path: '/api/numbers/:id', status: 'live', auth: true, service: 'numbers' },
  { method: 'POST', path: '/api/numbers/purchase', status: 'live', auth: true, service: 'numbers' },
  { method: 'PUT', path: '/api/numbers/:id', status: 'live', auth: true, service: 'numbers' },
  { method: 'DELETE', path: '/api/numbers/:id', status: 'live', auth: true, service: 'numbers' },
];

// JSON API for status data
router.get('/api', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbLatency = 0;
  let userCount = 0;

  try {
    const db = await getPrisma();
    if (db) {
      const start = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = 'connected';
      userCount = await db.user.count();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    dbStatus = 'error';
  }

  const memUsage = process.memoryUsage();
  const totalProgress = Math.round(
    PHASE1_FEATURES.reduce((sum, f) => sum + f.progress, 0) / PHASE1_FEATURES.length
  );

  res.json({
    platform: 'CommPro',
    version: '1.0.0-alpha',
    phase: 'Phase 1 - MVP',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    totalProgress,
    database: { status: dbStatus, latency: dbLatency, users: userCount },
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heap: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    services: PHASE1_FEATURES,
    endpoints: API_ENDPOINTS,
    node: process.version,
  });
});

// HTML Dashboard
router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbLatency = 0;
  let userCount = 0;

  try {
    const db = await getPrisma();
    if (db) {
      const start = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = 'connected';
      userCount = await db.user.count();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    dbStatus = 'error';
  }

  const memUsage = process.memoryUsage();
  const uptimeSec = process.uptime();
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const uptimeStr = days > 0 ? `${days}j ${hours}h ${mins}m` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const totalProgress = Math.round(
    PHASE1_FEATURES.reduce((sum, f) => sum + f.progress, 0) / PHASE1_FEATURES.length
  );

  const liveEndpoints = API_ENDPOINTS.filter(e => e.status === 'live').length;
  const totalEndpoints = API_ENDPOINTS.length;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CommPro - Dashboard Production</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #e0e0e0;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid #2a2a4a;
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
    }
    .header h1 span { color: #6c63ff; }
    .header .env-badge {
      background: ${process.env.NODE_ENV === 'production' ? '#22c55e' : '#f59e0b'};
      color: #000;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }

    /* Stats cards */
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: #12121a;
      border: 1px solid #1e1e30;
      border-radius: 12px;
      padding: 20px;
    }
    .stat-card .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .stat-card .value { font-size: 28px; font-weight: 700; color: #fff; }
    .stat-card .sub { font-size: 12px; color: #666; margin-top: 4px; }

    /* Status indicators */
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .status-dot.green { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
    .status-dot.red { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
    .status-dot.yellow { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
    .status-dot.gray { background: #555; }

    /* Progress section */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .section-title .count { color: #6c63ff; font-size: 14px; }

    /* Overall progress */
    .overall-progress {
      background: #12121a;
      border: 1px solid #1e1e30;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .progress-header h3 { color: #fff; font-size: 16px; }
    .progress-header .pct { color: #6c63ff; font-size: 24px; font-weight: 700; }
    .progress-bar { background: #1e1e30; border-radius: 8px; height: 12px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 8px; background: linear-gradient(90deg, #6c63ff, #a78bfa); transition: width 0.5s; }

    /* Feature cards */
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
    .feature-card {
      background: #12121a;
      border: 1px solid #1e1e30;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .feature-icon {
      width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .feature-icon.done { background: #22c55e22; color: #22c55e; }
    .feature-icon.partial { background: #f59e0b22; color: #f59e0b; }
    .feature-icon.pending { background: #55555522; color: #555; }
    .feature-info { flex: 1; }
    .feature-name { font-weight: 600; font-size: 14px; color: #fff; }
    .feature-detail { font-size: 12px; color: #666; margin-top: 2px; }
    .feature-badge {
      font-size: 11px; padding: 3px 10px; border-radius: 12px; font-weight: 600;
    }
    .feature-badge.done { background: #22c55e22; color: #22c55e; }
    .feature-badge.partial { background: #f59e0b22; color: #f59e0b; }
    .feature-badge.pending { background: #55555522; color: #555; }

    /* Endpoints table */
    .endpoints-table {
      width: 100%;
      border-collapse: collapse;
      background: #12121a;
      border: 1px solid #1e1e30;
      border-radius: 12px;
      overflow: hidden;
    }
    .endpoints-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      background: #0d0d14;
      border-bottom: 1px solid #1e1e30;
    }
    .endpoints-table td {
      padding: 10px 16px;
      font-size: 13px;
      border-bottom: 1px solid #1e1e30;
    }
    .endpoints-table tr:last-child td { border-bottom: none; }
    .method-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
    }
    .method-badge.GET { background: #22c55e22; color: #22c55e; }
    .method-badge.POST { background: #3b82f622; color: #3b82f6; }
    .method-badge.PUT { background: #f59e0b22; color: #f59e0b; }
    .method-badge.DELETE { background: #ef444422; color: #ef4444; }
    .path { font-family: 'SF Mono', Monaco, monospace; color: #a78bfa; font-size: 13px; }
    .ep-status { font-size: 12px; font-weight: 600; }
    .ep-status.live { color: #22c55e; }
    .ep-status.stub { color: #f59e0b; }
    .auth-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #6c63ff22; color: #6c63ff; }

    /* Footer */
    .footer { text-align: center; padding: 24px; color: #444; font-size: 12px; }

    /* Auto-refresh indicator */
    .refresh-info { font-size: 11px; color: #444; display: flex; align-items: center; gap: 6px; }
    .pulse { animation: pulse 2s infinite; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1><span>Comm</span>Pro <span style="font-weight:300;font-size:14px;color:#888;margin-left:8px">Dashboard</span></h1>
    <div style="display:flex;align-items:center;gap:16px">
      <div class="refresh-info"><span class="pulse" style="color:#22c55e">&#9679;</span> Auto-refresh 30s</div>
      <span class="env-badge">${process.env.NODE_ENV || 'development'}</span>
    </div>
  </div>

  <div class="container">
    <!-- Stats -->
    <div class="stats">
      <div class="stat-card">
        <div class="label">Statut Serveur</div>
        <div class="value"><span class="status-dot green"></span>En ligne</div>
        <div class="sub">Uptime: ${uptimeStr}</div>
      </div>
      <div class="stat-card">
        <div class="label">Base de donn&eacute;es</div>
        <div class="value"><span class="status-dot ${dbStatus === 'connected' ? 'green' : 'red'}"></span>${dbStatus === 'connected' ? 'Connect&eacute;e' : 'Erreur'}</div>
        <div class="sub">${dbStatus === 'connected' ? `Latence: ${dbLatency}ms` : 'V&eacute;rifier DATABASE_URL'}</div>
      </div>
      <div class="stat-card">
        <div class="label">Utilisateurs</div>
        <div class="value">${userCount}</div>
        <div class="sub">Inscrits en base</div>
      </div>
      <div class="stat-card">
        <div class="label">M&eacute;moire (RSS)</div>
        <div class="value">${Math.round(memUsage.rss / 1024 / 1024)} MB</div>
        <div class="sub">Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}/${Math.round(memUsage.heapTotal / 1024 / 1024)} MB</div>
      </div>
      <div class="stat-card">
        <div class="label">Node.js</div>
        <div class="value" style="font-size:20px">${process.version}</div>
        <div class="sub">PID: ${process.pid}</div>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="overall-progress">
      <div class="progress-header">
        <h3>Phase 1 &mdash; MVP Progress</h3>
        <span class="pct">${totalProgress}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${totalProgress}%"></div>
      </div>
    </div>

    <!-- Features -->
    <div class="section">
      <div class="section-title">Services & Fonctionnalit&eacute;s <span class="count">${PHASE1_FEATURES.filter(f => f.status === 'done').length}/${PHASE1_FEATURES.length}</span></div>
      <div class="features">
        ${PHASE1_FEATURES.map(f => `
        <div class="feature-card">
          <div class="feature-icon ${f.status}">${f.status === 'done' ? '&#10003;' : f.status === 'partial' ? '&#9881;' : '&#9711;'}</div>
          <div class="feature-info">
            <div class="feature-name">${f.name}</div>
            <div class="feature-detail">${f.details}</div>
          </div>
          <span class="feature-badge ${f.status}">${f.status === 'done' ? 'Termin&eacute;' : f.status === 'partial' ? `${f.progress}%` : 'A faire'}</span>
        </div>`).join('')}
      </div>
    </div>

    <!-- Endpoints -->
    <div class="section">
      <div class="section-title">API Endpoints <span class="count">${liveEndpoints}/${totalEndpoints} actifs</span></div>
      <table class="endpoints-table">
        <thead>
          <tr>
            <th>M&eacute;thode</th>
            <th>Route</th>
            <th>Statut</th>
            <th>Auth</th>
          </tr>
        </thead>
        <tbody>
          ${API_ENDPOINTS.map(ep => `
          <tr>
            <td><span class="method-badge ${ep.method}">${ep.method}</span></td>
            <td class="path">${ep.path}</td>
            <td><span class="ep-status ${ep.status}">${ep.status === 'live' ? '&#9679; Live' : '&#9679; Stub'}</span></td>
            <td>${ep.auth ? '<span class="auth-badge">JWT</span>' : '<span style="color:#555">Public</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    CommPro v1.0.0-alpha &bull; Phase 1 MVP &bull; D&eacute;ploy&eacute; sur Railway<br>
    Derniere mise &agrave; jour: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
  </div>

  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export default router;

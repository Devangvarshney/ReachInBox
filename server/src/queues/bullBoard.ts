import { Router, Request, Response } from 'express';
import { EmailSchedule, SenderAccount } from '../models';
import { EMAIL_QUEUE_NAME, processEmailDispatch } from './emailQueue';
import { rateLimitService } from '../services/rateLimitService';

export const setupBullBoard = () => {
  const router = Router();

  // API endpoint returning live queue summary
  router.get('/api/queues-data', async (_req: Request, res: Response) => {
    try {
      const scheduled = await EmailSchedule.find({ status: 'scheduled' }).sort({ scheduledFor: 1 });
      const processing = await EmailSchedule.find({ status: 'processing' });
      const sent = await EmailSchedule.find({ status: 'sent' }).sort({ sentAt: -1 });
      const failed = await EmailSchedule.find({ status: 'failed' }).sort({ updatedAt: -1 });

      // Rate limit metrics
      const senders = await SenderAccount.find({ active: true });
      const senderUsages = await Promise.all(
        senders.map(s => rateLimitService.getCurrentUsage(s._id.toString(), s.email))
      );
      const globalUsage = await rateLimitService.getGlobalUsage();
      const limits = rateLimitService.getLimits();

      return res.json({
        queueName: EMAIL_QUEUE_NAME,
        counts: {
          active: processing.length,
          waiting: 0,
          delayed: scheduled.length,
          completed: sent.length,
          failed: failed.length,
          paused: 0,
        },
        rateLimits: {
          global: globalUsage,
          perSender: senderUsages,
          config: limits,
        },
        jobs: {
          delayed: scheduled.map(s => ({
            id: s.jobId || s._id.toString(),
            scheduleId: s._id.toString(),
            name: `email_${s._id.toString().slice(0, 8)}`,
            data: { to: s.toEmail, subject: s.subject, from: s.fromEmail },
            delay: Math.max(0, new Date(s.scheduledFor).getTime() - Date.now()),
            scheduledFor: s.scheduledFor,
            status: 'delayed',
          })),
          active: processing.map(s => ({
            id: s.jobId || s._id.toString(),
            scheduleId: s._id.toString(),
            name: `email_${s._id.toString().slice(0, 8)}`,
            data: { to: s.toEmail, subject: s.subject },
            status: 'active',
          })),
          completed: sent.slice(0, 20).map(s => ({
            id: s.jobId || s._id.toString(),
            scheduleId: s._id.toString(),
            name: `email_${s._id.toString().slice(0, 8)}`,
            data: { to: s.toEmail, subject: s.subject },
            sentAt: s.sentAt,
            etherealPreviewUrl: s.etherealPreviewUrl,
            status: 'completed',
          })),
          failed: failed.map(s => ({
            id: s.jobId || s._id.toString(),
            scheduleId: s._id.toString(),
            name: `email_${s._id.toString().slice(0, 8)}`,
            data: { to: s.toEmail, subject: s.subject },
            error: s.errorLog,
            status: 'failed',
          })),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Manual Trigger / Retry Job API
  router.post('/api/retry-job/:id', async (req: Request, res: Response) => {
    try {
      const schedule = await EmailSchedule.findById(req.params.id);

      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const result = await processEmailDispatch({
        scheduleId: schedule._id.toString(),
        to: schedule.toEmail,
        toName: schedule.toName || undefined,
        from: schedule.fromEmail,
        fromName: schedule.fromName || undefined,
        subject: schedule.subject,
        body: schedule.body,
      });

      return res.json({ success: true, result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Live Real-Time Queue Dashboard UI
  router.get('/', (_req: Request, res: Response) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BullMQ Live Dashboard | ReachInbox</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #10b981;
      --active-blue: #3b82f6;
      --delayed-purple: #a855f7;
      --completed-green: #10b981;
      --failed-red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
    }
    aside {
      width: 260px;
      background: #0b1120;
      border-right: 1px solid var(--border);
      padding: 24px 18px;
      display: flex;
      flex-direction: column;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 28px;
    }
    .logo-badge {
      background: var(--primary);
      color: #000;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .nav-header {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }
    .queue-item {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .queue-name {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
    }
    .queue-stats {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      gap: 8px;
    }
    main {
      flex: 1;
      padding: 28px 36px;
      overflow-y: auto;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
    }
    .refresh-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--primary);
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 6px 14px;
      border-radius: 9999px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .metric-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-value {
      font-size: 26px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 13.5px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn.active {
      background: var(--card-bg);
      color: #fff;
      border: 1px solid var(--border);
    }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background: #151f32;
      padding: 12px 18px;
      font-size: 11.5px;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 14px 18px;
      border-bottom: 1px solid #283548;
      color: #cbd5e1;
    }
    tr:last-child td { border-bottom: none; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-delayed { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .badge-completed { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-failed { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-active { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .btn-action {
      background: #334155;
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    .btn-action:hover { background: #475569; }
    .preview-link {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
    }
    .preview-link:hover { text-decoration: underline; }
    .empty-row {
      text-align: center;
      padding: 36px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <aside>
    <div class="logo">
      <span>🎯 BullMQ Live</span>
      <span class="logo-badge">PRO</span>
    </div>

    <div class="nav-header">Active Queues</div>
    <div class="queue-item">
      <div class="queue-name">reachinbox-email-queue</div>
      <div class="queue-stats">
        <span>Concurrency: 5</span> • <span>Redis / DB Sync</span>
      </div>
    </div>

    <div style="margin-top: auto; font-size: 11px; color: var(--text-muted); line-height: 1.5;">
      <div>Outbox Labs ReachInbox Engine</div>
      <div style="color: var(--primary);">✓ Ethereal SMTP Multi-Sender</div>
    </div>
  </aside>

  <main>
    <div class="header-bar">
      <div>
        <h1 class="title">Queue: reachinbox-email-queue</h1>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Real-time BullMQ Delayed Jobs, Active Workers & Outbound SMTP Dispatcher</p>
      </div>
      <div class="refresh-badge">
        <div class="pulse-dot"></div>
        <span>Live Auto-Refresh (3s)</span>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label" style="color: var(--active-blue);">Active</div>
        <div class="metric-value" id="count-active" style="color: var(--active-blue);">0</div>
      </div>
      <div class="metric-card">
        <div class="metric-label" style="color: var(--delayed-purple);">Delayed</div>
        <div class="metric-value" id="count-delayed" style="color: var(--delayed-purple);">0</div>
      </div>
      <div class="metric-card">
        <div class="metric-label" style="color: var(--completed-green);">Completed</div>
        <div class="metric-value" id="count-completed" style="color: var(--completed-green);">0</div>
      </div>
      <div class="metric-card">
        <div class="metric-label" style="color: var(--failed-red);">Failed</div>
        <div class="metric-value" id="count-failed" style="color: var(--failed-red);">0</div>
      </div>
    </div>

    <!-- Rate Limits Section -->
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        ⚡ Rate Limits
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;" id="rate-limit-config"></span>
      </h2>
      <div id="rate-limits-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
        <div style="color: var(--text-muted); font-size: 13px;">Loading rate limit data...</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('delayed')">Delayed (<span id="tab-count-delayed">0</span>)</button>
      <button class="tab-btn" onclick="switchTab('completed')">Completed (<span id="tab-count-completed">0</span>)</button>
      <button class="tab-btn" onclick="switchTab('failed')">Failed (<span id="tab-count-failed">0</span>)</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr id="table-headers">
            <th>Job ID</th>
            <th>Recipient</th>
            <th>Subject</th>
            <th>Execution Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="jobs-table-body">
          <tr><td colspan="6" class="empty-row">Loading queue metrics...</td></tr>
        </tbody>
      </table>
    </div>
  </main>

  <script>
    let currentTab = 'delayed';
    let queueData = null;

    async function fetchQueueData() {
      try {
        const res = await fetch('/admin/queues/api/queues-data');
        const data = await res.json();
        if (data && data.counts) {
          queueData = data;
          renderDashboard();
        } else if (data && data.error) {
          console.warn('Queue data warning:', data.error);
          document.getElementById('jobs-table-body').innerHTML = '<tr><td colspan="6" class="empty-row" style="color: #f59e0b;">' + data.error + '</td></tr>';
          document.getElementById('rate-limits-container').innerHTML = '<div style="color: #94a3b8; font-size: 13px;">Connecting to database...</div>';
        }
      } catch (err) {
        console.error('Queue poll error', err);
      }
    }

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      renderTable();
    }

    async function triggerRetry(id) {
      try {
        const res = await fetch('/admin/queues/api/retry-job/' + id, { method: 'POST' });
        const data = await res.json();
        alert('Job processed! Ethereal URL: ' + (data.result?.etherealPreviewUrl || 'Sent'));
        fetchQueueData();
      } catch (err) {
        alert('Retry failed: ' + err.message);
      }
    }

    function renderDashboard() {
      if (!queueData) return;
      document.getElementById('count-active').innerText = queueData.counts.active;
      document.getElementById('count-delayed').innerText = queueData.counts.delayed;
      document.getElementById('count-completed').innerText = queueData.counts.completed;
      document.getElementById('count-failed').innerText = queueData.counts.failed;

      document.getElementById('tab-count-delayed').innerText = queueData.counts.delayed;
      document.getElementById('tab-count-completed').innerText = queueData.counts.completed;
      document.getElementById('tab-count-failed').innerText = queueData.counts.failed;

      renderRateLimits();
      renderTable();
    }

    function renderTable() {
      if (!queueData) return;
      const tbody = document.getElementById('jobs-table-body');
      const jobs = queueData.jobs[currentTab] || [];

      if (jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No ' + currentTab + ' jobs in queue.</td></tr>';
        return;
      }

      let html = '';
      jobs.forEach(job => {
        const timeFormatted = currentTab === 'delayed'
          ? (job.scheduledFor ? new Date(job.scheduledFor).toLocaleString() : 'In ' + Math.round(job.delay / 1000) + 's')
          : (job.sentAt ? new Date(job.sentAt).toLocaleString() : 'Just now');

        let actions = '-';
        if (currentTab === 'delayed' || currentTab === 'failed') {
          actions = '<button class="btn-action" onclick="triggerRetry(\\'' + job.scheduleId + '\\')">⚡ Send Now</button>';
        } else if (currentTab === 'completed' && job.etherealPreviewUrl) {
          actions = '<a href="' + job.etherealPreviewUrl + '" target="_blank" class="preview-link">🔗 View Ethereal Email</a>';
        }

        html += '<tr>' +
          '<td style="font-family: monospace; color: #94a3b8;">' + job.id.slice(0, 16) + '...</td>' +
          '<td><strong>' + (job.data.to || 'Unknown') + '</strong></td>' +
          '<td>' + (job.data.subject || '(No subject)') + '</td>' +
          '<td>' + timeFormatted + '</td>' +
          '<td><span class="badge badge-' + currentTab + '">' + currentTab + '</span></td>' +
          '<td>' + actions + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function renderRateLimits() {
      if (!queueData || !queueData.rateLimits) return;
      const rl = queueData.rateLimits;
      const container = document.getElementById('rate-limits-container');
      const configEl = document.getElementById('rate-limit-config');

      configEl.innerText = '(Global: ' + rl.config.globalHourlyLimit + '/hr • Per-Sender: ' + rl.config.perSenderHourlyLimit + '/hr)';

      let html = '';

      // Global gauge
      const gPct = Math.min(100, rl.global.percentUsed);
      const gColor = gPct > 80 ? 'var(--failed-red)' : gPct > 50 ? '#f59e0b' : 'var(--completed-green)';
      html += '<div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
      html += '<span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">🌐 Global</span>';
      html += '<span style="font-family: JetBrains Mono, monospace; font-size: 14px; font-weight: 700; color: ' + gColor + ';">' + rl.global.currentCount + ' / ' + rl.global.limit + '</span>';
      html += '</div>';
      html += '<div style="height: 6px; background: #283548; border-radius: 3px; overflow: hidden;">';
      html += '<div style="height: 100%; width: ' + gPct + '%; background: ' + gColor + '; border-radius: 3px; transition: width 0.5s ease;"></div>';
      html += '</div></div>';

      // Per-sender gauges
      if (rl.perSender && rl.perSender.length > 0) {
        rl.perSender.forEach(function(sender) {
          const pct = Math.min(100, sender.percentUsed);
          const color = pct > 80 ? 'var(--failed-red)' : pct > 50 ? '#f59e0b' : 'var(--completed-green)';
          html += '<div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px;">';
          html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
          html += '<span style="font-size: 12px; font-weight: 600; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;" title="' + sender.senderEmail + '">📧 ' + sender.senderEmail + '</span>';
          html += '<span style="font-family: JetBrains Mono, monospace; font-size: 14px; font-weight: 700; color: ' + color + ';">' + sender.currentCount + ' / ' + sender.limit + '</span>';
          html += '</div>';
          html += '<div style="height: 6px; background: #283548; border-radius: 3px; overflow: hidden;">';
          html += '<div style="height: 100%; width: ' + pct + '%; background: ' + color + '; border-radius: 3px; transition: width 0.5s ease;"></div>';
          html += '</div></div>';
        });
      }

      container.innerHTML = html;
    }

    fetchQueueData();
    setInterval(fetchQueueData, 3000);
  </script>
</body>
</html>
    `);
  });

  return router;
};

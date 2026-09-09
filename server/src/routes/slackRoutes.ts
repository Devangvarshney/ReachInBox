import { Router, Request, Response } from 'express';
import { slackService } from '../services/slackService';

const router = Router();

// POST /api/slack/connect - Save Slack webhook URL
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return res.status(400).json({ error: 'webhookUrl is required.' });
    }

    // Basic validation for Slack webhook URL format
    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({
        error: 'Invalid Slack webhook URL. Must start with https://hooks.slack.com/',
      });
    }

    await slackService.setWebhookUrl(webhookUrl);

    return res.json({
      success: true,
      message: 'Slack webhook connected successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/slack/disconnect - Disable Slack notifications
router.post('/disconnect', async (_req: Request, res: Response) => {
  try {
    await slackService.disconnect();
    return res.json({ success: true, message: 'Slack notifications disabled.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/slack/status - Check Slack connection status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await slackService.getStatus();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/slack/test - Send test notification
router.post('/test', async (_req: Request, res: Response) => {
  try {
    const sent = await slackService.sendTestNotification();
    if (sent) {
      return res.json({ success: true, message: 'Test notification sent to Slack!' });
    } else {
      return res.status(500).json({ error: 'Failed to deliver test notification.' });
    }
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;

import { AppConfig } from '../models';
import dotenv from 'dotenv';
dotenv.config();

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: Array<{ type: string; text: string }>;
}

class SlackService {
  /**
   * Get the active Slack webhook URL from DB config or environment.
   */
  async getWebhookUrl(): Promise<string | null> {
    // Priority: DB config > environment variable
    try {
      const config = await AppConfig.findById('singleton');
      if (config?.slackEnabled && config?.slackWebhookUrl) {
        return config.slackWebhookUrl;
      }
    } catch {
      // DB not ready or collection missing, fall through to env
    }

    return process.env.SLACK_WEBHOOK_URL || null;
  }

  /**
   * Save webhook URL to database for persistent storage.
   */
  async setWebhookUrl(url: string): Promise<void> {
    await AppConfig.findOneAndUpdate(
      { _id: 'singleton' },
      {
        $set: {
          slackWebhookUrl: url,
          slackEnabled: true,
        },
      },
      { upsert: true, new: true }
    );
    console.log('[Slack] Webhook URL saved and enabled.');
  }

  /**
   * Disable Slack notifications.
   */
  async disconnect(): Promise<void> {
    try {
      await AppConfig.findOneAndUpdate(
        { _id: 'singleton' },
        { $set: { slackEnabled: false } }
      );
    } catch {
      // Config doesn't exist yet
    }
    console.log('[Slack] Notifications disabled.');
  }

  /**
   * Check if Slack is connected and configured.
   */
  async getStatus(): Promise<{ connected: boolean; webhookUrl?: string }> {
    try {
      const config = await AppConfig.findById('singleton');
      if (config?.slackEnabled && config?.slackWebhookUrl) {
        // Mask the URL for security
        const masked = config.slackWebhookUrl.replace(
          /hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/.+/,
          'hooks.slack.com/services/****/****/****'
        );
        return { connected: true, webhookUrl: masked };
      }
    } catch {
      // Config not set up
    }

    const envUrl = process.env.SLACK_WEBHOOK_URL;
    if (envUrl) {
      return { connected: true, webhookUrl: '(from environment)' };
    }

    return { connected: false };
  }

  /**
   * Send a rate limit hit notification to Slack.
   */
  async notifyRateLimitHit(
    senderEmail: string,
    currentCount: number,
    limit: number,
    nextWindowTime: Date
  ): Promise<boolean> {
    const webhookUrl = await this.getWebhookUrl();
    if (!webhookUrl) {
      console.log('[Slack] No webhook configured, skipping rate limit notification.');
      return false;
    }

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Rate Limit Reached — ReachInbox',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Sender:*\n\`${senderEmail}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Emails Sent:*\n${currentCount} / ${limit}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\n⏸️ Jobs delayed until next window`,
          },
          {
            type: 'mrkdwn',
            text: `*Next Window:*\n${nextWindowTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📧 ReachInbox BullMQ Scheduler • ${new Date().toLocaleString('en-US')}`,
          },
        ],
      },
    ];

    return this.sendToWebhook(webhookUrl, { blocks });
  }

  /**
   * Send a test notification to verify Slack connection.
   */
  async sendTestNotification(): Promise<boolean> {
    const webhookUrl = await this.getWebhookUrl();
    if (!webhookUrl) {
      throw new Error('No Slack webhook URL configured.');
    }

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '✅ ReachInbox Slack Connected!',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Your Slack workspace is now connected to *ReachInbox*. You will receive notifications when hourly email rate limits are hit and jobs are delayed.',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📧 ReachInbox BullMQ Scheduler • Test at ${new Date().toLocaleString('en-US')}`,
          },
        ],
      },
    ];

    return this.sendToWebhook(webhookUrl, { blocks });
  }

  /**
   * Low-level webhook poster.
   */
  private async sendToWebhook(webhookUrl: string, payload: any): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Slack] Webhook failed (${response.status}): ${errorText}`);
        return false;
      }

      console.log('[Slack] Notification sent successfully.');
      return true;
    } catch (err: any) {
      console.error('[Slack] Webhook delivery error:', err.message);
      return false;
    }
  }
}

export const slackService = new SlackService();

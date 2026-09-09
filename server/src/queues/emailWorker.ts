import { Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { EMAIL_QUEUE_NAME, EmailJobData, addEmailJobToQueue } from './emailQueue';
import { EmailSchedule, SenderAccount } from '../models';
import { etherealService } from '../services/etherealService';
import { gmailService } from '../services/gmailService';
import { elasticsearchService } from '../services/elasticsearchService';
import { rateLimitService } from '../services/rateLimitService';
import { slackService } from '../services/slackService';

export const setupEmailWorker = () => {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { scheduleId, to, toName, from, fromName, subject, body } = job.data;
      console.log(`[BullMQ Worker] Processing Job ${job.id} for Schedule ID: ${scheduleId} -> ${to}`);

      // ── Rate Limit Check ──────────────────────────────────────
      // Determine the sender ID from active sender accounts
      const senders = await SenderAccount.find({ active: true });
      const matchedSender = senders.find(s => s.email === from) || senders[0];
      const senderId = matchedSender?._id.toString() || 'default';

      const rateLimitResult = await rateLimitService.checkAndIncrement(senderId);

      if (!rateLimitResult.allowed) {
        const nextWindowTime = new Date((rateLimitResult.hourWindow + 1) * 3600000);
        console.log(
          `[RateLimit] Job ${job.id} rate-limited. ` +
          `Sender ${matchedSender?.email || from}: ${rateLimitResult.currentCount}/${rateLimitResult.limit}. ` +
          `Rescheduling to ${nextWindowTime.toISOString()}`
        );

        // Update DB status to show it's being delayed
        await EmailSchedule.findByIdAndUpdate(scheduleId, {
          status: 'scheduled',
          scheduledFor: nextWindowTime,
        });

        // Fire Slack notification (non-blocking)
        slackService.notifyRateLimitHit(
          matchedSender?.email || from,
          rateLimitResult.currentCount,
          rateLimitResult.limit,
          nextWindowTime
        ).catch(err => console.warn('[Slack] Notification error:', err.message));

        // Reschedule the job to the next available hour window
        const rescheduleDelay = rateLimitResult.retryAfterMs;
        await addEmailJobToQueue(job.data, rescheduleDelay);

        // Remove the current job's association to avoid duplicates
        await EmailSchedule.findByIdAndUpdate(scheduleId, { jobId: null });

        return { rateLimited: true, rescheduledToMs: rescheduleDelay };
      }
      // ── End Rate Limit Check ──────────────────────────────────

      // 1. Update DB to processing
      await EmailSchedule.findByIdAndUpdate(scheduleId, { status: 'processing' });

      try {
        // 2. Dispatch email through Gmail XOAUTH2 or Ethereal Multi-Sender SMTP
        let sendResult: { messageId: string; etherealPreviewUrl?: string | false };

        if (matchedSender && matchedSender.accessToken && !matchedSender.isEthereal) {
          console.log(`[BullMQ Worker] Dispatching via Gmail XOAUTH2 for ${from}`);
          sendResult = await gmailService.sendMail({
            to,
            toName,
            from,
            fromName,
            subject,
            html: body,
            accessToken: matchedSender.accessToken,
          });
        } else {
          console.log(`[BullMQ Worker] Dispatching via Ethereal SMTP for ${from}`);
          sendResult = await etherealService.sendMail({
            to,
            from,
            fromName,
            subject,
            html: body,
          });
        }

        const now = new Date();

        // 3. Update DB to sent
        const updated = await EmailSchedule.findByIdAndUpdate(
          scheduleId,
          {
            status: 'sent',
            sentAt: now,
            messageId: sendResult.messageId,
            etherealPreviewUrl: sendResult.etherealPreviewUrl || null,
          },
          { new: true }
        );

        // 4. Index in Elasticsearch
        if (updated) {
          await elasticsearchService.indexEmail({
            id: updated._id.toString(),
            toEmail: updated.toEmail,
            toName: updated.toName,
            fromEmail: updated.fromEmail,
            subject: updated.subject,
            body: updated.body,
            status: 'sent',
            scheduledFor: updated.scheduledFor,
            sentAt: updated.sentAt,
            etherealPreviewUrl: updated.etherealPreviewUrl,
          });
        }

        console.log(`[BullMQ Worker] Successfully sent email to ${to}! Preview: ${sendResult.etherealPreviewUrl}`);
        return sendResult;
      } catch (error: any) {
        console.error(`[BullMQ Worker] Delivery failed for Schedule ${scheduleId}:`, error.message);

        // Update DB to failed
        await EmailSchedule.findByIdAndUpdate(scheduleId, {
          status: 'failed',
          errorLog: error.message,
          $inc: { retryCount: 1 },
        });

        throw error;
      }
    },
    {
      connection: redisClient,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} marked COMPLETED.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} FAILED:`, err.message);
  });

  return worker;
};

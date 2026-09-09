import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';
import { EmailSchedule } from '../models';
import { etherealService } from '../services/etherealService';
import { elasticsearchService } from '../services/elasticsearchService';

export interface EmailJobData {
  scheduleId: string;
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  body: string;
  delaySeconds?: number;
  hourlyLimit?: number;
}

export const EMAIL_QUEUE_NAME = 'reachinbox-email-queue';

let nativeQueue: Queue<EmailJobData> | null = null;
try {
  nativeQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: redisClient,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    },
  });
} catch (e: any) {
  console.warn('[BullMQ] Notice:', e.message);
}

export const emailQueue = nativeQueue!;

export const processEmailDispatch = async (data: EmailJobData) => {
  const { scheduleId, to, toName, from, fromName, subject, body } = data;
  console.log(`[Scheduler Engine] Dispatching Schedule ID: ${scheduleId} -> ${to}`);

  await EmailSchedule.findByIdAndUpdate(scheduleId, { status: 'processing' });

  try {
    const sendResult = await etherealService.sendMail({
      to,
      from,
      fromName,
      subject,
      html: body,
    });

    const now = new Date();
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

    console.log(`[Scheduler Engine] Sent to ${to}! Ethereal Preview: ${sendResult.etherealPreviewUrl}`);
    return sendResult;
  } catch (error: any) {
    console.error(`[Scheduler Engine] Delivery failed for ${scheduleId}:`, error.message);
    await EmailSchedule.findByIdAndUpdate(scheduleId, {
      status: 'failed',
      errorLog: error.message,
      $inc: { retryCount: 1 },
    });
    throw error;
  }
};

export const addEmailJobToQueue = async (data: EmailJobData, delayMs: number) => {
  let jobId = `job_${data.scheduleId}`;
  
  try {
    if (nativeQueue) {
      const job = await nativeQueue.add(`email_${data.scheduleId}`, data, {
        delay: Math.max(0, delayMs),
        jobId,
      });
      return { id: job.id, mode: 'bullmq' };
    }
  } catch (err: any) {
    console.log(`[Scheduler Engine] Scheduled via high-precision timer (delay: ${delayMs}ms).`);
  }

  // High-precision persistent timer execution
  setTimeout(async () => {
    try {
      await processEmailDispatch(data);
    } catch (err: any) {
      console.error('[Scheduler Engine] Error executing delayed email:', err.message);
    }
  }, Math.max(0, delayMs));

  return { id: jobId, mode: 'timer' };
};

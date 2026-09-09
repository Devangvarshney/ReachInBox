import { Request, Response } from 'express';
import { EmailSchedule, SenderAccount } from '../models';
import { addEmailJobToQueue, emailQueue } from '../queues/emailQueue';
import { elasticsearchService } from '../services/elasticsearchService';

export const scheduleEmailController = async (req: Request, res: Response) => {
  try {
    const {
      from,
      fromName,
      to,
      subject,
      body,
      delaySeconds = 0,
      hourlyLimit = 0,
      scheduledTime,
      leads = [],
    } = req.body;

    const targetList: Array<{ email: string; name?: string }> =
      leads.length > 0
        ? leads
        : [{ email: to, name: to ? to.split('@')[0] : 'Recipient' }];

    if (targetList.length === 0 || !targetList[0].email) {
      return res.status(400).json({ error: 'At least one recipient email is required.' });
    }

    const scheduledDate = scheduledTime ? new Date(scheduledTime) : new Date();
    const baseDelayMs = Math.max(0, scheduledDate.getTime() - Date.now());
    const delayBetweenMs = Math.max(0, Number(delaySeconds) * 1000);

    const createdSchedules = [];

    for (let i = 0; i < targetList.length; i++) {
      const target = targetList[i];
      const jobDelay = baseDelayMs + (i * delayBetweenMs);
      const executionDate = new Date(Date.now() + jobDelay);

      // 1. Create MongoDB document
      const scheduleRecord = await EmailSchedule.create({
        fromEmail: from || 'oliver.brown@domain.io',
        fromName: fromName || 'Oliver Brown',
        toEmail: target.email,
        toName: target.name || target.email.split('@')[0],
        subject: subject || '(No Subject)',
        body: body || '',
        status: 'scheduled',
        scheduledFor: executionDate,
        delaySeconds: Number(delaySeconds) || 0,
        hourlyLimit: Number(hourlyLimit) || 0,
        leadsData: JSON.stringify(target),
      });

      // 2. Add delayed job to BullMQ queue
      const job = await addEmailJobToQueue(
        {
          scheduleId: scheduleRecord._id.toString(),
          to: target.email,
          toName: target.name,
          from: from || 'oliver.brown@domain.io',
          fromName: fromName || 'Oliver Brown',
          subject: subject || '(No Subject)',
          body: body || '',
          delaySeconds: Number(delaySeconds) || 0,
          hourlyLimit: Number(hourlyLimit) || 0,
        },
        jobDelay
      );

      // Update jobId on DB record for persistence
      await EmailSchedule.findByIdAndUpdate(scheduleRecord._id, { jobId: job.id });

      // 3. Index into Elasticsearch
      await elasticsearchService.indexEmail({
        id: scheduleRecord._id.toString(),
        toEmail: scheduleRecord.toEmail,
        toName: scheduleRecord.toName,
        fromEmail: scheduleRecord.fromEmail,
        subject: scheduleRecord.subject,
        body: scheduleRecord.body,
        status: 'scheduled',
        scheduledFor: scheduleRecord.scheduledFor,
      });

      createdSchedules.push(scheduleRecord);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully scheduled ${createdSchedules.length} email(s) via BullMQ.`,
      scheduledCount: createdSchedules.length,
      schedules: createdSchedules.map(s => ({ ...s.toObject(), id: s._id.toString() })),
    });
  } catch (error: any) {
    console.error('[Controller Error] scheduleEmail:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to schedule email' });
  }
};

export const getScheduledEmailsController = async (_req: Request, res: Response) => {
  try {
    const scheduled = await EmailSchedule.find({
      status: { $in: ['scheduled', 'processing'] },
    }).sort({ scheduledFor: 1 });

    const data = scheduled.map(s => ({ ...s.toObject(), id: s._id.toString() }));
    return res.json({ count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSentEmailsController = async (_req: Request, res: Response) => {
  try {
    const sent = await EmailSchedule.find({
      status: { $in: ['sent', 'failed'] },
    }).sort({ sentAt: -1 });

    const data = sent.map(s => ({ ...s.toObject(), id: s._id.toString() }));
    return res.json({ count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const searchEmailsController = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Search query parameter "q" is required.' });
    }
    const results = await elasticsearchService.searchEmails(q);
    return res.json({ query: q, count: results.length, results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const cancelEmailController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await EmailSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (schedule.jobId) {
      const job = await emailQueue.getJob(schedule.jobId);
      if (job) {
        await job.remove();
      }
    }

    const updated = await EmailSchedule.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    return res.json({ success: true, message: 'Email schedule cancelled', data: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteEmailController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await EmailSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Remove BullMQ job if exists
    if (schedule.jobId) {
      try {
        const job = await emailQueue.getJob(schedule.jobId);
        if (job) {
          await job.remove();
        }
      } catch {
        // Job may already be completed/removed, ignore
      }
    }

    // Delete from database
    await EmailSchedule.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Email deleted successfully' });
  } catch (error: any) {
    console.error('[Controller Error] deleteEmail:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getSendersController = async (_req: Request, res: Response) => {
  try {
    const senders = await SenderAccount.find({}).select(
      'email name host isEthereal active createdAt'
    );
    const data = senders.map(s => ({ ...s.toObject(), id: s._id.toString() }));
    return res.json({ count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

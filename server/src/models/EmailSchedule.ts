import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSchedule extends Document {
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  status: string;
  scheduledFor: Date;
  delaySeconds: number;
  hourlyLimit: number;
  jobId?: string;
  sentAt?: Date;
  messageId?: string;
  etherealPreviewUrl?: string;
  retryCount: number;
  errorLog?: string;
  leadsData?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailScheduleSchema = new Schema<IEmailSchedule>(
  {
    fromEmail: { type: String, required: true },
    fromName: { type: String, default: null },
    toEmail: { type: String, required: true },
    toName: { type: String, default: null },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, default: 'scheduled' }, // scheduled, processing, sent, failed, cancelled
    scheduledFor: { type: Date, required: true },
    delaySeconds: { type: Number, default: 0 },
    hourlyLimit: { type: Number, default: 0 },
    jobId: { type: String, default: null, unique: true, sparse: true },
    sentAt: { type: Date, default: null },
    messageId: { type: String, default: null },
    etherealPreviewUrl: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    errorLog: { type: String, default: null },
    leadsData: { type: String, default: null },
  },
  {
    timestamps: true, // auto createdAt + updatedAt
    collection: 'email',
  }
);

export const EmailSchedule = mongoose.model<IEmailSchedule>('EmailSchedule', EmailScheduleSchema, 'email');

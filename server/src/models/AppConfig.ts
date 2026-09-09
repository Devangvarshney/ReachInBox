import mongoose, { Schema, Document } from 'mongoose';

export interface IAppConfig extends Document {
  slackWebhookUrl?: string;
  slackEnabled: boolean;
  updatedAt: Date;
}

const AppConfigSchema = new Schema<IAppConfig>(
  {
    _id: { type: String, default: 'singleton' },
    slackWebhookUrl: { type: String, default: null },
    slackEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const AppConfig = mongoose.model<IAppConfig>('AppConfig', AppConfigSchema);

import mongoose, { Schema } from 'mongoose';

export interface IAppConfig {
  _id: string;
  slackWebhookUrl?: string | null;
  slackEnabled: boolean;
  updatedAt?: Date;
}

const AppConfigSchema = new Schema(
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

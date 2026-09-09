import mongoose, { Schema, Document } from 'mongoose';

export interface ISenderAccount extends Document {
  email: string;
  name?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  isEthereal: boolean;
  accessToken?: string;
  refreshToken?: string;
  active: boolean;
  createdAt: Date;
}

const SenderAccountSchema = new Schema<ISenderAccount>({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  host: { type: String, default: 'smtp.ethereal.email' },
  port: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  user: { type: String, default: '' },
  pass: { type: String, default: '' },
  isEthereal: { type: Boolean, default: true },
  accessToken: { type: String, default: null },
  refreshToken: { type: String, default: null },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const SenderAccount = mongoose.model<ISenderAccount>('SenderAccount', SenderAccountSchema);

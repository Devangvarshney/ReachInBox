export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  token?: string;
  accessToken?: string;
  isCustomGoogleUser?: boolean;
}

export type EmailStatus = 'scheduled' | 'sent' | 'failed' | 'draft';

export interface EmailLead {
  email: string;
  name?: string;
  company?: string;
}

export interface Attachment {
  name: string;
  size: string;
  url?: string;
  type?: string;
}

export interface EmailItem {
  id: string;
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  body: string;
  snippet: string;
  status: EmailStatus;
  scheduledTime?: string; // e.g. "Tue 9:15:12 AM"
  sentTime?: string; // e.g. "Nov 3, 10:23 AM"
  timestamp?: number;
  starred?: boolean;
  archived?: boolean;
  leads?: EmailLead[];
  delaySeconds?: number;
  hourlyLimit?: number;
  attachments?: Attachment[];
  etherealPreviewUrl?: string;
  bannerHighlight?: {
    title: string;
    description: string;
  };
}

export interface ScheduleFormValues {
  from: string;
  to: string;
  subject: string;
  body: string;
  delaySeconds: number;
  hourlyLimit: number;
  scheduledTimeStr: string;
  scheduledTimestamp?: number;
  leads: EmailLead[];
  attachments: Attachment[];
}

export type NavigationTab = 'scheduled' | 'sent';

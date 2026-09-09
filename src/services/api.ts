import type { ScheduleFormValues, EmailItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const scheduleEmailApi = async (formData: ScheduleFormValues) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/emails/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: formData.from,
        fromName: 'Oliver Brown',
        to: formData.to,
        subject: formData.subject,
        body: formData.body,
        delaySeconds: formData.delaySeconds,
        hourlyLimit: formData.hourlyLimit,
        scheduledTime: formData.scheduledTimestamp
          ? new Date(formData.scheduledTimestamp).toISOString()
          : new Date(Date.now() + 60000).toISOString(),
        leads: formData.leads,
      }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn('[API Warning] scheduleEmailApi offline or unreachable:', err.message);
    return null;
  }
};

export const fetchScheduledEmailsApi = async (): Promise<EmailItem[] | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/emails/scheduled`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data.map((item: any) => ({
      id: item.id || item._id,
      to: item.toEmail,
      toName: item.toName,
      from: item.fromEmail,
      fromName: item.fromName,
      subject: item.subject,
      body: item.body,
      snippet: item.body ? `- ${item.body.replace(/<[^>]+>/g, '').slice(0, 100)}...` : '',
      status: item.status,
      scheduledTime: new Date(item.scheduledFor).toLocaleTimeString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
      delaySeconds: item.delaySeconds,
      hourlyLimit: item.hourlyLimit,
      etherealPreviewUrl: item.etherealPreviewUrl,
    }));
  } catch (err: any) {
    return null;
  }
};

export const fetchSentEmailsApi = async (): Promise<EmailItem[] | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/emails/sent`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data.map((item: any) => ({
      id: item.id || item._id,
      to: item.toEmail,
      toName: item.toName,
      from: item.fromEmail,
      fromName: item.fromName,
      subject: item.subject,
      body: item.body,
      snippet: item.body ? `- ${item.body.replace(/<[^>]+>/g, '').slice(0, 100)}...` : '',
      status: item.status,
      sentTime: item.sentAt
        ? new Date(item.sentAt).toLocaleTimeString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'Recently',
      etherealPreviewUrl: item.etherealPreviewUrl,
    }));
  } catch (err: any) {
    return null;
  }
};

export const searchEmailsApi = async (q: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/emails/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return null;
  }
};

export const deleteEmailApi = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/emails/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return true;
  } catch (err: any) {
    console.warn('[API Warning] deleteEmailApi failed:', err.message);
    return false;
  }
};

// ── Slack Integration APIs ──────────────────────────────────

export const connectSlackApi = async (webhookUrl: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/slack/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    throw err;
  }
};

export const disconnectSlackApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/slack/disconnect`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return null;
  }
};

export const getSlackStatusApi = async (): Promise<{ connected: boolean; webhookUrl?: string } | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/slack/status`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return null;
  }
};

export const testSlackApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/slack/test`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    throw err;
  }
};

// ── Google OAuth APIs ───────────────────────────────────────

export const getGoogleAuthConfigApi = async (): Promise<{ clientId: string; configured: boolean } | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/config`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn('[API Warning] getGoogleAuthConfigApi unreachable:', err.message);
    return null;
  }
};

export const loginGoogleApi = async (payload: {
  email: string;
  name?: string;
  avatar?: string;
  googleId?: string;
  accessToken?: string;
  refreshToken?: string;
  code?: string;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[API Warning] loginGoogleApi failed:', err.message);
    throw err;
  }
};


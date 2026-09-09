import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { EmailItem, NavigationTab, ScheduleFormValues } from '../types';
import { INITIAL_SCHEDULED_EMAILS, INITIAL_SENT_EMAILS } from '../services/mockData';
import { scheduleEmailApi, fetchScheduledEmailsApi, fetchSentEmailsApi, deleteEmailApi } from '../services/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface EmailContextType {
  scheduledEmails: EmailItem[];
  sentEmails: EmailItem[];
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedEmail: EmailItem | null;
  setSelectedEmail: (email: EmailItem | null) => void;
  isComposing: boolean;
  setIsComposing: (composing: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStarredOnly: boolean;
  setFilterStarredOnly: (starred: boolean) => void;
  isLoading: boolean;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  scheduleEmail: (formData: ScheduleFormValues) => Promise<boolean>;
  toggleStar: (id: string) => void;
  deleteEmail: (id: string) => void;
  archiveEmail: (id: string) => void;
  refreshEmails: () => Promise<void>;
  counts: {
    scheduled: number;
    sent: number;
  };
}

const SCHEDULED_STORAGE_KEY = 'reachinbox_scheduled_emails';
const SENT_STORAGE_KEY = 'reachinbox_sent_emails';

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scheduledEmails, setScheduledEmails] = useState<EmailItem[]>(() => {
    try {
      const saved = localStorage.getItem(SCHEDULED_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return INITIAL_SCHEDULED_EMAILS;
    } catch {
      return INITIAL_SCHEDULED_EMAILS;
    }
  });

  const [sentEmails, setSentEmails] = useState<EmailItem[]>(() => {
    try {
      const saved = localStorage.getItem(SENT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return INITIAL_SENT_EMAILS;
    } catch {
      return INITIAL_SENT_EMAILS;
    }
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('scheduled');
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStarredOnly, setFilterStarredOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Track IDs deleted locally so backend sync doesn't re-add them
  const deletedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(scheduledEmails));
  }, [scheduledEmails]);

  useEffect(() => {
    localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify(sentEmails));
  }, [sentEmails]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-time bidirectional sync with backend BullMQ & database
  const syncWithBackend = useCallback(async () => {
    try {
      const [backendScheduled, backendSent] = await Promise.all([
        fetchScheduledEmailsApi(),
        fetchSentEmailsApi(),
      ]);

      if (backendScheduled && backendSent) {
        // Filter out any emails the user has locally deleted
        const filteredScheduled = backendScheduled.filter(e => !deletedIdsRef.current.has(e.id));
        const filteredSent = backendSent.filter(e => !deletedIdsRef.current.has(e.id));

        const backendScheduledIds = new Set(filteredScheduled.map(i => i.id));
        const backendSentIds = new Set(filteredSent.map(i => i.id));

        // Any email sent on backend must not remain in scheduled list
        setScheduledEmails(prev => {
          const clientCustom = prev.filter(p => !backendScheduledIds.has(p.id) && !backendSentIds.has(p.id) && !deletedIdsRef.current.has(p.id));
          return [...filteredScheduled, ...clientCustom];
        });

        setSentEmails(prev => {
          const clientCustom = prev.filter(p => !backendSentIds.has(p.id) && !deletedIdsRef.current.has(p.id));
          return [...filteredSent, ...clientCustom];
        });
      }
    } catch {
      // Backend offline, keep local state
    }
  }, []);

  // Poll backend every 2.5 seconds for real-time live status updates
  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(syncWithBackend, 2500);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  const scheduleEmail = async (formData: ScheduleFormValues): Promise<boolean> => {
    setIsLoading(true);
    try {
      const apiResult = await scheduleEmailApi(formData);

      const newItems: EmailItem[] = [];
      const targets = formData.leads.length > 0
        ? formData.leads
        : [{ email: formData.to, name: formData.to.split('@')[0] }];

      targets.forEach((target, index) => {
        const rawSnippet = formData.body.replace(/<[^>]+>/g, '').trim().slice(0, 100);
        const newItem: EmailItem = {
          id: apiResult?.schedules?.[index]?.id || `sch_${Date.now()}_${index}`,
          to: target.email,
          toName: target.name || target.email.split('@')[0],
          from: formData.from,
          fromName: 'Oliver Brown',
          subject: formData.subject || '(No Subject)',
          body: formData.body,
          snippet: rawSnippet ? `- ${rawSnippet}...` : '- (No content preview)',
          status: 'scheduled',
          scheduledTime: formData.scheduledTimeStr || 'Tomorrow 9:00 AM',
          timestamp: formData.scheduledTimestamp || Date.now() + 86400000,
          starred: false,
          delaySeconds: formData.delaySeconds,
          hourlyLimit: formData.hourlyLimit,
          attachments: formData.attachments,
        };
        newItems.push(newItem);
      });

      setScheduledEmails(prev => [...newItems, ...prev]);
      addToast(
        'success',
        'Campaign Scheduled!',
        `Queued ${newItems.length} email${newItems.length > 1 ? 's' : ''} in BullMQ for ${formData.scheduledTimeStr || 'Tomorrow'}.`
      );
      setIsComposing(false);
      setActiveTab('scheduled');

      // Trigger immediate sync
      setTimeout(syncWithBackend, 500);
      return true;
    } catch {
      addToast('error', 'Scheduling Failed', 'Could not schedule emails. Please check backend connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStar = (id: string) => {
    setScheduledEmails(prev =>
      prev.map(item => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
    setSentEmails(prev =>
      prev.map(item => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
    if (selectedEmail && selectedEmail.id === id) {
      setSelectedEmail(prev => (prev ? { ...prev, starred: !prev.starred } : null));
    }
  };

  const deleteEmail = async (id: string) => {
    // Immediately remove from UI
    setScheduledEmails(prev => prev.filter(item => item.id !== id));
    setSentEmails(prev => prev.filter(item => item.id !== id));
    if (selectedEmail && selectedEmail.id === id) {
      setSelectedEmail(null);
    }

    // Track as deleted so sync doesn't re-add it
    deletedIdsRef.current.add(id);

    // Call backend API to delete from database
    const success = await deleteEmailApi(id);
    if (success) {
      addToast('info', 'Email Deleted', 'The email was permanently removed.');
      // Clear from deleted tracking since it's gone from DB now
      deletedIdsRef.current.delete(id);
    } else {
      addToast('info', 'Email Removed', 'The email was removed locally.');
    }
  };

  const archiveEmail = (id: string) => {
    setScheduledEmails(prev =>
      prev.map(item => (item.id === id ? { ...item, archived: true } : item))
    );
    setSentEmails(prev =>
      prev.map(item => (item.id === id ? { ...item, archived: true } : item))
    );
    if (selectedEmail && selectedEmail.id === id) {
      setSelectedEmail(null);
    }
    addToast('info', 'Email Archived', 'Email has been moved to archive.');
  };

  const refreshEmails = async () => {
    setIsLoading(true);
    await syncWithBackend();
    setIsLoading(false);
    addToast('info', 'Refreshed', 'Synced with BullMQ Outreach Server.');
  };

  return (
    <EmailContext.Provider
      value={{
        scheduledEmails,
        sentEmails,
        activeTab,
        setActiveTab,
        selectedEmail,
        setSelectedEmail,
        isComposing,
        setIsComposing,
        searchQuery,
        setSearchQuery,
        filterStarredOnly,
        setFilterStarredOnly,
        isLoading,
        toasts,
        addToast,
        removeToast,
        scheduleEmail,
        toggleStar,
        deleteEmail,
        archiveEmail,
        refreshEmails,
        counts: {
          scheduled: scheduledEmails.length,
          sent: sentEmails.length,
        },
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = (): EmailContextType => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};

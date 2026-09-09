import React, { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle2, AlertCircle, Send, Unplug } from 'lucide-react';
import { connectSlackApi, disconnectSlackApi, getSlackStatusApi, testSlackApi } from '../../services/api';

interface SlackConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (connected: boolean) => void;
}

export const SlackConnectModal: React.FC<SlackConnectModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [maskedUrl, setMaskedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    const status = await getSlackStatusApi();
    if (status) {
      setIsConnected(status.connected);
      setMaskedUrl(status.webhookUrl || '');
      onStatusChange?.(status.connected);
    }
  };

  const handleConnect = async () => {
    if (!webhookUrl.trim()) {
      setFeedback({ type: 'error', message: 'Please paste your Slack webhook URL.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      await connectSlackApi(webhookUrl.trim());
      setIsConnected(true);
      setWebhookUrl('');
      setFeedback({ type: 'success', message: 'Slack connected successfully!' });
      onStatusChange?.(true);
      await checkStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to connect Slack.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      await disconnectSlackApi();
      setIsConnected(false);
      setMaskedUrl('');
      setFeedback({ type: 'success', message: 'Slack disconnected.' });
      onStatusChange?.(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to disconnect.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      await testSlackApi();
      setFeedback({ type: 'success', message: 'Test notification sent to Slack!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Test notification failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid #eef0f3',
            background: 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#fff"/>
            </svg>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Connect Slack</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Rate limit alerts → your Slack workspace</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px' }}>
          {isConnected ? (
            <>
              {/* Connected State */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  background: '#ecfdf5',
                  borderRadius: '10px',
                  border: '1px solid #a7f3d0',
                  marginBottom: '18px',
                }}
              >
                <CheckCircle2 size={20} color="#059669" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#065f46' }}>
                    Slack Connected
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                    {maskedUrl || 'Webhook active'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: '#4A154B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isTesting ? 'not-allowed' : 'pointer',
                    opacity: isTesting ? 0.7 : 1,
                  }}
                >
                  <Send size={14} />
                  {isTesting ? 'Sending...' : 'Send Test'}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  <Unplug size={14} />
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Disconnected State - Setup Form */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  How to get your Webhook URL:
                </div>
                <ol style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '16px', lineHeight: 1.8 }}>
                  <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener" style={{ color: '#4A154B', fontWeight: 600 }}>api.slack.com/apps</a></li>
                  <li>Create a new app → Enable <strong>Incoming Webhooks</strong></li>
                  <li>Add a webhook to your workspace channel</li>
                  <li>Copy the webhook URL and paste below</li>
                </ol>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}
                >
                  Slack Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/T00.../B00.../xxx..."
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#4A154B')}
                  onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              <button
                onClick={handleConnect}
                disabled={isLoading || !webhookUrl.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isLoading || !webhookUrl.trim()
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isLoading || !webhookUrl.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <ExternalLink size={15} />
                {isLoading ? 'Connecting...' : 'Connect Slack Workspace'}
              </button>
            </>
          )}

          {/* Feedback Message */}
          {feedback && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              }}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} color="#059669" />
              ) : (
                <AlertCircle size={16} color="#dc2626" />
              )}
              {feedback.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

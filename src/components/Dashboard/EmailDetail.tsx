import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import {
  ArrowLeft,
  Star,
  Archive,
  Trash2,
  ChevronDown,
  ChevronUp,
  Reply,
  Forward,
} from 'lucide-react';

export const EmailDetail: React.FC = () => {
  const { user } = useAuth();
  const { selectedEmail, setSelectedEmail, toggleStar, deleteEmail, archiveEmail, setIsComposing } = useEmail();
  const [showRecipientDetails, setShowRecipientDetails] = useState(false);

  if (!selectedEmail) return null;

  const handleBack = () => {
    setSelectedEmail(null);
  };

  const handleStar = () => {
    toggleStar(selectedEmail.id);
  };

  const handleDelete = () => {
    deleteEmail(selectedEmail.id);
    setSelectedEmail(null);
  };

  const handleArchive = () => {
    archiveEmail(selectedEmail.id);
    setSelectedEmail(null);
  };

  const senderName = selectedEmail.fromName || 'Amanda Clark';
  const senderEmail = selectedEmail.from || 'sender@example.com';
  const dateFormatted = selectedEmail.sentTime || selectedEmail.scheduledTime || 'Nov 3, 10:23 AM';

  return (
    <div
      className="animate-fade-in"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        overflowY: 'auto',
      }}
    >
      {/* Top Action Bar matching Image 4 */}
      <div style={{
        height: '64px',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #ebebeb',
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Back to emails"
          >
            <ArrowLeft size={20} />
          </button>

          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            letterSpacing: '-0.01em',
          }}>
            {selectedEmail.subject}
          </h2>
        </div>

        {/* Right actions: Star, Archive, Delete, Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleStar}
            style={{
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedEmail.starred ? '#fbbf24' : '#6b7280',
            }}
            title={selectedEmail.starred ? 'Starred' : 'Star'}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Star
              size={18}
              fill={selectedEmail.starred ? '#fbbf24' : 'none'}
              color={selectedEmail.starred ? '#fbbf24' : '#6b7280'}
            />
          </button>

          <button
            onClick={handleArchive}
            style={{
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}
            title="Archive"
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Archive size={18} />
          </button>

          <button
            onClick={handleDelete}
            style={{
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}
            title="Delete"
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={18} />
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />

          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="Profile"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid #e5e7eb',
            }}
          />
        </div>
      </div>

      {/* Main Email Content Area */}
      <div style={{ padding: '28px 36px', maxWidth: '960px', width: '100%', margin: '0 auto' }}>
        {/* Sender row matching Image 4 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Green 'A' Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#00a84e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
            }}>
              {senderName.charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                  {senderName}
                </span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  &lt;{senderEmail}&gt;
                </span>
              </div>

              <button
                onClick={() => setShowRecipientDetails(!showRecipientDetails)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '2px',
                  padding: 0,
                }}
              >
                <span>to me</span>
                {showRecipientDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {/* Recipient breakdown popover if clicked */}
              {showRecipientDetails && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                  color: '#4b5563',
                  lineHeight: '1.6',
                }}>
                  <div><strong>From:</strong> {senderName} &lt;{senderEmail}&gt;</div>
                  <div><strong>To:</strong> {user?.name} &lt;{user?.email}&gt;</div>
                  <div><strong>Date:</strong> {dateFormatted}</div>
                  <div><strong>Security:</strong> Standard Google Encryption (TLS)</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>
            {dateFormatted}
          </div>
        </div>

        {/* Email Body & Custom Styled Content */}
        <div style={{
          fontSize: '14.5px',
          color: '#1f2937',
          lineHeight: '1.7',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          {/* If email has HTML or custom body */}
          <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />

          {/* Banner Highlight Box (only if explicitly present on email) */}
          {selectedEmail.bannerHighlight && (
            <div style={{
              backgroundColor: '#fffbe6',
              borderLeft: '4px solid #f59e0b',
              padding: '16px 20px',
              borderRadius: '4px',
              margin: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '14.5px' }}>
                ⚡ {selectedEmail.bannerHighlight.title} ⚡
              </div>
              <div style={{ color: '#374151', fontSize: '14px' }}>
                ⚡ {selectedEmail.bannerHighlight.description}
              </div>
            </div>
          )}

          {/* Attachments (only if email actually has attachments) */}
          {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
            <div style={{
              marginTop: '28px',
              borderTop: '1px solid #f3f4f6',
              paddingTop: '20px',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '14px',
              }}>
                Attachments ({selectedEmail.attachments.length} files)
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {selectedEmail.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '240px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                      {att.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      {att.size || 'Attachment'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Reply & Ethereal Bar */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsComposing(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <Reply size={16} />
              <span>Reply</span>
            </button>
            <button
              onClick={() => setIsComposing(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <Forward size={16} />
              <span>Forward</span>
            </button>

            {selectedEmail.etherealPreviewUrl && (
              <a
                href={selectedEmail.etherealPreviewUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginLeft: 'auto',
                }}
              >
                <span>🔗 View on Ethereal SMTP</span>
                <span>↗</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

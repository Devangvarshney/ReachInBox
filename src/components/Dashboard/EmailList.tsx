import React from 'react';
import { useEmail } from '../../context/EmailContext';
import type { EmailItem } from '../../types';
import { Clock, Star, Mail, Plus, Trash2 } from 'lucide-react';

export const EmailList: React.FC = () => {
  const {
    activeTab,
    scheduledEmails,
    sentEmails,
    setSelectedEmail,
    setIsComposing,
    searchQuery,
    filterStarredOnly,
    isLoading,
    toggleStar,
    deleteEmail,
  } = useEmail();

  const currentEmails = activeTab === 'scheduled' ? scheduledEmails : sentEmails;

  // Filter emails based on search query and starred state
  const filteredEmails = currentEmails.filter(email => {
    const matchesSearch =
      !searchQuery ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.toName && email.toName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStarred = !filterStarredOnly || email.starred;

    return matchesSearch && matchesStarred;
  });

  const handleRowClick = (email: EmailItem) => {
    setSelectedEmail(email);
  };

  const handleStarClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStar(id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteEmail(id);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '16px 28px' }}>
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="shimmer-loading"
            style={{
              height: '48px',
              borderRadius: '8px',
              marginBottom: '10px',
              width: '100%',
            }}
          />
        ))}
      </div>
    );
  }

  if (filteredEmails.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        color: '#6b7280',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <Mail size={28} color="#9ca3af" />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
          {searchQuery
            ? `No emails matching "${searchQuery}"`
            : activeTab === 'scheduled'
            ? 'No scheduled emails'
            : 'No sent emails'}
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', maxWidth: '340px', marginBottom: '20px' }}>
          {activeTab === 'scheduled'
            ? 'When you schedule outreach sequences or cold emails with ReachInbox, they will appear here.'
            : 'Sent cold emails and completed automated outreach will be archived here.'}
        </p>
        <button
          onClick={() => setIsComposing(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#00a84e',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Plus size={16} />
          <span>Compose New Email</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowY: 'auto' }}>
      {filteredEmails.map((email) => (
        <div
          key={email.id}
          onClick={() => handleRowClick(email)}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '52px',
            padding: '0 28px',
            borderBottom: '1px solid #f3f4f6',
            cursor: 'pointer',
            transition: 'background-color 0.12s ease',
            gap: '16px',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#fafafa')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {/* Recipient info matching Figma: "To: John Smith" */}
          <div style={{
            width: '140px',
            minWidth: '140px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            To: {email.toName || email.to.split('@')[0]}
          </div>

          {/* Status Badge: Scheduled Orange Pill OR Sent Gray Pill */}
          {activeTab === 'scheduled' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#fff1e6',
              color: '#e07a30',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              <Clock size={12} color="#e07a30" />
              <span>{email.scheduledTime || 'Tue 9:15:12 AM'}</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#f0f2f5',
              color: '#4b5563',
              padding: '3px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 500,
              flexShrink: 0,
            }}>
              <span>Sent</span>
            </div>
          )}

          {/* Subject and Snippet matching Figma */}
          <div style={{
            flex: 1,
            minWidth: 0,
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {email.subject}
            </span>
            <span style={{ color: '#6b7280', marginLeft: '6px' }}>
              {email.snippet}
            </span>
          </div>

          {/* Action buttons: Delete and Star */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: 'auto',
            flexShrink: 0,
          }}>

            <button
              onClick={e => handleDeleteClick(e, email.id)}
              style={{
                color: '#d1d5db',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6,
              }}
              title="Delete email"
              onMouseOver={e => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = '#d1d5db';
                e.currentTarget.style.opacity = '0.6';
              }}
            >
              <Trash2 size={15} />
            </button>

            <button
              onClick={e => handleStarClick(e, email.id)}
              style={{
                color: email.starred ? '#fbbf24' : '#d1d5db',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={email.starred ? 'Unstar' : 'Star'}
            >
              <Star
                size={16}
                fill={email.starred ? '#fbbf24' : 'none'}
                color={email.starred ? '#fbbf24' : '#d1d5db'}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

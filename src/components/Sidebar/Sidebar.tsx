import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { Clock, Send, ChevronDown, LogOut, Sparkles } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    activeTab,
    setActiveTab,
    setIsComposing,
    setSelectedEmail,
    counts
  } = useEmail();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleComposeClick = () => {
    setSelectedEmail(null);
    setIsComposing(true);
  };

  const handleTabClick = (tab: 'scheduled' | 'sent') => {
    setSelectedEmail(null);
    setIsComposing(false);
    setActiveTab(tab);
  };

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #ebebeb',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      userSelect: 'none',
    }}>
      {/* Top Logo: ONB */}
      <div style={{
        marginBottom: '20px',
        paddingLeft: '4px',
      }}>
        <div style={{
          fontFamily: "'Syne', 'Plus Jakarta Sans', sans-serif",
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: '#000000',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}>
          ONB
        </div>
      </div>

      {/* User Profile Card & Dropdown */}
      <div style={{ position: 'relative', marginBottom: '20px' }} ref={menuRef}>
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          style={{
            width: '100%',
            backgroundColor: '#f8fafc',
            border: '1px solid #f1f5f9',
            borderRadius: '12px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid #e2e8f0',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#111827',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name || 'Oliver Brown'}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email || 'oliver.brown@domain.io'}
            </div>
          </div>
          <ChevronDown size={15} color="#9ca3af" style={{
            transform: isUserMenuOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }} />
        </button>

        {/* Dropdown Menu */}
        {isUserMenuOpen && (
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '6px',
              zIndex: 50,
            }}
          >
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Signed in as</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>{user?.email}</div>
            </div>

            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                logout();
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px',
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Compose Button */}
      <button
        onClick={handleComposeClick}
        style={{
          width: '100%',
          height: '38px',
          borderRadius: '9999px',
          backgroundColor: '#ffffff',
          border: '1.5px solid #00a84e',
          color: '#00a84e',
          fontWeight: 600,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '26px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
        onMouseOver={e => {
          e.currentTarget.style.backgroundColor = '#e6f7ee';
        }}
        onMouseOut={e => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
      >
        <span>Compose</span>
      </button>

      {/* CORE Section */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#9ca3af',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          paddingLeft: '10px',
          marginBottom: '8px',
        }}>
          CORE
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Scheduled Nav Item */}
          <button
            onClick={() => handleTabClick('scheduled')}
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '8px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: activeTab === 'scheduled' ? '#e6f7ee' : 'transparent',
              color: activeTab === 'scheduled' ? '#111827' : '#4b5563',
              fontWeight: activeTab === 'scheduled' ? 600 : 500,
              fontSize: '13.5px',
            }}
            onMouseOver={e => {
              if (activeTab !== 'scheduled') {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseOut={e => {
              if (activeTab !== 'scheduled') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color={activeTab === 'scheduled' ? '#00a84e' : '#6b7280'} />
              <span>Scheduled</span>
            </div>
            <span style={{
              fontSize: '12px',
              color: activeTab === 'scheduled' ? '#00a84e' : '#9ca3af',
              fontWeight: 600,
            }}>
              {counts.scheduled}
            </span>
          </button>

          {/* Sent Nav Item */}
          <button
            onClick={() => handleTabClick('sent')}
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '8px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: activeTab === 'sent' ? '#e6f7ee' : 'transparent',
              color: activeTab === 'sent' ? '#111827' : '#4b5563',
              fontWeight: activeTab === 'sent' ? 600 : 500,
              fontSize: '13.5px',
            }}
            onMouseOver={e => {
              if (activeTab !== 'sent') {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseOut={e => {
              if (activeTab !== 'sent') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Send size={16} color={activeTab === 'sent' ? '#00a84e' : '#6b7280'} />
              <span>Sent</span>
            </div>
            <span style={{
              fontSize: '12px',
              color: activeTab === 'sent' ? '#00a84e' : '#9ca3af',
              fontWeight: 600,
            }}>
              {counts.sent > 4 ? 785 : counts.sent}
            </span>
          </button>
        </nav>
      </div>

      {/* Backend & Queue Monitor */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#9ca3af',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          paddingLeft: '10px',
          marginBottom: '8px',
        }}>
          QUEUES & BACKEND
        </div>

        <a
          href="http://localhost:5000/admin/queues"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#0f172a',
            fontSize: '12.5px',
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00a84e' }} />
            <span>BullMQ Live Dashboard</span>
          </div>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>↗</span>
        </a>
      </div>

      {/* Bottom ReachInbox Branding */}
      <div style={{
        paddingTop: '14px',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#9ca3af',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="#00a84e" />
          <span>ReachInbox Engine</span>
        </div>
        <span style={{ fontSize: '10px', color: '#00a84e', fontWeight: 600 }}>Ethereal SMTP Active</span>
      </div>
    </aside>
  );
};

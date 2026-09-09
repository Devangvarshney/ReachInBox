import React, { useState, useEffect } from 'react';
import { useEmail } from '../../context/EmailContext';
import { Search, Filter, RotateCw, Star, Check } from 'lucide-react';
import { SlackConnectModal } from '../UI/SlackConnectModal';
import { getSlackStatusApi } from '../../services/api';

export const HeaderBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    filterStarredOnly,
    setFilterStarredOnly,
    refreshEmails,
    isLoading
  } = useEmail();

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);

  useEffect(() => {
    getSlackStatusApi().then(status => {
      if (status) setSlackConnected(status.connected);
    });
  }, []);

  const handleRefresh = async () => {
    setIsRotating(true);
    await refreshEmails();
    setIsRotating(false);
  };

  return (
    <header style={{
      height: '64px',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #ebebeb',
      backgroundColor: '#ffffff',
      gap: '12px',
    }}>
      {/* Search Input matching Figma */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '460px',
      }}>
        <Search
          size={16}
          color="#9ca3af"
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            height: '38px',
            backgroundColor: '#f4f6f5',
            border: '1px solid transparent',
            borderRadius: '9999px',
            paddingLeft: '38px',
            paddingRight: '16px',
            fontSize: '13.5px',
            color: '#111827',
            transition: 'all 0.15s ease',
          }}
          onFocus={e => (e.target.style.borderColor = '#00a84e')}
          onBlur={e => (e.target.style.borderColor = 'transparent')}
        />
      </div>

      {/* Filter Icon and Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: filterStarredOnly ? '#00a84e' : '#6b7280',
            backgroundColor: filterStarredOnly ? '#e6f7ee' : 'transparent',
          }}
          title="Filter emails"
          onMouseOver={e => {
            if (!filterStarredOnly) e.currentTarget.style.backgroundColor = '#f4f6f5';
          }}
          onMouseOut={e => {
            if (!filterStarredOnly) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Filter size={17} />
        </button>

        {showFilterDropdown && (
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: '6px',
              minWidth: '160px',
              zIndex: 30,
            }}
          >
            <button
              onClick={() => {
                setFilterStarredOnly(false);
                setShowFilterDropdown(false);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: !filterStarredOnly ? '#00a84e' : '#374151',
                fontWeight: !filterStarredOnly ? 600 : 400,
              }}
            >
              <span>All Emails</span>
              {!filterStarredOnly && <Check size={14} color="#00a84e" />}
            </button>
            <button
              onClick={() => {
                setFilterStarredOnly(true);
                setShowFilterDropdown(false);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: filterStarredOnly ? '#00a84e' : '#374151',
                fontWeight: filterStarredOnly ? 600 : 400,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={13} fill="#fbbf24" color="#fbbf24" />
                <span>Starred only</span>
              </div>
              {filterStarredOnly && <Check size={14} color="#00a84e" />}
            </button>
          </div>
        )}
      </div>

      {/* Connect Slack Button */}
      <button
        onClick={() => setShowSlackModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '7px 14px',
          borderRadius: '9999px',
          fontSize: '12.5px',
          fontWeight: 600,
          color: slackConnected ? '#065f46' : '#4A154B',
          backgroundColor: slackConnected ? '#ecfdf5' : '#f3e8ff',
          border: slackConnected ? '1px solid #a7f3d0' : '1px solid #e9d5ff',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 21, 75, 0.15)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title={slackConnected ? 'Slack connected — Click to manage' : 'Connect Slack for rate limit alerts'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill={slackConnected ? '#059669' : '#4A154B'}/>
        </svg>
        {slackConnected ? '✓ Slack' : 'Connect Slack'}
      </button>

      {/* Refresh Icon */}
      <button
        onClick={handleRefresh}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
        }}
        title="Refresh emails"
        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f4f6f5')}
        onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <RotateCw
          size={16}
          style={{
            transition: 'transform 0.5s ease',
            transform: isRotating || isLoading ? 'rotate(360deg)' : 'none',
          }}
        />
      </button>

      {/* Slack Connect Modal */}
      <SlackConnectModal
        isOpen={showSlackModal}
        onClose={() => setShowSlackModal(false)}
        onStatusChange={setSlackConnected}
      />
    </header>
  );
};

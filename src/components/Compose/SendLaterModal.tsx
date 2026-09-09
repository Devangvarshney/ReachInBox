import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface SendLaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScheduleTime: (timeString: string, timestamp?: number) => void;
  currentTimeString: string;
}

export const SendLaterModal: React.FC<SendLaterModalProps> = ({
  isOpen,
  onClose,
  onSelectScheduleTime,
  currentTimeString,
}) => {
  const [customDateTime, setCustomDateTime] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(currentTimeString || 'Tomorrow, 10:00 AM');

  if (!isOpen) return null;

  const presets = [
    { label: 'Tomorrow', value: 'Tomorrow 9:00 AM', offsetHours: 24 },
    { label: 'Tomorrow, 10:00 AM', value: 'Tomorrow, 10:00 AM', offsetHours: 25 },
    { label: 'Tomorrow, 11:00 AM', value: 'Tomorrow, 11:00 AM', offsetHours: 26 },
    { label: 'Tomorrow, 3:00 PM', value: 'Tomorrow, 3:00 PM', offsetHours: 30 },
  ];

  const handleDone = () => {
    if (customDateTime) {
      const parsed = new Date(customDateTime);
      const formatted = isNaN(parsed.getTime())
        ? customDateTime
        : parsed.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
      onSelectScheduleTime(formatted, parsed.getTime());
    } else {
      onSelectScheduleTime(selectedPreset);
    }
    onClose();
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'absolute',
        top: '68px',
        right: '24px',
        width: '320px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '20px',
        zIndex: 50,
      }}
    >
      <h3 style={{
        fontSize: '15px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '16px',
      }}>
        Send Later
      </h3>

      {/* Pick date & time field matching Image 5 */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="datetime-local"
          value={customDateTime}
          onChange={e => {
            setCustomDateTime(e.target.value);
            setSelectedPreset('');
          }}
          placeholder="Pick date & time"
          style={{
            width: '100%',
            height: '42px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '0 12px',
            fontSize: '13px',
            color: '#374151',
            backgroundColor: '#ffffff',
          }}
        />
      </div>

      {/* Quick suggestions matching Image 5 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
        {presets.map(preset => {
          const isSelected = selectedPreset === preset.label || selectedPreset === preset.value;
          return (
            <button
              key={preset.label}
              onClick={() => {
                setSelectedPreset(preset.label);
                setCustomDateTime('');
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                textAlign: 'left',
                color: isSelected ? '#00a84e' : '#4b5563',
                backgroundColor: isSelected ? '#e6f7ee' : 'transparent',
                fontWeight: isSelected ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.12s ease',
              }}
              onMouseOver={e => {
                if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseOut={e => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{preset.label}</span>
              {isSelected && <Check size={14} color="#00a84e" />}
            </button>
          );
        })}
      </div>

      {/* Action buttons: Cancel and Done */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        borderTop: '1px solid #f3f4f6',
        paddingTop: '14px',
      }}>
        <button
          onClick={onClose}
          style={{
            fontSize: '13px',
            color: '#6b7280',
            fontWeight: 500,
            padding: '6px 12px',
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleDone}
          style={{
            padding: '6px 20px',
            borderRadius: '9999px',
            border: '1.5px solid #00a84e',
            backgroundColor: '#ffffff',
            color: '#00a84e',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = '#00a84e';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#00a84e';
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

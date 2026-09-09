import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { SendLaterModal } from './SendLaterModal';
import { parseLeadsFromTextOrCsv, generateSampleCsvBlob } from '../../utils/csvParser';
import type { EmailLead, Attachment } from '../../types';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  ChevronDown,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  FileSpreadsheet,
  Users,
  Download,
} from 'lucide-react';

export const ComposeView: React.FC = () => {
  const { user } = useAuth();
  const { setIsComposing, scheduleEmail, isLoading, addToast } = useEmail();

  const [toInput, setToInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [delaySeconds, setDelaySeconds] = useState<number>(0);
  const [hourlyLimit, setHourlyLimit] = useState<number>(0);
  const [scheduledTimeString, setScheduledTimeString] = useState<string>('Tomorrow, 10:00 AM');
  const [scheduledTimestamp, setScheduledTimestamp] = useState<number | undefined>();
  const [isSendLaterOpen, setIsSendLaterOpen] = useState(false);
  
  // Leads & Attachments
  const [parsedLeads, setParsedLeads] = useState<EmailLead[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    setIsComposing(false);
  };

  const handleSend = async () => {
    if (!toInput && parsedLeads.length === 0) {
      addToast('error', 'Recipient Required', 'Please enter a recipient email or upload a lead list.');
      return;
    }

    const htmlBody = editorRef.current ? editorRef.current.innerHTML : bodyContent;

    await scheduleEmail({
      from: user?.email || 'oliver.brown@domain.io',
      to: toInput || (parsedLeads.length > 0 ? parsedLeads[0].email : ''),
      subject: subjectInput || 'Outreach Campaign',
      body: htmlBody || '<p>Hi there,</p><p>Reaching out regarding potential collaboration.</p>',
      delaySeconds,
      hourlyLimit,
      scheduledTimeStr: scheduledTimeString,
      scheduledTimestamp,
      leads: parsedLeads,
      attachments,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const result = parseLeadsFromTextOrCsv(text, file.name);
        setParsedLeads(result.leads);
        addToast(
          'success',
          'Lead List Imported',
          `Parsed ${result.totalCount} verified email addresses from ${file.name}`
        );
      };
      reader.readAsText(file);
    } else {
      // Normal attachment
      const newAtt: Attachment = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: URL.createObjectURL(file),
      };
      setAttachments(prev => [...prev, newAtt]);
      addToast('info', 'File Attached', `Added ${file.name}`);
    }
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const downloadSampleCsv = () => {
    const blob = generateSampleCsvBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {/* Top Bar matching Image 5 */}
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
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
          }}>
            Compose New Email
          </h2>
        </div>

        {/* Top Right Action Buttons: Paperclip, Clock, Send matching Image 5 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".csv,.txt,.png,.jpg,.jpeg,.pdf"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px',
              borderRadius: '50%',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Attach file or upload Lead CSV"
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Paperclip size={18} />
          </button>

          <button
            onClick={() => setIsSendLaterOpen(!isSendLaterOpen)}
            style={{
              padding: '8px',
              borderRadius: '50%',
              color: isSendLaterOpen ? '#00a84e' : '#6b7280',
              backgroundColor: isSendLaterOpen ? '#e6f7ee' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Schedule / Send Later"
            onMouseOver={e => {
              if (!isSendLaterOpen) e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseOut={e => {
              if (!isSendLaterOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Clock size={18} />
          </button>

          <button
            onClick={handleSend}
            disabled={isLoading}
            style={{
              padding: '6px 24px',
              height: '36px',
              borderRadius: '9999px',
              border: '1.5px solid #00a84e',
              backgroundColor: '#ffffff',
              color: '#00a84e',
              fontWeight: 600,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
            <span>{isLoading ? 'Scheduling...' : 'Send'}</span>
          </button>

          {/* Send Later Popover Modal matching Image 5 */}
          <SendLaterModal
            isOpen={isSendLaterOpen}
            onClose={() => setIsSendLaterOpen(false)}
            onSelectScheduleTime={(timeStr, timestamp) => {
              setScheduledTimeString(timeStr);
              setScheduledTimestamp(timestamp);
              addToast('info', 'Schedule Updated', `Set outreach delivery to ${timeStr}`);
            }}
            currentTimeString={scheduledTimeString}
          />
        </div>
      </div>

      {/* Main Compose Form Fields matching Image 5 */}
      <div style={{ padding: '24px 36px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        {/* From Field */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ width: '80px', fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
            From
          </span>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f3f4f6',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '13.5px',
            color: '#111827',
            fontWeight: 500,
          }}>
            <span>{user?.email || 'oliver.brown@domain.io'}</span>
            <ChevronDown size={14} color="#6b7280" />
          </div>
        </div>

        {/* To Field & Lead Importer */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', gap: '10px' }}>
          <span style={{ width: '80px', fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
            To
          </span>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="recipient@example.com"
              value={toInput}
              onChange={e => setToInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 0',
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '14px',
                color: '#111827',
              }}
            />
          </div>

          {/* Upload Leads CSV Button / Badge */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px dashed #00a84e',
              backgroundColor: '#e6f7ee',
              color: '#00a84e',
              fontSize: '12px',
              fontWeight: 600,
            }}
            title="Import CSV lead list"
          >
            <FileSpreadsheet size={14} />
            <span>Upload CSV Leads</span>
          </button>
        </div>

        {/* Parsed Leads Preview Chips if any */}
        {parsedLeads.length > 0 && (
          <div style={{
            marginLeft: '80px',
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                <Users size={15} />
                <span>{parsedLeads.length} Leads Detected from CSV</span>
              </div>
              <button
                onClick={() => setParsedLeads([])}
                style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}
              >
                Clear list
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '72px', overflowY: 'auto' }}>
              {parsedLeads.slice(0, 15).map((lead, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dcfce7',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11.5px',
                    color: '#15803d',
                  }}
                >
                  {lead.email}
                </span>
              ))}
              {parsedLeads.length > 15 && (
                <span style={{ fontSize: '11px', color: '#166534', alignSelf: 'center' }}>
                  +{parsedLeads.length - 15} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Subject Field matching Image 5 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ width: '80px', fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
            Subject
          </span>
          <input
            type="text"
            placeholder="Subject"
            value={subjectInput}
            onChange={e => setSubjectInput(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderBottom: '1px solid #f0f0f0',
              fontSize: '14px',
              color: '#111827',
            }}
          />
        </div>

        {/* Delay and Hourly Limit Row matching Image 5 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          marginBottom: '24px',
        }}>
          {/* Delay between 2 emails */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13.5px', color: '#374151', fontWeight: 500 }}>
              Delay between 2 emails
            </span>
            <input
              type="number"
              min="0"
              placeholder="00"
              value={delaySeconds || ''}
              onChange={e => setDelaySeconds(parseInt(e.target.value) || 0)}
              style={{
                width: '64px',
                height: '36px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#111827',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Hourly Limit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13.5px', color: '#374151', fontWeight: 500 }}>
              Hourly Limit
            </span>
            <input
              type="number"
              min="0"
              placeholder="00"
              value={hourlyLimit || ''}
              onChange={e => setHourlyLimit(parseInt(e.target.value) || 0)}
              style={{
                width: '64px',
                height: '36px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#111827',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Sample CSV quick download helper */}
          <button
            onClick={downloadSampleCsv}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#6b7280',
            }}
            title="Download sample lead CSV"
          >
            <Download size={13} />
            <span>Sample Leads CSV</span>
          </button>
        </div>

        {/* Rich Text Editor Container matching Image 5 */}
        <div style={{
          border: '1px solid #f0f0f0',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#fafbfc',
        }}>
          {/* Formatting Toolbar matching Image 5 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f0f0f0',
            gap: '6px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => handleFormat('undo')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={() => handleFormat('redo')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Redo"
            >
              <Redo2 size={16} />
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />

            {/* Typography / Font Size dropdown simulation */}
            <button
              onClick={() => handleFormat('formatBlock', '<h2>')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 8px',
                borderRadius: '4px',
                color: '#4b5563',
                fontSize: '13px',
                fontWeight: 600,
              }}
              title="Heading Style"
            >
              <span>Tt</span>
              <ChevronDown size={12} />
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />

            <button
              onClick={() => handleFormat('bold')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563', fontWeight: 700 }}
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => handleFormat('italic')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => handleFormat('underline')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Underline"
            >
              <Underline size={16} />
            </button>
            <button
              onClick={() => handleFormat('strikeThrough')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />

            <button
              onClick={() => handleFormat('justifyLeft')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => handleFormat('justifyCenter')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => handleFormat('justifyRight')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />

            <button
              onClick={() => handleFormat('insertOrderedList')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={() => handleFormat('insertUnorderedList')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => handleFormat('formatBlock', '<blockquote>')}
              style={{ padding: '6px', borderRadius: '4px', color: '#4b5563' }}
              title="Quote"
            >
              <Quote size={16} />
            </button>
          </div>

          {/* Editable Content Area matching Image 5 */}
          <div
            ref={editorRef}
            contentEditable
            onInput={(e) => setBodyContent(e.currentTarget.innerHTML)}
            data-placeholder="Type Your Reply..."
            style={{
              minHeight: '280px',
              padding: '20px 24px',
              outline: 'none',
              fontSize: '14.5px',
              color: '#1f2937',
              lineHeight: '1.6',
              backgroundColor: '#fafbfc',
            }}
          />
        </div>
      </div>
    </div>
  );
};

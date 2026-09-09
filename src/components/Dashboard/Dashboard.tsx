import React from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { HeaderBar } from './HeaderBar';
import { EmailList } from './EmailList';
import { EmailDetail } from './EmailDetail';
import { ComposeView } from '../Compose/ComposeView';
import { useEmail } from '../../context/EmailContext';

export const Dashboard: React.FC = () => {
  const { isComposing, selectedEmail } = useEmail();

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
    }}>
      {/* Sidebar on left */}
      <Sidebar />

      {/* Main viewport */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}>
        {isComposing ? (
          <ComposeView />
        ) : selectedEmail ? (
          <EmailDetail />
        ) : (
          <>
            <HeaderBar />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <EmailList />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

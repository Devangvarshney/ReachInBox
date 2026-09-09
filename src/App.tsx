import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmailProvider } from './context/EmailContext';
import { LoginPage } from './components/Login/LoginPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ToastContainer } from './components/UI/Toast';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? <Dashboard /> : <LoginPage />}
      <ToastContainer />
    </>
  );
};

const OAuthAndEmailWrapper: React.FC = () => {
  const { googleClientId } = useAuth();

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <EmailProvider>
        <AppContent />
      </EmailProvider>
    </GoogleOAuthProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <OAuthAndEmailWrapper />
    </AuthProvider>
  );
}

export default App;

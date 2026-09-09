import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    loginWithGoogleProfile,
    loginWithDemo,
  } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Hook for Google OAuth popup flow
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoggingIn(true);
      setErrorMessage('');
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        if (!userInfoRes.ok) {
          throw new Error('Failed to retrieve user profile from Google');
        }

        const profile = await userInfoRes.json();

        await loginWithGoogleProfile({
          id: profile.sub,
          name: profile.name || 'Google User',
          email: profile.email,
          avatar: profile.picture,
          accessToken: tokenResponse.access_token,
        });
      } catch (err: any) {
        console.error('[Google OAuth] Error fetching profile:', err);
        setErrorMessage('Failed to sign in with Google: ' + (err.message || 'Unknown error'));
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: (errorResponse) => {
      console.error('[Google OAuth] Popup Error:', errorResponse);
      setErrorMessage('Google Sign-In popup was closed or encountered an error.');
      setIsLoggingIn(false);
    },
  });

  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setErrorMessage('Please enter your Email ID');
      return;
    }
    const namePart = emailInput.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    loginWithDemo({
      name: formattedName || 'Oliver Brown',
      email: emailInput,
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fcfcfc',
      padding: '20px',
    }}>
      {/* Main Login Card */}
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 10px 35px -5px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.02)',
          padding: '44px 38px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '28px',
          letterSpacing: '-0.02em',
        }}>
          Login
        </h1>

        {errorMessage && (
          <div style={{
            width: '100%',
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '13px',
            lineHeight: 1.4,
          }}>
            {errorMessage}
          </div>
        )}

        {/* Real Google OAuth Login Button */}
        <div style={{ width: '100%' }}>
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              triggerGoogleLogin();
            }}
            disabled={isLoggingIn}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: '#e6f4ea',
              borderRadius: '8px',
              border: '1px solid #cce8d5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#202124',
              fontWeight: 500,
              fontSize: '14px',
              cursor: isLoggingIn ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={e => !isLoggingIn && (e.currentTarget.style.backgroundColor = '#d8eee0')}
            onMouseOut={e => !isLoggingIn && (e.currentTarget.style.backgroundColor = '#e6f4ea')}
          >
            {isLoggingIn ? (
              <>
                <Loader2 size={18} className="animate-spin" color="#00a84e" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                {/* Google Multicolor "G" Logo */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Login with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          margin: '22px 0 18px',
          gap: '12px',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>
            or sign in through email
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailPasswordSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <input
              type="text"
              placeholder="Email ID"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#f4f6f5',
                border: '1px solid transparent',
                borderRadius: '8px',
                padding: '0 16px',
                fontSize: '14px',
                color: '#111827',
                transition: 'all 0.15s ease',
              }}
              onFocus={e => (e.target.style.borderColor = '#00a84e')}
              onBlur={e => (e.target.style.borderColor = 'transparent')}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#f4f6f5',
                border: '1px solid transparent',
                borderRadius: '8px',
                padding: '0 16px',
                fontSize: '14px',
                color: '#111827',
                transition: 'all 0.15s ease',
              }}
              onFocus={e => (e.target.style.borderColor = '#00a84e')}
              onBlur={e => (e.target.style.borderColor = 'transparent')}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: '#00a84e',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
              marginTop: '4px',
              boxShadow: '0 2px 6px rgba(0, 168, 78, 0.25)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#009344')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = '#00a84e')}
          >
            Login
          </button>
        </form>

        {/* Quick Demo button */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              loginWithDemo({
                name: 'Demo Account',
                email: 'demo.user@reachinbox.ai',
              });
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '12px',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Quick 1-Click Demo Login
          </button>
        </div>

        {/* Security badge */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
          <ShieldCheck size={14} color="#00a84e" />
          <span>Secured with ReachInbox Google OAuth 2.0</span>
        </div>
      </div>
    </div>
  );
};

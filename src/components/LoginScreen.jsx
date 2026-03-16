import React, { useState } from 'react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LoginScreen = ({ onLogin }) => {
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLoginError('');
    try {
      await onLogin();
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else if (error.code === 'auth/popup-blocked') {
        setLoginError('Popup was blocked. Please allow popups for this site.');
      } else {
        setLoginError('Could not sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Glow orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] opacity-30"
        style={{ background: 'radial-gradient(circle, #ff2d87 0%, transparent 70%)', filter: 'blur(80px)' }}
      />
      <div
        className="absolute top-[30%] right-[-15%] w-[40vw] h-[40vw] opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(80px)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] opacity-20"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-12">
          {/* Hard-edged star logo */}
          <div
            className="w-16 h-16 flex items-center justify-center mb-6"
            style={{
              background: 'linear-gradient(135deg, #ff2d87, #7c3aed, #06b6d4)',
              borderRadius: 0,
            }}
          >
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>

          {/* Stacked title */}
          <h1
            className="font-display text-center leading-none tracking-tight"
            style={{ fontWeight: 900, fontSize: '2rem' }}
          >
            <span style={{ color: 'var(--text)' }}>EUROVISION</span>
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #ff2d87, #7c3aed, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BUDDY
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-3 text-sm" style={{ color: 'var(--text3)', fontFamily: 'Inter, sans-serif' }}>
            Rate &middot; Compare &middot; Celebrate
          </p>

          {/* Value prop */}
          <p className="mt-2 text-xs text-center px-4" style={{ color: 'var(--text2)', fontFamily: 'Inter, sans-serif' }}>
            Score Eurovision with your friends in real-time
          </p>
        </div>

        {/* Google sign-in button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-4 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          style={{
            borderRadius: 0,
            minHeight: 48,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
          }}
        >
          <GoogleIcon />
          {isSubmitting ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {loginError && (
          <div className="mt-3 text-red-400 text-sm text-center">{loginError}</div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;

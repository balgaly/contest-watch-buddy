import React, { useState, useEffect } from 'react';

const PasswordGate = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');

  // Check if already authorized in session
  useEffect(() => {
    const auth = sessionStorage.getItem('app_authorized');
    if (auth === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Password from environment variable or hardcoded fallback
    // Trim to handle trailing whitespace/newlines from environment variables
    const correctPassword = (process.env.REACT_APP_ACCESS_PASSWORD || 'eurovision2026').trim();

    console.log('Password check:', { entered: password.trim(), correct: correctPassword, env: process.env.REACT_APP_ACCESS_PASSWORD });

    if (password.trim() === correctPassword) {
      sessionStorage.setItem('app_authorized', 'true');
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="esc-bg min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-esc-accent/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-esc-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Private Testing</h1>
          <p className="text-white/40 text-sm">Enter password to access</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-white/5 border border-white/8 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-esc-accent/40 transition-colors mb-3"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-esc-accent text-white py-3 rounded-lg font-semibold hover:bg-esc-accent/90 transition-colors"
          >
            Enter
          </button>
          {error && (
            <div className="mt-3 text-red-400 text-sm text-center">{error}</div>
          )}
        </form>

        <p className="text-white/15 text-xs text-center mt-6">
          Testing environment only
        </p>
      </div>
    </div>
  );
};

export default PasswordGate;

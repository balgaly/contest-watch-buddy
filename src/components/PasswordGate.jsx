import React, { useState, useEffect } from 'react';

const PasswordGate = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('app_authorized');
    if (auth === 'true') setIsAuthorized(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPassword = (process.env.REACT_APP_ACCESS_PASSWORD || 'eurovision2026').trim();
    if (password.trim() === correctPassword) {
      sessionStorage.setItem('app_authorized', 'true');
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isAuthorized) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="p-6 w-full max-w-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255, 45, 135, 0.15)', borderRadius: 0 }}>
            <svg className="w-6 h-6" style={{ color: 'var(--pink)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Private Testing</h1>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Enter password to access</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 text-sm mb-3 focus:outline-none transition-colors"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 0, color: 'var(--text)' }}
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 text-white font-semibold transition-colors"
            style={{ background: 'linear-gradient(90deg, #ff2d87, #7c3aed)', borderRadius: 0 }}
          >
            Enter
          </button>
          {error && <div className="mt-3 text-red-400 text-sm text-center">{error}</div>}
        </form>
        <p className="text-xs text-center mt-6" style={{ color: 'var(--text3)' }}>Testing environment only</p>
      </div>
    </div>
  );
};

export default PasswordGate;

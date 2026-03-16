import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRooms } from '../hooks/useRooms';
import LoadingSpinner from './LoadingSpinner';

const ROOM_ACCENTS = [
  'linear-gradient(180deg, #ff2d87, #7c3aed)',
  'linear-gradient(180deg, #7c3aed, #06b6d4)',
  'linear-gradient(180deg, #06b6d4, #fbbf24)',
  'linear-gradient(180deg, #fbbf24, #ff2d87)',
  'linear-gradient(180deg, #ff2d87, #06b6d4)',
];

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const HomePage = ({ user, contests, onLogout, onToggleTheme }) => {
  const navigate = useNavigate();
  const { rooms, loading, createRoom, joinByCode } = useRooms(user);

  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [contestId, setContestId] = useState(contests[0]?.id || '');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!roomName.trim()) { setError('Please enter a room name'); return; }
    if (!contestId) { setError('Please select a contest'); return; }
    setSubmitting(true);
    setError('');
    try {
      const room = await createRoom(roomName.trim(), contestId);
      navigate(`/room/${room.id}`);
    } catch (e) {
      setError(e.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError('Please enter a room code'); return; }
    setSubmitting(true);
    setError('');
    try {
      const room = await joinByCode(joinCode.trim());
      navigate(`/room/${room.id}`);
    } catch (e) {
      setError(e.message || 'Failed to join room');
    } finally {
      setSubmitting(false);
    }
  };

  // Detect current theme for icon
  const isDark = typeof document !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'dark' ||
     (!document.documentElement.getAttribute('data-theme') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display tracking-tight" style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text)' }}>
            EUROVISION{' '}
            <span style={{
              background: 'linear-gradient(90deg, #ff2d87, #7c3aed, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              BUDDY
            </span>
          </h1>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 flex items-center justify-center transition-colors"
              style={{ color: 'var(--text3)', borderRadius: 0 }}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/10" referrerPolicy="no-referrer" />
            )}
            <button
              onClick={onLogout}
              className="text-xs transition-colors"
              style={{ color: 'var(--text3)' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="mb-6 animate-slide-up">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && !submitting && handleJoin()}
              placeholder="ROOM CODE"
              maxLength={6}
              className="flex-1 px-3 py-2.5 font-mono uppercase text-center text-sm focus:outline-none transition-colors"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 0,
                color: 'var(--text)',
                letterSpacing: '0.2em',
                fontFamily: '"JetBrains Mono", monospace',
              }}
              disabled={submitting}
            />
            <button
              onClick={handleJoin}
              disabled={submitting || !joinCode.trim()}
              className="px-5 py-2.5 text-white font-semibold text-sm disabled:opacity-30 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #ff2d87, #7c3aed)',
                borderRadius: 0,
                minHeight: 44,
              }}
            >
              JOIN
            </button>
          </div>
        </div>

        {/* Section label */}
        <div className="mb-3">
          <span
            className="font-display"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '3px',
              color: 'var(--text3)',
              textTransform: 'uppercase',
            }}
          >
            YOUR ROOMS
          </span>
        </div>

        {/* Room rows */}
        <div className="mb-5">
          {rooms.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: 'var(--text3)' }}>No watch parties yet.</p>
            </div>
          ) : (
            <div>
              {rooms.map((room, i) => {
                const contest = contests.find(c => c.id === room.contestId);
                const accent = ROOM_ACCENTS[i % ROOM_ACCENTS.length];
                return (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="flex items-center cursor-pointer transition-all active:scale-[0.99] animate-slide-up relative"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      minHeight: 56,
                      animationDelay: `${i * 40}ms`,
                      background: i % 2 === 0 ? 'var(--surface)' : 'transparent',
                    }}
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ background: accent }}
                    />
                    <div className="flex-1 min-w-0 py-3 pl-4 pr-3">
                      <div
                        className="font-display text-sm truncate"
                        style={{ fontWeight: 600, color: 'var(--text)' }}
                      >
                        {room.name}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                        {contest?.name || 'Contest'} &middot; {room.memberCount || '?'} members
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-3 flex-shrink-0">
                      <span
                        className="font-mono text-[11px] px-2 py-1"
                        style={{
                          background: 'rgba(124, 58, 237, 0.15)',
                          color: '#7c3aed',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 600,
                          letterSpacing: '1px',
                        }}
                      >
                        {room.code}
                      </span>
                      <svg className="w-4 h-4" style={{ color: 'var(--text3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Room */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-3 font-display text-sm transition-all active:scale-[0.98]"
            style={{
              border: '1px dashed var(--border)',
              borderRadius: 0,
              color: 'var(--text2)',
              fontWeight: 600,
              minHeight: 48,
              background: 'transparent',
            }}
          >
            + Start a watch party
          </button>
        ) : (
          <div className="p-4 space-y-3 animate-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-display text-sm" style={{ fontWeight: 600, color: 'var(--text)' }}>NEW ROOM</h3>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="Room name"
              maxLength={60}
              className="w-full px-3 py-2.5 text-sm focus:outline-none transition-colors"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 0,
                color: 'var(--text)',
              }}
              disabled={submitting}
            />
            <select
              value={contestId}
              onChange={e => setContestId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm focus:outline-none transition-colors"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 0,
                color: 'var(--text)',
              }}
              disabled={submitting}
            >
              {contests.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 py-2.5 text-white font-semibold text-sm disabled:opacity-50 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(90deg, #ff2d87, #7c3aed)',
                  borderRadius: 0,
                  minHeight: 44,
                }}
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setError(''); }}
                className="px-4 py-2.5 text-sm transition-colors"
                style={{
                  background: 'var(--surface-hover)',
                  color: 'var(--text2)',
                  borderRadius: 0,
                  minHeight: 44,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 px-3 py-2 text-sm animate-slide-up" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            borderRadius: 0,
          }}>
            {error}
          </div>
        )}

        {/* Global scoreboard link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/global')}
            className="font-mono text-xs underline transition-colors"
            style={{
              color: 'var(--text2)',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            How does your room stack up?
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

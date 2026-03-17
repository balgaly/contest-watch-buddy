import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useScores } from '../hooks/useScores';
import { useReactions } from '../hooks/useReactions';
import { usePresence } from '../hooks/usePresence';
import Voting from './Voting';
import Results from './Results';
import MyVotesResults from './MyVotesResults';
import UserManagement from './UserManagement';
import LoadingSpinner from './LoadingSpinner';
import { EMOJI_REACTIONS } from '../constants';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const TabIcon = ({ type, active }) => {
  const color = active ? 'var(--pink)' : 'var(--text3)';
  if (type === 'voting') return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
  if (type === 'results') return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  );
  if (type === 'myvotes') return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
    </svg>
  );
  return null;
};

const RoomPage = ({ user, contests, users, setUsers, onToggleTheme }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, members, memberIds, loading: roomLoading } = useRoom(roomId);
  const activeContest = room ? contests.find(c => c.id === room.contestId) : null;

  const {
    allScores, loading: scoresLoading, lastChanged, getScore, submitScore,
    deleteScore, clearAllScores,
  } = useScores(room?.contestId, user);

  const { reactions, sendReaction } = useReactions(roomId);
  const { isLive, markActive } = usePresence(roomId, user?.id);

  const [activeTab, setActiveTab] = useState('voting');
  const [showMembers, setShowMembers] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [page, setPage] = useState('main');
  const [copied, setCopied] = useState(false);
  const [pressedEmoji, setPressedEmoji] = useState(null);

  const isLoading = roomLoading || scoresLoading;

  // Generate ticker text from scores
  const tickerText = useMemo(() => {
    if (!activeContest || !allScores) return '';
    const scored = activeContest.contestants
      .map(c => {
        const scores = allScores[c.id] || {};
        const voters = Object.values(scores).filter(s => s.overall !== undefined);
        if (voters.length === 0) return null;
        const avg = voters.reduce((sum, s) => sum + s.overall, 0) / voters.length;
        return { name: (c.country || c.name).toUpperCase(), avg: avg.toFixed(1) };
      })
      .filter(Boolean)
      .sort((a, b) => b.avg - a.avg);

    if (scored.length === 0) return 'WAITING FOR VOTES...';
    const top = scored.slice(0, 5).map(s => `${s.name} ${s.avg}`).join(' \u2022 ');
    const unvoted = activeContest.contestants.length - scored.length;
    return `${scored[0].name} LEADS WITH ${scored[0].avg} \u2022 ${top} \u2022 ${unvoted} AWAITING VOTES`;
  }, [activeContest, allScores]);

  const copyCode = () => {
    const text = room?.code || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    } else {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleContestStatus = async () => {
    if (!user?.isAdmin || !activeContest) return;
    try {
      await setDoc(doc(db, "contests", room.contestId), { closed: !activeContest.closed }, { merge: true });
      window.location.reload();
    } catch (error) { alert("Failed to update contest status."); }
  };

  const handleClearCompetition = async () => {
    if (!user?.isAdmin) return;
    if (!window.confirm(`Clear all scores for ${activeContest?.name}?`)) return;
    try { await clearAllScores(); } catch (error) { alert("Failed to clear scores."); }
  };

  const handleDeleteVote = async (userId, contestId, contestantId) => {
    if (!user?.isAdmin) return;
    try { await deleteScore(userId, contestantId); } catch (error) { alert("Failed to delete vote."); }
  };

  const handleSubmitScore = async (contestantId, criterionId, value) => {
    await submitScore(contestantId, criterionId, value);
    markActive();
  };

  const handleEmojiReact = (emojiId) => {
    const emoji = EMOJI_REACTIONS.find(e => e.id === emojiId);
    if (!emoji) return;
    setPressedEmoji(emojiId);
    setTimeout(() => setPressedEmoji(null), 150);
    sendReaction(user.id, user.name, emoji.emoji, null);
  };

  const myScores = {};
  if (user && activeContest) {
    activeContest.contestants.forEach(c => {
      const score = allScores[c.id]?.[user.id];
      if (score) myScores[c.id] = score;
    });
  }

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="p-6 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="mb-4" style={{ color: 'var(--text2)' }}>Room not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(90deg, #ff2d87, #7c3aed)', borderRadius: 0, minHeight: 44 }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (page === 'userManagement' && user.isAdmin) {
    const deleteUser = async (userId) => {
      if (!window.confirm("Delete this user and their ratings?")) return;
      try { await deleteDoc(doc(db, "users", userId)); } catch (e) {}
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    return <UserManagement users={users} currentUser={user} deleteUser={deleteUser} goBack={() => setPage('main')} />;
  }

  const tabs = [];
  if (!activeContest?.closed) tabs.push({ id: 'voting', label: 'RATE', icon: 'voting' });
  tabs.push({ id: 'results', label: 'RANKINGS', icon: 'results' });
  tabs.push({ id: 'myvotes', label: 'MY SCORES', icon: 'myvotes' });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Sticky header */}
        <header
          className="sticky top-0 z-40 px-4 py-2.5"
          style={{
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {isLoading && <div className="absolute inset-x-0 top-0 h-0.5 loading-bar" style={{ background: 'rgba(255, 45, 135, 0.3)' }} />}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => navigate('/')}
                className="p-1 transition-colors"
                style={{ color: 'var(--text3)', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-sm truncate" style={{ fontWeight: 600, color: 'var(--text)' }}>{room.name}</h1>
                  {isLive && (
                    <span
                      className="live-pulse font-mono text-[10px] px-1.5 py-0.5 text-white"
                      style={{ background: '#ef4444', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}
                    >
                      LIVE
                    </span>
                  )}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{activeContest?.name || 'Contest'}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={copyCode}
                className="flex items-center gap-1 px-2 py-1.5 text-xs transition-colors"
                style={{ background: 'rgba(124, 58, 237, 0.1)', borderRadius: 0, minHeight: 44 }}
              >
                <span className="font-mono font-semibold tracking-wider" style={{ color: '#7c3aed', fontFamily: '"JetBrains Mono", monospace' }}>
                  {room.code}
                </span>
                <span className="text-[10px]" style={{ color: 'rgba(124, 58, 237, 0.5)' }}>
                  {copied ? 'OK!' : 'Copy'}
                </span>
              </button>

              <button
                onClick={() => setShowMembers(!showMembers)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs transition-colors"
                style={{ background: 'var(--surface)', borderRadius: 0, minHeight: 44 }}
              >
                <div className="flex -space-x-1">
                  {members.slice(0, 3).map(m => (
                    m.photoURL ? (
                      <img key={m.id} src={m.photoURL} alt="" className="w-4 h-4 rounded-full" style={{ border: '1px solid var(--bg)' }} referrerPolicy="no-referrer" />
                    ) : (
                      <div key={m.id} className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--bg)', color: 'var(--text3)' }}>
                        {m.name?.[0]}
                      </div>
                    )
                  ))}
                </div>
                <span style={{ color: 'var(--text3)' }}>{members.length}</span>
              </button>

              {user.isAdmin && (
                <button
                  onClick={() => setShowAdmin(!showAdmin)}
                  className="p-1.5 transition-colors"
                  style={{ background: 'var(--surface)', borderRadius: 0, minHeight: 32, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg className="w-3.5 h-3.5" style={{ color: 'var(--gold)', opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Members panel */}
          {showMembers && (
            <div className="mt-2.5 p-3 animate-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-display" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '8px' }}>
                MEMBERS ({members.length})
              </div>
              <div className="space-y-1.5">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    {m.photoURL ? (
                      <img src={m.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: 'var(--surface-hover)', color: 'var(--text3)' }}>{m.name?.[0]}</div>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text2)' }}>{m.name}</span>
                    {m.id === room.createdBy && <span className="text-[10px] px-1.5 py-0.5" style={{ color: 'var(--gold)', background: 'rgba(251, 191, 36, 0.08)' }}>host</span>}
                    {m.id === user.id && <span className="text-[10px]" style={{ color: 'var(--text3)' }}>(you)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin panel */}
          {showAdmin && user.isAdmin && (
            <div className="mt-2.5 p-3 animate-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {activeContest?.closed && <div className="text-xs mb-2" style={{ color: 'var(--gold)' }}>Voting is closed</div>}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={toggleContestStatus} className="px-2.5 py-1.5 text-xs font-medium" style={{ background: activeContest?.closed ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: activeContest?.closed ? '#10b981' : '#f59e0b', borderRadius: 0 }}>
                  {activeContest?.closed ? 'Open Voting' : 'Close Voting'}
                </button>
                <button onClick={handleClearCompetition} className="px-2.5 py-1.5 text-xs font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 0 }}>Clear Scores</button>
                <button onClick={() => setPage('userManagement')} className="px-2.5 py-1.5 text-xs font-medium" style={{ background: 'var(--surface-hover)', color: 'var(--text3)', borderRadius: 0 }}>Users</button>
              </div>
            </div>
          )}
        </header>

        {/* Live ticker */}
        {tickerText && (
          <div
            className="overflow-hidden whitespace-nowrap"
            style={{
              background: 'linear-gradient(90deg, #ff2d87, #7c3aed)',
              height: 28,
              lineHeight: '28px',
            }}
            role="marquee"
            aria-live="polite"
          >
            <div className="ticker-scroll inline-block">
              <span
                className="font-mono text-[11px] text-white px-4"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '1px' }}
              >
                {'\u25B8'} {tickerText} {'\u25B8'} {tickerText}
              </span>
            </div>
          </div>
        )}

        {/* Emoji reaction bar */}
        <div className="flex items-center justify-center gap-2 py-2 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {EMOJI_REACTIONS.map(r => (
            <button
              key={r.id}
              onClick={() => handleEmojiReact(r.id)}
              aria-label={r.label}
              className={`w-9 h-9 flex items-center justify-center text-base transition-transform ${pressedEmoji === r.id ? 'emoji-press' : ''}`}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
              }}
            >
              {r.emoji}
            </button>
          ))}
        </div>

        {/* Diagonal divider */}
        <div className="divider-gradient" />

        {/* Content */}
        <div className={`px-4 pt-3 pb-safe transition-opacity duration-150 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
          {activeTab === 'voting' && !activeContest?.closed ? (
            <Voting
              activeContest={activeContest}
              currentContestant={null}
              updateScore={handleSubmitScore}
              getScore={getScore}
              setCurrentContestant={() => {}}
              isLoading={isLoading}
              reactions={reactions}
              lastChanged={lastChanged}
              allScores={allScores}
              user={user}
            />
          ) : activeTab === 'results' ? (
            <Results
              activeContest={activeContest}
              currentUser={user}
              handleDeleteVote={handleDeleteVote}
              allScores={allScores}
              memberIds={memberIds}
              reactions={reactions}
              lastChanged={lastChanged}
            />
          ) : (
            <MyVotesResults activeContest={activeContest} myScores={myScores} currentUser={user} />
          )}
        </div>

        {/* Bottom tabs */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50"
          style={{
            background: 'var(--bg)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div className="max-w-2xl mx-auto flex" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative"
                  style={{ minHeight: 52 }}
                >
                  {isActive && (
                    <div
                      className="absolute top-0 inset-x-0 h-0.5"
                      style={{ background: 'var(--gradient)' }}
                    />
                  )}
                  <TabIcon type={tab.icon} active={isActive} />
                  <span
                    className="font-display text-[10px]"
                    style={{
                      fontWeight: 600,
                      color: isActive ? 'var(--pink)' : 'var(--text3)',
                      letterSpacing: '1px',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default RoomPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScores } from '../hooks/useScores';
import Results from './Results';
import LoadingSpinner from './LoadingSpinner';

const GlobalPage = ({ user, contests }) => {
  const navigate = useNavigate();
  const [contestId, setContestId] = useState(contests[0]?.id || '');
  const activeContest = contests.find(c => c.id === contestId);
  const { allScores, loading } = useScores(contestId, user);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <div className="flex items-center gap-2.5 mb-5">
          <button
            onClick={() => navigate('/')}
            className="p-1 transition-colors"
            style={{ color: 'var(--text3)', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>GLOBAL SCOREBOARD</h1>
        </div>

        <select
          value={contestId}
          onChange={e => setContestId(e.target.value)}
          className="w-full px-3 py-2.5 text-sm mb-4 focus:outline-none transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0, color: 'var(--text)' }}
        >
          {contests.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {loading ? <LoadingSpinner /> : (
          <Results activeContest={activeContest} currentUser={user} handleDeleteVote={() => {}} allScores={allScores} />
        )}
      </div>
    </div>
  );
};

export default GlobalPage;

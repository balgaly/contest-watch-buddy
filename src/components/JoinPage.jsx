import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRooms } from '../hooks/useRooms';
import LoadingSpinner from './LoadingSpinner';

const JoinPage = ({ user }) => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { joinByCode } = useRooms(user);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!code || !user) return;
    const join = async () => {
      try {
        const room = await joinByCode(code);
        navigate(`/room/${room.id}`, { replace: true });
      } catch (e) {
        setError(e.message || 'Failed to join room');
        setJoining(false);
      }
    };
    join();
  }, [code, user, joinByCode, navigate]);

  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="relative z-10 text-center">
          <LoadingSpinner text="Joining room..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="p-6 max-w-sm text-center" style={{ border: '1px solid var(--border)' }}>
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 text-white font-semibold transition-all active:scale-95"
          style={{ background: 'linear-gradient(90deg, #ff2d87, #7c3aed)', borderRadius: 0, minHeight: 44 }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default JoinPage;

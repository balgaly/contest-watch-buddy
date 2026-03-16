import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';
import PasswordGate from './components/PasswordGate';
import LoginScreen from './components/LoginScreen';
import HomePage from './components/HomePage';
import RoomPage from './components/RoomPage';
import JoinPage from './components/JoinPage';
import GlobalPage from './components/GlobalPage';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

const App = () => {
  const { user, authLoading, login, logout } = useAuth();
  const { toggle: toggleTheme } = useTheme();

  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Load contests on mount (public data)
  useEffect(() => {
    const loadContests = async () => {
      try {
        const contestsSnapshot = await getDocs(collection(db, 'contests'));
        const fetched = [];

        for (const contestDoc of contestsSnapshot.docs) {
          const contestantsSnapshot = await getDocs(
            collection(db, 'contests', contestDoc.id, 'contestants')
          );
          fetched.push({
            id: contestDoc.id,
            ...contestDoc.data(),
            contestants: contestantsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
          });
        }

        setContests(fetched);
      } catch (error) {
        console.error('Error loading contests:', error);
      } finally {
        setContestsLoading(false);
      }
    };

    loadContests();
  }, []);

  // Load users after auth (for admin user management)
  useEffect(() => {
    if (!user) return;
    const loadUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, [user]);

  if (authLoading || contestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="relative z-10"><LoadingSpinner /></div>
      </div>
    );
  }

  const appContent = !user ? (
    <LoginScreen onLogin={login} />
  ) : (
    <Routes>
      <Route path="/" element={<HomePage user={user} contests={contests} onLogout={logout} onToggleTheme={toggleTheme} />} />
      <Route path="/room/:roomId" element={<RoomPage user={user} contests={contests} users={users} setUsers={setUsers} onToggleTheme={toggleTheme} />} />
      <Route path="/join/:code" element={<JoinPage user={user} />} />
      <Route path="/global" element={<GlobalPage user={user} contests={contests} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Wrap with password gate if password is set
  return <PasswordGate>{appContent}</PasswordGate>;
};

export default App;

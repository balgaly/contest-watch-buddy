const fs = require('fs');
const path = require('path');

// Define the path to the App.js file and the backup file
const appPath = path.join(__dirname, 'src', 'App.js');
const backupPath = path.join(__dirname, 'src', 'App.js.bak');

// Check if src/App.js exists
if (!fs.existsSync(appPath)) {
  console.error("Error: src/App.js not found! Make sure you're in the correct folder.");
  process.exit(1);
}

// Read the current App.js content (for backup purposes)
const currentContent = fs.readFileSync(appPath, 'utf8');

// Create a backup file
fs.writeFileSync(backupPath, currentContent, 'utf8');
console.log(`Backup created at ${backupPath}`);

// New content for App.js with global competition and session persistence modifications,
// plus inline admin controls for clearing competition and editing votes.
const newAppJsContent = `import React, { useState, useEffect } from 'react';
import { ADMIN_PASSWORD, CRITERIA, initialContests } from './constants';
import LoginScreen from './components/LoginScreen';
import SessionScreen from './components/SessionScreen';
import UserManagement from './components/UserManagement';
import ContestSelection from './components/ContestSelection';
import Voting from './components/Voting';
import Results from './components/Results';

const App = () => {
  // App state
  const [page, setPage] = useState('login'); // 'login', 'session', 'userManagement', 'contestSelection', 'main'
  const [activeTab, setActiveTab] = useState('voting');

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Current session state
  const [currentUser, setCurrentUser] = useState(null);

  // Global competition state
  const [users, setUsers] = useState([]);
  const [allScores, setAllScores] = useState({});

  // Contest state
  const [contests] = useState(initialContests);
  const [activeContestId, setActiveContestId] = useState('melo2025');
  const [currentContestant, setCurrentContestant] = useState(null);
  const [selectedContestant, setSelectedContestant] = useState(null);
  
  // Get active contest
  const activeContest = contests.find(c => c.id === activeContestId) || contests[0];

  // Load global data and current session on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const storedGlobalUsers = localStorage.getItem('globalUsers');
    if (storedGlobalUsers) {
      setUsers(JSON.parse(storedGlobalUsers));
    }
    const storedGlobalAllScores = localStorage.getItem('globalAllScores');
    if (storedGlobalAllScores) {
      setAllScores(JSON.parse(storedGlobalAllScores));
    }
    const storedSession = localStorage.getItem('currentSession');
    if (storedSession && !currentUser) {
      const session = JSON.parse(storedSession);
      setCurrentUser(session.currentUser);
      setActiveContestId(session.activeContestId);
    }
  }, []);

  // Persist global data
  useEffect(() => {
    localStorage.setItem('globalUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('globalAllScores', JSON.stringify(allScores));
  }, [allScores]);

  // Persist current session data separately
  useEffect(() => {
    if (currentUser) {
      const session = { currentUser, activeContestId };
      localStorage.setItem('currentSession', JSON.stringify(session));
    }
  }, [currentUser, activeContestId]);

  // Handler for login
  const handleLogin = () => {
    if (!username.trim()) {
      setLoginError("Please enter your name");
      return;
    }
    if (showAdminLogin) {
      if (password === ADMIN_PASSWORD) {
        const newUser = { id: Date.now().toString(), name: username, isAdmin: true };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        setPage('main');
        setUsername('');
        setPassword('');
        setShowAdminLogin(false);
        setLoginError('');
      } else {
        setLoginError("Incorrect admin password");
      }
    } else {
      const newUser = { id: Date.now().toString(), name: username, isAdmin: false };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      setPage('main');
      setUsername('');
      setLoginError('');
    }
  };

  // Handler for logout: go to session screen
  const handleLogout = () => {
    setPage('session');
  };

  // Resume session
  const resumeSession = () => {
    const storedSession = localStorage.getItem('currentSession');
    if (storedSession) {
      const session = JSON.parse(storedSession);
      setCurrentUser(session.currentUser);
      setActiveContestId(session.activeContestId);
      setPage('main');
    }
  };

  // Clear competition (admin-only)
  const handleClearCompetition = () => {
    if (window.confirm("Are you sure you want to clear the entire competition? This will remove all votes and users.")) {
      setUsers([]);
      setAllScores({});
      setCurrentUser(null);
      setPage('login');
      localStorage.removeItem('currentSession');
      localStorage.removeItem('globalUsers');
      localStorage.removeItem('globalAllScores');
    }
  };

  // Admin-only: edit a specific vote
  const handleEditVote = (userId, contestId, contestantId, criterionId) => {
    const newValue = prompt("Enter new vote value (1-10):");
    if (newValue !== null) {
      setAllScores(prev => {
        const userScores = prev[userId] || {};
        const contestScores = userScores[contestId] || {};
        const contestantScores = contestScores[contestantId.toString()] || {};
        const updatedScores = {
          ...contestantScores,
          [criterionId]: parseInt(newValue) || 0
        };
        let overall = 0;
        let hasAllScores = true;
        CRITERIA.forEach(criterion => {
          if (updatedScores[criterion.id]) {
            overall += updatedScores[criterion.id] * criterion.weight;
          } else {
            hasAllScores = false;
          }
        });
        if (hasAllScores) {
          updatedScores.overall = overall;
        }
        return {
          ...prev,
          [userId]: {
            ...userScores,
            [contestId]: {
              ...contestScores,
              [contestantId.toString()]: updatedScores
            }
          }
        };
      });
    }
  };

  const switchUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setPage('main');
    }
  };

  const deleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user and their ratings?")) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      const newScores = { ...allScores };
      delete newScores[userId];
      setAllScores(newScores);
      if (currentUser && userId === currentUser.id) {
        setCurrentUser(null);
        setPage('login');
      }
    }
  };

  const switchContest = (contestId) => {
    setActiveContestId(contestId);
    setCurrentContestant(null);
    setSelectedContestant(null);
    setPage('main');
  };

  const updateScore = (contestantId, criterionId, value) => {
    if (!currentUser) return;
    setAllScores(prev => {
      const userScores = prev[currentUser.id] || {};
      const contestScores = userScores[activeContestId] || {};
      const contestantScores = contestScores[contestantId.toString()] || {};
      const updatedScores = {
        ...contestantScores,
        [criterionId]: parseInt(value) || 0
      };
      let overall = 0;
      let hasAllScores = true;
      CRITERIA.forEach(criterion => {
        if (updatedScores[criterion.id]) {
          overall += updatedScores[criterion.id] * criterion.weight;
        } else {
          hasAllScores = false;
        }
      });
      if (hasAllScores) {
        updatedScores.overall = overall;
      }
      return {
        ...prev,
        [currentUser.id]: {
          ...userScores,
          [activeContestId]: {
            ...contestScores,
            [contestantId.toString()]: updatedScores
          }
        }
      };
    });
  };

  const getScore = (contestantId, criterionId) => {
    if (!currentUser) return 0;
    return allScores[currentUser.id]?.[activeContestId]?.[contestantId.toString()]?.[criterionId] || 0;
  };

  const getAverageScore = (contestantId, criterionId) => {
    let total = 0;
    let count = 0;
    Object.values(allScores).forEach(userScores => {
      const score = userScores[activeContestId]?.[contestantId.toString()]?.[criterionId];
      if (score) {
        total += score;
        count++;
      }
    });
    return count > 0 ? total / count : 0;
  };

  const getContestantRank = (contestantId) => {
    const scoredContestants = activeContest.contestants.map(c => ({
      id: c.id,
      score: getAverageScore(c.id, 'overall')
    }));
    const sorted = [...scoredContestants].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex(c => c.id === contestantId);
    return index !== -1 ? index + 1 : null;
  };

  const toggleContestantDetails = (contestantId) => {
    setSelectedContestant(selectedContestant === contestantId ? null : contestantId);
  };

  if (page === 'login') {
    return (
      <LoginScreen
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        showAdminLogin={showAdminLogin}
        setShowAdminLogin={setShowAdminLogin}
        loginError={loginError}
        handleLogin={handleLogin}
      />
    );
  }
  if (page === 'session') {
    return <SessionScreen resumeSession={resumeSession} clearSession={handleClearCompetition} />;
  }
  if (page === 'userManagement') {
    return (
      <UserManagement
        users={users}
        currentUser={currentUser}
        switchUser={switchUser}
        deleteUser={deleteUser}
        goBack={() => setPage('main')}
      />
    );
  }
  if (page === 'contestSelection') {
    return (
      <ContestSelection
        contests={contests}
        activeContestId={activeContestId}
        switchContest={switchContest}
        goBack={() => setPage('main')}
      />
    );
  }
  if (page === 'main') {
    return (
      <div className="min-h-screen bg-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-purple-800">{activeContest.name}</h1>
                {currentUser?.isAdmin && (
                  <div className="flex space-x-4 mt-1">
                    <button onClick={() => setPage('contestSelection')} className="text-sm text-purple-600 hover:underline">
                      Change Contest
                    </button>
                    <button onClick={() => setPage('userManagement')} className="text-sm text-purple-600 hover:underline">
                      Manage Users
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center mt-2 sm:mt-0">
                <span className="text-gray-600">
                  {currentUser?.name} {currentUser?.isAdmin && <span className="text-purple-600">👑</span>}
                </span>
                <button onClick={handleLogout} className="ml-4 px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">
                  Logout
                </button>
                {currentUser?.isAdmin && (
                  <button onClick={handleClearCompetition} className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    Clear Competition
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('voting')} className={\`px-4 py-2 rounded \${activeTab === 'voting' ? 'bg-purple-600 text-white' : 'bg-gray-200'}\`}>
                Voting
              </button>
              <button onClick={() => setActiveTab('results')} className={\`px-4 py-2 rounded \${activeTab === 'results' ? 'bg-purple-600 text-white' : 'bg-gray-200'}\`}>
                Results
              </button>
            </div>
          </header>
          {activeTab === 'voting' ? (
            <Voting
              activeContest={activeContest}
              currentContestant={currentContestant}
              updateScore={updateScore}
              getScore={getScore}
              setCurrentContestant={setCurrentContestant}
            />
          ) : (
            <Results
              activeContest={activeContest}
              getAverageScore={getAverageScore}
              getContestantRank={getContestantRank}
              toggleContestantDetails={toggleContestantDetails}
              selectedContestant={selectedContestant}
              users={users}
              allScores={allScores}
              currentUser={currentUser}
              handleEditVote={handleEditVote}
            />
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default App;
`;

// Write the new content to src/App.js
fs.writeFileSync(appPath, newAppJsContent, 'utf8');
console.log("src/App.js patched successfully!");

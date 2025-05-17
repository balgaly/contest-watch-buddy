import React, { useState, useEffect } from 'react';
import { ADMIN_PASSWORD, CRITERIA } from './constants';
import LoginScreen from './components/LoginScreen';
import SessionScreen from './components/SessionScreen';
import UserManagement from './components/UserManagement';
import ContestSelection from './components/ContestSelection';
import Voting from './components/Voting';
import Results from './components/Results';
import MyVotesResults from './components/MyVotesResults';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';

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
  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(true);
  const [activeContestId, setActiveContestId] = useState('euro2025sf2');
  const [currentContestant, setCurrentContestant] = useState(null);
  const [selectedContestant, setSelectedContestant] = useState(null);
  
  // Get active contest
  const activeContest = contests.find(c => c.id === activeContestId) || contests[0];

  // Load scores for active contest
  useEffect(() => {
    const fetchScores = async () => {
      if (!activeContestId) return;
      
      try {
        console.log("📡 Fetching scores for contest:", activeContestId);
        const scoresData = {};
        const contestantsRef = collection(db, "contests", activeContestId, "contestants");
        const contestantsSnapshot = await getDocs(contestantsRef);

        await Promise.all(contestantsSnapshot.docs.map(async (contestantDoc) => {
          const contestantId = contestantDoc.id;
          scoresData[contestantId] = {};
          const scoresRef = collection(db, "contests", activeContestId, "contestants", contestantId, "scores");
          const scoresSnapshot = await getDocs(scoresRef);
          scoresSnapshot.forEach((scoreDoc) => {
            const scoreData = scoreDoc.data();
            // Update scores while preserving existing scores for other contests
            setAllScores(prev => {
              if (!prev[currentUser?.id]) return prev;  // If no user scores exist yet, wait for user scores effect
              return {
                ...prev,
                [currentUser.id]: {
                  ...prev[currentUser.id],
                  [activeContestId]: {
                    ...(prev[currentUser.id][activeContestId] || {}),
                    [contestantId]: scoreData
                  }
                }
              };
            });
          });
        }));

      } catch (error) {
        console.error("🔥 Error fetching scores:", error);
      }
    };

    fetchScores();
  }, [activeContestId, currentUser]);

  // Fetch all user's scores when logging in or resuming session
  useEffect(() => {
    const fetchUserScores = async () => {
      if (!currentUser) return;
      
      try {
        console.log("📡 Fetching all scores for user:", currentUser.name);
        const userScores = {};

        // Fetch scores for all contests
        for (const contest of contests) {
          userScores[contest.id] = {};
          const contestantsRef = collection(db, "contests", contest.id, "contestants");
          const contestantsSnapshot = await getDocs(contestantsRef);

          for (const contestantDoc of contestantsSnapshot.docs) {
            const contestantId = contestantDoc.id;
            const scoreRef = doc(db, "contests", contest.id, "contestants", contestantId, "scores", currentUser.id);
            const scoreDoc = await getDoc(scoreRef);
            
            if (scoreDoc.exists()) {
              userScores[contest.id][contestantId] = scoreDoc.data();
            }
          }
        }

        // Update allScores with the user's scores
        setAllScores(prev => ({
          ...prev,
          [currentUser.id]: userScores
        }));

        console.log("✅ User scores fetched successfully:", userScores);
      } catch (error) {
        console.error("🔥 Error fetching user scores:", error);
      }
    };

    fetchUserScores();
  }, [currentUser, contests]);

  // Load global data and current session on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch users from Firestore
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        localStorage.setItem('globalUsers', JSON.stringify(usersList));

        // Fetch contests from Firestore
        console.log("📡 Fetching contests from Firebase...");
        const contestsRef = collection(db, 'contests');
        const contestsSnapshot = await getDocs(contestsRef);
        const fetchedContests = [];
        
        for (const contestDoc of contestsSnapshot.docs) {
          const contestData = contestDoc.data();
          // Fetch contestants for each contest
          const contestantsRef = collection(db, 'contests', contestDoc.id, 'contestants');
          const contestantsSnapshot = await getDocs(contestantsRef);
          const contestants = contestantsSnapshot.docs.map(docu => ({ id: docu.id, ...docu.data() }));
          fetchedContests.push({ id: contestDoc.id, ...contestData, contestants });
        }
        
        console.log("✅ Fetched contests:", fetchedContests);
        setContests(fetchedContests);
        
        // Set default contest if not set and we have contests
        if ((!activeContestId || !fetchedContests.find(c => c.id === activeContestId)) && fetchedContests.length > 0) {
          console.log("Setting default contest to:", fetchedContests[0].id);
          setActiveContestId(fetchedContests[0].id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to localStorage
        const storedGlobalUsers = localStorage.getItem('globalUsers');
        if (storedGlobalUsers) setUsers(JSON.parse(storedGlobalUsers));
      } finally {
        setContestsLoading(false);
      }
    };

    loadData();

    // Load session data
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
  const handleLogin = async () => {
    if (!username.trim()) {
      setLoginError("Please enter your name");
      return;
    }
    let newUser;
    if (showAdminLogin) {
      if (password === ADMIN_PASSWORD) {
        newUser = { name: username, isAdmin: true };
      } else {
        setLoginError("Incorrect admin password");
        return;
      }
    } else {
      newUser = { name: username, isAdmin: false };
    }
    try {
      // Save the username before clearing it
      localStorage.setItem('lastUsername', username.trim());

      // Check if user already exists in Firestore (by name)
      const usersSnapshot = await getDocs(collection(db, "users"));
      let existing = null;
      usersSnapshot.forEach(docu => {
        if (docu.data().name === username) existing = { id: docu.id, ...docu.data() };
      });
      let userId;
      if (existing) {
        // If user exists and is an admin, require password
        if (existing.isAdmin) {
          if (!showAdminLogin || password !== ADMIN_PASSWORD) {
            setLoginError("This username belongs to an admin. Please use admin login.");
            return;
          }
        }
        userId = existing.id;
        newUser = existing;
      } else {
        // Add new user to Firestore
        userId = Date.now().toString();
        await setDoc(doc(db, "users", userId), newUser);
        newUser = { ...newUser, id: userId };
      }
      setUsers(prev => {
        const filtered = prev.filter(u => u.id !== userId);
        return [...filtered, newUser];
      });
      setCurrentUser(newUser);
      setPage('main');
      setUsername('');
      setPassword('');
      setShowAdminLogin(false);
      setLoginError('');
      // Fetch latest users from Firestore after login
      const usersSnapshotAfterLogin = await getDocs(collection(db, "users"));
      const usersList = usersSnapshotAfterLogin.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (e) {
      console.error("Login error:", e);
      setLoginError("Could not log in. Please try again.");
    }
  };

  // Handler for logout: go directly to login page
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out? You will not be able to return to your current session.")) {
      setCurrentUser(null);
      setPage('login');
      localStorage.removeItem('currentSession');
    }
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

  // Clear current contest scores only (admin-only)
  const handleClearCompetition = async () => {
    if (window.confirm(`Are you sure you want to clear all scores for ${activeContest.name}? This will remove all votes for this contest only.`)) {
      try {
        console.log(`🗑️ Starting cleanup for contest: ${activeContest.name}...`);
        
        // Clear Firebase scores for the current contest only
        const contestantsRef = collection(db, "contests", activeContestId, "contestants");
        const contestantsSnapshot = await getDocs(contestantsRef);
        
        for (const contestantDoc of contestantsSnapshot.docs) {
          const scoresRef = collection(db, "contests", activeContestId, "contestants", contestantDoc.id, "scores");
          const scoresSnapshot = await getDocs(scoresRef);
          
          // Delete all scores for this contestant
          for (const scoreDoc of scoresSnapshot.docs) {
            await deleteDoc(doc(db, "contests", activeContestId, "contestants", contestantDoc.id, "scores", scoreDoc.id));
          }
        }

        // Clear only scores for this contest from local state
        setAllScores(prev => {
          const newScores = { ...prev };
          // For each user's scores
          Object.keys(newScores).forEach(userId => {
            if (newScores[userId][activeContestId]) {
              // Remove only this contest's scores
              delete newScores[userId][activeContestId];
            }
          });
          return newScores;
        });

        console.log(`✅ Successfully cleared all scores for ${activeContest.name}!`);
      } catch (error) {
        console.error("🔥 Error clearing contest scores:", error);
        alert("There was an error clearing the scores. Please try again or contact support.");
      }
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
          [criterionId]: parseFloat(newValue) || 0
        };
        let overall = 0;
        let hasAllScores = true;
        CRITERIA.forEach(criterion => {
          if (updatedScores[criterion.id]) {
            overall += parseFloat(updatedScores[criterion.id]) * criterion.weight;
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

  // User management: fetch users from Firestore when opening user management page
  useEffect(() => {
    if (page === 'userManagement') {
      (async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, "users"));
          const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUsers(usersList);
        } catch (e) {}
      })();
    }
  }, [page]);

  const deleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user and their ratings?")) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      const newScores = { ...allScores };
      delete newScores[userId];
      setAllScores(newScores);
      if (currentUser && userId === currentUser.id) {
        setCurrentUser(null);
        setPage('login');
      }
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (e) {}
    }
  };

  const switchContest = (contestId) => {
    if (contests.find(c => c.id === contestId)) {
      setActiveContestId(contestId);
      setCurrentContestant(null);
      setSelectedContestant(null);
      // Only switch to main page if we're already logged in
      if (currentUser) {
        setPage('main');
      }
    }
  };

  const toggleContestStatus = async () => {
    if (!currentUser?.isAdmin || !activeContest) return;
    
    try {
      const contestRef = doc(db, "contests", activeContestId);
      const newStatus = !activeContest.closed;
      
      // Update Firestore
      await setDoc(contestRef, { closed: newStatus }, { merge: true });
      
      // Update local state
      setContests(prev => prev.map(contest => 
        contest.id === activeContestId 
          ? { ...contest, closed: newStatus }
          : contest
      ));

      // If contest is being closed and voting tab is active, switch to results
      if (newStatus && activeTab === 'voting') {
        setActiveTab('results');
      }
    } catch (error) {
      console.error("Error toggling contest status:", error);
      alert("Failed to update contest status. Please try again.");
    }
  };

  const updateScore = async (contestantId, criterionId, value) => {
    if (!currentUser) return;
    console.log(`Updating score: Contestant ${contestantId}, Criterion ${criterionId}, Value ${value}`);

    // Compute the new value using a functional state update
    let computedContestantScores = null;
    setAllScores(prev => {
      // Get previous user/contest scores
      const userScores = { ...(prev[currentUser.id] || {}) };
      const contestScores = { ...(userScores[activeContestId] || {}) };
      const contestantKey = contestantId.toString();
      const contestantScores = { ...(contestScores[contestantKey] || {}) };

      // Merge new vote value and voter details
      contestantScores[criterionId] = parseFloat(value) || 0;
      contestantScores.voterName = currentUser.name;
      contestantScores.voterIsAdmin = currentUser.isAdmin;

      // Recalculate overall score based on CRITERIA and new values
      let overall = 0;
      let hasAllScores = true;
      CRITERIA.forEach(criterion => {
        if (contestantScores[criterion.id] !== undefined) {
          overall += parseFloat(contestantScores[criterion.id]) * criterion.weight;
        } else {
          hasAllScores = false;
        }
      });
      if (hasAllScores) {
        contestantScores.overall = overall;
      } else {
        delete contestantScores.overall;
      }

      // Save the computed object to be used for Firestore update
      computedContestantScores = { ...contestantScores };

      // Update state
      contestScores[contestantKey] = contestantScores;
      userScores[activeContestId] = contestScores;
      return { 
        ...prev, 
        [currentUser.id]: userScores 
      };
    });

    // Write the latest computed scores immediately to Firestore
    try {
      const updatedScores = {
        ...computedContestantScores,
        updatedAt: new Date().toISOString()
      };

      const scoreRef = doc(
        db,
        "contests",
        activeContestId,
        "contestants",
        contestantId.toString(),
        "scores",
        currentUser.id
      );

      await setDoc(scoreRef, updatedScores, { merge: true });
      console.log("✅ Score updated in Firestore:", updatedScores);
    } catch (error) {
      console.error("🔥 Error updating score in Firestore:", error);
    }
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
        contests={contests}
        activeContestId={activeContestId}
        switchContest={switchContest}
      />
    );
  }
  if (page === 'session') {
    return <SessionScreen 
      resumeSession={resumeSession} 
      clearSession={handleClearCompetition} 
      isAdmin={currentUser?.isAdmin} 
    />;
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
      <div className="min-h-screen bg-cyan-50 p-4">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6">
            <div className="flex flex-col space-y-4">
              {/* Contest Info & User Info */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-cyan-900 truncate">{activeContest?.name || 'Contest'}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <button onClick={() => setPage('contestSelection')} className="text-sm text-cyan-600 hover:underline">
                      Change Contest
                    </button>
                    {currentUser?.isAdmin && (
                      <button onClick={() => setPage('userManagement')} className="text-sm text-cyan-600 hover:underline">
                        Manage Users
                      </button>
                    )}
                  </div>
                  {activeContest?.closed && (
                    <div className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v3a2 2 0 01-2 2z" />
                      </svg>
                      Voting is closed
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <span className="text-gray-600 whitespace-nowrap">
                    {currentUser?.name} {currentUser?.isAdmin && <span className="text-cyan-600">👑</span>}
                  </span>
                  <button onClick={handleLogout} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm whitespace-nowrap">
                    Logout
                  </button>
                </div>
              </div>

              {/* Admin Controls */}
              {currentUser?.isAdmin && (
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <button onClick={toggleContestStatus} className={`px-3 py-1 rounded text-sm ${activeContest?.closed ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`}>
                    {activeContest?.closed ? 'Open Voting' : 'Close Voting'}
                  </button>
                  <button onClick={handleClearCompetition} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    Clear Competition
                  </button>
                </div>
              )}

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2">
                {!activeContest?.closed && (
                  <button onClick={() => setActiveTab('voting')} className={`px-4 py-2 rounded ${activeTab === 'voting' ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                    Voting
                  </button>
                )}
                <button onClick={() => setActiveTab('results')} className={`px-4 py-2 rounded ${activeTab === 'results' ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                  Results
                </button>
                <button onClick={() => setActiveTab('myvotes')} className={`px-4 py-2 rounded ${activeTab === 'myvotes' ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                  My Results
                </button>
              </div>
            </div>
          </header>
          {activeTab === 'voting' && !activeContest?.closed ? (
            <Voting
              activeContest={activeContest}
              currentContestant={currentContestant}
              updateScore={updateScore}
              getScore={getScore}
              setCurrentContestant={setCurrentContestant}
            />
          ) : activeTab === 'results' ? (
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
          ) : (
            <MyVotesResults
              activeContest={activeContest}
              allScores={allScores}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default App;

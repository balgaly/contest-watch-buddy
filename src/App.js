import React, { useState, useEffect } from 'react';
import { ADMIN_PASSWORD, CRITERIA, initialContests } from './constants';
import LoginScreen from './components/LoginScreen';
import SessionScreen from './components/SessionScreen';
import UserManagement from './components/UserManagement';
import ContestSelection from './components/ContestSelection';
import Voting from './components/Voting';
import Results from './components/Results';
import { doc, setDoc, getDoc, collection, onSnapshot, getDocs, deleteDoc } from "firebase/firestore";
import { app, db } from './firebase/firebaseConfig';

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
  useEffect(() => {
    // This listens for live updates from Firebase and updates allScores in real time
    const unsubscribe = onSnapshot(collection(db, "scores"), (snapshot) => {
      let updatedScores = {};
      snapshot.forEach((doc) => {
        updatedScores[doc.id] = doc.data();
      });
      console.log("Updated scores from Firebase:", updatedScores);
      setAllScores(updatedScores);
    });

    return () => unsubscribe(); // Cleanup the listener when component unmounts
  }, []);


  // Contest state
  const [contests] = useState(initialContests);
  const [activeContestId, setActiveContestId] = useState('melo2025');
  const [currentContestant, setCurrentContestant] = useState(null);
  const [selectedContestant, setSelectedContestant] = useState(null);

  // Get active contest
  const activeContest = contests.find(c => c.id === activeContestId) || contests[0];

  // New state for tracking if session was started by admin
  const [isAdminSession, setIsAdminSession] = useState(false);

  // New state for average score
  const [averageScore, setAverageScore] = useState(0);

  const fetchAllScoresDebug = async () => {
    if (!activeContestId) return;

    console.log("🔍 Fetching all scores manually from Firebase...");

    try {
      const scoresRef = collection(db, "contests", activeContestId, "contestants");
      const snapshot = await getDocs(scoresRef);

      if (snapshot.empty) {
        console.log("⚠️ No contestants found in Firebase for this contest!");
        return;
      }

      let debugScores = {};

      for (const contestantDoc of snapshot.docs) {
        const contestantId = contestantDoc.id;
        console.log(`📌 Found contestant: ${contestantId}`);

        const scoresCollectionRef = collection(
          db,
          "contests",
          activeContestId,
          "contestants",
          contestantId,
          "scores"
        );

        const scoresSnapshot = await getDocs(scoresCollectionRef);
        if (scoresSnapshot.empty) {
          console.log(`⚠️ No scores found for contestant ${contestantId}`);
          continue;
        }

        const contestantScores = {};
        scoresSnapshot.forEach((scoreDoc) => {
          contestantScores[scoreDoc.id] = scoreDoc.data();
        });

        debugScores[contestantId] = contestantScores;
      }

      console.log("🔎 Final Firebase Scores Structure:", debugScores);
    } catch (error) {
      console.error("🔥 Firestore Query Error:", error);
    }
  };


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
        setIsAdminSession(true);
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

  const updateScore = async (contestantId, criterionId, value) => {
    if (!currentUser) return;

    console.log(`📝 Attempting to update score in Firebase: Contestant ${contestantId}, Criterion ${criterionId}, Value ${value}`);

    const contestantRef = doc(
      db,
      "contests", activeContestId.toString(),
      "contestants", contestantId.toString()
    );

    // ✅ Ensure the contestant document exists
    await setDoc(contestantRef, { created: true }, { merge: true });

    const voteRef = doc(
      db,
      "contests", activeContestId.toString(),
      "contestants", contestantId.toString(),
      "scores", currentUser.id.toString()
    );

    // ✅ Update Firestore with the new score, including voter's name
    await setDoc(voteRef, { [criterionId]: parseInt(value) || 0, voterName: currentUser.name }, { merge: true });

    console.log("✅ Score successfully updated in Firebase!");
  };



  const getScore = async (contestantId, criterionId) => {
    if (!currentUser) return 0;

    const voteRef = doc(
      db,
      'contests', activeContestId.toString(),
      'contestants', contestantId.toString(),
      'scores', currentUser.id.toString()
    );

    const docSnap = await getDoc(voteRef);

    if (docSnap.exists()) {
      const score = parseFloat(docSnap.data()[criterionId]) || 0;
      console.log(`Retrieved score for contestantId: ${contestantId}, criterionId: ${criterionId} is ${score}`);
      return score;
    } else {
      console.log(`No score found for contestantId: ${contestantId}, criterionId: ${criterionId}`);
      return 0;
    }
  };

  useEffect(() => {
    if (!activeContestId) return;

    console.log("📡 Setting up Firestore listener...");

    const scoresRef = collection(db, "contests", activeContestId, "contestants");

    const unsubscribe = onSnapshot(scoresRef, async (snapshot) => {
      let updatedScores = {};

      for (const contestantDoc of snapshot.docs) {
        const contestantId = contestantDoc.id;
        console.log(`👀 Fetching scores for contestant: ${contestantId}`);

        const scoresCollectionRef = collection(
          db,
          "contests",
          activeContestId,
          "contestants",
          contestantId,
          "scores"
        );

        const scoresSnapshot = await getDocs(scoresCollectionRef);
        if (scoresSnapshot.empty) {
          console.log(`⚠️ No scores found for contestant ${contestantId}`);
          continue;
        }

        const contestantScores = {};
        scoresSnapshot.forEach((scoreDoc) => {
          contestantScores[scoreDoc.id] = scoreDoc.data();
        });

        updatedScores[contestantId] = contestantScores;
      }

      console.log("✅ Updated allScores from Firebase:", updatedScores);
      setAllScores(updatedScores);
    });

    return () => unsubscribe();
  }, [activeContestId]);




  const getAverageScore = (contestantId, criterionId) => {
    if (!allScores || Object.keys(allScores).length === 0) {
      console.log(`⚠️ No scores found in allScores.`);
      return 0;
    }

    let total = 0;
    let count = 0;

    console.log(`🔍 Checking scores for Contestant ${contestantId}, Criterion ${criterionId}`, allScores);

    Object.entries(allScores).forEach(([contestantKey, userScores]) => {
      if (contestantKey === contestantId && userScores) {
        Object.values(userScores).forEach(userScore => {
          if (userScore && userScore[criterionId] !== undefined) {
            total += userScore[criterionId];
            count++;
          }
        });
      }
    });

    console.log(`ℹ️ Average score for ${contestantId} - ${criterionId}:`, count > 0 ? total / count : 0);
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

  const deleteAllScores = async () => {
    if (!activeContestId) return;

    console.log("🗑️ Deleting all scores for the active contest...");

    try {
      const scoresRef = collection(db, "contests", activeContestId, "contestants");
      const snapshot = await getDocs(scoresRef);

      for (const contestantDoc of snapshot.docs) {
        const contestantId = contestantDoc.id;
        const scoresCollectionRef = collection(
          db,
          "contests",
          activeContestId,
          "contestants",
          contestantId,
          "scores"
        );

        const scoresSnapshot = await getDocs(scoresCollectionRef);
        for (const scoreDoc of scoresSnapshot.docs) {
          await deleteDoc(scoreDoc.ref);
        }
      }

      console.log("✅ All scores deleted successfully!");
      alert("All scores have been deleted successfully!");
    } catch (error) {
      console.error("🔥 Error deleting scores:", error);
      alert("An error occurred while deleting scores. Please check the console for details.");
    }
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
        addUser={(newUser) => setUsers([...users, { id: users.length + 1, ...newUser }])}
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
                {(currentUser?.isAdmin || isAdminSession) && (
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
                {currentUser?.isAdmin && (
                  <button onClick={deleteAllScores} className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    Delete All Scores
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('voting')} className={`px-4 py-2 rounded ${activeTab === 'voting' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                Voting
              </button>
              <button onClick={() => {
                setActiveTab('results');
                fetchAllScoresDebug(); // Manually fetch scores from Firebase
              }} className={`px-4 py-2 rounded ${activeTab === 'results' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
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


import React, { useState, useEffect } from 'react';
import { ADMIN_PASSWORD, CRITERIA, initialContests } from './constants';
import LoginScreen from './components/LoginScreen';
import SessionScreen from './components/SessionScreen';
import UserManagement from './components/UserManagement';
import ContestSelection from './components/ContestSelection';
import Voting from './components/Voting';
import Results from './components/Results';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
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
  const [contests] = useState(initialContests);
  const [activeContestId, setActiveContestId] = useState('euro2025sf1');
  const [currentContestant, setCurrentContestant] = useState(null);
  const [selectedContestant, setSelectedContestant] = useState(null);
  
  // Get active contest
  const activeContest = contests.find(c => c.id === activeContestId) || contests[0];

  // Load global data and current session on mount
  useEffect(() => {
    // Fetch users from Firestore
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        localStorage.setItem('globalUsers', JSON.stringify(usersList));
      } catch (e) {
        // fallback to localStorage if Firestore fails
        const storedGlobalUsers = localStorage.getItem('globalUsers');
        if (storedGlobalUsers) setUsers(JSON.parse(storedGlobalUsers));
      }
    };
    fetchUsers();
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
      // Check if user already exists in Firestore (by name)
      const usersSnapshot = await getDocs(collection(db, "users"));
      let existing = null;
      usersSnapshot.forEach(docu => {
        if (docu.data().name === username) existing = { id: docu.id, ...docu.data() };
      });
      let userId;
      if (existing) {
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

  // Clear competition (admin-only)
  const handleClearCompetition = async () => {
    if (window.confirm("Are you sure you want to clear the entire competition? This will remove all votes and users.")) {
      try {
        console.log("🗑️ Starting competition cleanup...");
        
        // Clear Firebase scores for each contestant in each contest
        for (const contest of contests) {
          console.log(`Clearing scores for contest: ${contest.id}`);
          const contestantsRef = collection(db, "contests", contest.id, "contestants");
          const contestantsSnapshot = await getDocs(contestantsRef);
          
          for (const contestantDoc of contestantsSnapshot.docs) {
            const scoresRef = collection(db, "contests", contest.id, "contestants", contestantDoc.id, "scores");
            const scoresSnapshot = await getDocs(scoresRef);
            
            // Delete all scores for this contestant
            for (const scoreDoc of scoresSnapshot.docs) {
              await deleteDoc(doc(db, "contests", contest.id, "contestants", contestantDoc.id, "scores", scoreDoc.id));
            }
          }
        }

        // Clear all users from Firebase (except admins if needed)
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        for (const userDoc of usersSnapshot.docs) {
          await deleteDoc(doc(db, "users", userDoc.id));
        }

        // Clear local state
        setUsers([]);
        setAllScores({});
        setCurrentUser(null);
        setPage('login');
        localStorage.removeItem('currentSession');
        localStorage.removeItem('globalUsers');
        localStorage.removeItem('globalAllScores');

        console.log("✅ Competition data cleared successfully!");
      } catch (error) {
        console.error("🔥 Error clearing competition data:", error);
        alert("There was an error clearing some data. Please try again or contact support.");
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
    setActiveContestId(contestId);
    setCurrentContestant(null);
    setSelectedContestant(null);
    setPage('main');
  };

  const updateScore = async (contestantId, criterionId, value) => {
    if (!currentUser) return;
    console.log(`Updating score: Contestant ${contestantId}, Criterion ${criterionId}, Value ${value}`);

    // First update local state
    setAllScores(prev => {
        const userScores = prev[currentUser.id] || {};
        const contestScores = userScores[activeContestId] || {};
        const contestantScores = contestScores[contestantId.toString()] || {};
        const updatedScores = {
            ...contestantScores,
            [criterionId]: parseFloat(value) || 0,
            voterName: currentUser.name,
            voterIsAdmin: currentUser.isAdmin
        };
        
        // Calculate overall score if all criteria are present
        let overall = 0;
        let hasAllScores = true;
        CRITERIA.forEach(criterion => {
            if (updatedScores[criterion.id] !== undefined) {
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
            [currentUser.id]: {
                ...userScores,
                [activeContestId]: {
                    ...contestScores,
                    [contestantId.toString()]: updatedScores
                }
            }
        };
    });

    try {
        // Get current scores from local state to ensure we have all criteria
        const currentScores = allScores[currentUser.id]?.[activeContestId]?.[contestantId.toString()] || {};
        const updatedScores = {
            ...currentScores,
            [criterionId]: parseFloat(value) || 0,
            voterName: currentUser.name,
            voterIsAdmin: currentUser.isAdmin,
            updatedAt: new Date().toISOString()
        };

        // Calculate overall score if all criteria are present
        let overall = 0;
        let hasAllScores = true;
        CRITERIA.forEach(criterion => {
            const score = updatedScores[criterion.id];
            if (score !== undefined) {
                overall += parseFloat(score) * criterion.weight;
            } else {
                hasAllScores = false;
            }
        });

        if (hasAllScores) {
            updatedScores.overall = overall;
        }

        // Write complete score data to Firestore
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
              <button onClick={() => setActiveTab('voting')} className={`px-4 py-2 rounded ${activeTab === 'voting' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                Voting
              </button>
              <button onClick={() => setActiveTab('results')} className={`px-4 py-2 rounded ${activeTab === 'results' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
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

const initializeEuro2025SF1 = async () => {
  const contestId = "euro2025sf1";
  const contestants = [
    { id: 1, name: "VÆB – RÓA", country: "Iceland" },
    { id: 2, name: "Justyna Steczkowska – GAJA", country: "Poland" },
    { id: 3, name: "Klemen – How Much Time Do We Have Left", country: "Slovenia" },
    { id: 4, name: "Tommy Cash – Espresso Macchiato", country: "Estonia" },
    { id: 5, name: "Ziferblat – Bird of Pray", country: "Ukraine" },
    { id: 6, name: "KAJ – Bara Bada Bastu", country: "Sweden" },
    { id: 7, name: "NAPA – Deslocado", country: "Portugal" },
    { id: 8, name: "Kyle Alessandro – Lighter", country: "Norway" },
    { id: 9, name: "Red Sebastian – Strobe Lights", country: "Belgium" },
    { id: 10, name: "Mamagama – Run With U", country: "Azerbaijan" },
    { id: 11, name: "Gabry Ponte – Tutta l'Italia", country: "San Marino" },
    { id: 12, name: "Shkodra Elektronike – Zjerm", country: "Albania" },
    { id: 13, name: "Claude – C'est la vie", country: "Netherlands" },
    { id: 14, name: "Marko Bošnjak – Poison Cake", country: "Croatia" },
    { id: 15, name: "Theo Evan – Shh", country: "Cyprus" }
  ];

  try {
    const contestRef = collection(db, "contests");
    const contestDocRef = doc(contestRef, contestId);

    // Initialize the contest document
    await setDoc(contestDocRef, { name: "Eurovision 2025 Semi Final 1" });

    // Add contestants
    for (const contestant of contestants) {
      const contestantRef = doc(collection(contestDocRef, "contestants"), contestant.id.toString());
      await setDoc(contestantRef, contestant);
    }

    console.log("✅ Eurovision 2025 Semi Final 1 initialized successfully in Firebase!");
  } catch (error) {
    console.error("🔥 Error initializing Eurovision 2025 Semi Final 1:", error);
  }
};

initializeEuro2025SF1();

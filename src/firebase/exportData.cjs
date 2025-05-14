const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
    apiKey: "AIzaSyBO87ehet4r1evEa_eIaLYg4VvsFB2mIJo",
    authDomain: "contest-watch-buddy.firebaseapp.com",
    projectId: "contest-watch-buddy",
    storageBucket: "contest-watch-buddy.firebasestorage.app",
    messagingSenderId: "753858857",
    appId: "1:753858857:web:f2eb3aa833f420149d5f38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const exportFirebaseData = async () => {
    try {
        const data = {
            contests: {},
            users: []
        };

        // Fetch all contests
        console.log("📡 Fetching contests...");
        const contestsRef = collection(db, "contests");
        const contestsSnapshot = await getDocs(contestsRef);
        
        // For each contest
        for (const contestDoc of contestsSnapshot.docs) {
            const contestId = contestDoc.id;
            const contestData = contestDoc.data();
            
            // Initialize contest data structure
            data.contests[contestId] = {
                ...contestData,
                contestants: {},
                scores: {}
            };

            // Fetch contestants
            console.log(`📡 Fetching contestants for ${contestData.name}...`);
            const contestantsRef = collection(db, "contests", contestId, "contestants");
            const contestantsSnapshot = await getDocs(contestantsRef);
            
            // For each contestant
            for (const contestantDoc of contestantsSnapshot.docs) {
                const contestantId = contestantDoc.id;
                const contestantData = contestantDoc.data();
                
                // Store contestant data
                data.contests[contestId].contestants[contestantId] = contestantData;
                
                // Fetch scores for this contestant
                const scoresRef = collection(db, "contests", contestId, "contestants", contestantId, "scores");
                const scoresSnapshot = await getDocs(scoresRef);
                
                // Store all scores
                data.contests[contestId].scores[contestantId] = {};
                scoresSnapshot.docs.forEach(scoreDoc => {
                    data.contests[contestId].scores[contestantId][scoreDoc.id] = scoreDoc.data();
                });
            }
        }

        // Fetch all users
        console.log("📡 Fetching users...");
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        data.users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Create backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `firebase-backup-${timestamp}.json`;
        const backupPath = path.join(__dirname, backupFileName);

        // Save to file
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
        console.log(`✅ Backup saved to: ${backupPath}`);
        
        return data;
    } catch (error) {
        console.error("🔥 Error exporting data:", error);
        throw error;
    }
};

exportFirebaseData();

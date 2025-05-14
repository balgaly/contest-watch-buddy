const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
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

const restoreFirebaseData = async (backupFilePath) => {
    try {
        // Read backup file
        const data = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
        
        // Restore contests
        for (const [contestId, contestData] of Object.entries(data.contests)) {
            console.log(`📤 Restoring contest: ${contestData.name}...`);
            
            // Create contest document
            const contestRef = doc(db, "contests", contestId);
            const { contestants, scores, ...contestInfo } = contestData;
            await setDoc(contestRef, contestInfo);
            
            // Restore contestants
            for (const [contestantId, contestantData] of Object.entries(contestants)) {
                const contestantRef = doc(db, "contests", contestId, "contestants", contestantId);
                await setDoc(contestantRef, contestantData);
                
                // Restore scores for this contestant
                if (scores[contestantId]) {
                    for (const [userId, scoreData] of Object.entries(scores[contestantId])) {
                        const scoreRef = doc(db, "contests", contestId, "contestants", contestantId, "scores", userId);
                        await setDoc(scoreRef, scoreData);
                    }
                }
            }
        }
        
        // Restore users
        console.log("📤 Restoring users...");
        for (const userData of data.users) {
            const { id, ...userInfo } = userData;
            const userRef = doc(db, "users", id);
            await setDoc(userRef, userInfo);
        }
        
        console.log("✅ Restore completed successfully!");
    } catch (error) {
        console.error("🔥 Error restoring data:", error);
        throw error;
    }
};

// If a backup file path is provided as an argument, restore from that file
if (process.argv[2]) {
    restoreFirebaseData(process.argv[2]);
} else {
    console.log("Please provide a backup file path as an argument.");
    console.log("Example: node restoreData.cjs ./firebase-backup-2025-05-14.json");
}

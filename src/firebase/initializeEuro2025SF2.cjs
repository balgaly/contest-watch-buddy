const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } = require('firebase/firestore');

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

const initializeEuro2025SF2 = async () => {
    const contestId = "euro2025sf2";
    const contestants = [
        { id: 1, order: 1, name: "Go-Jo – Milkshake Man", country: "Australia" },
        { id: 2, order: 2, name: "Nina Žižić – Dobrodošli", country: "Montenegro" },
        { id: 3, order: 3, name: "EMMY – Laika Party", country: "Ireland" },
        { id: 4, order: 4, name: "Tautumeitas – Bur man laimi", country: "Latvia" },
        { id: 5, order: 5, name: "Parg – Survivor", country: "Armenia" },
        { id: 6, order: 6, name: "JJ – Wasted Love", country: "Austria" },
        { id: 7, order: 7, name: "Remember Monday – What the Hell Just Happened?", country: "United Kingdom" },
        { id: 8, order: 8, name: "Klavdia – Asteromata", country: "Greece" },
        { id: 9, order: 9, name: "Katarsis – Tavo akys", country: "Lithuania" },
        { id: 10, order: 10, name: "Miriana Conte – Serving", country: "Malta" },
        { id: 11, order: 11, name: "Mariam Shengelia – Freedom", country: "Georgia" },
        { id: 12, order: 12, name: "Louane – Maman", country: "France" },
        { id: 13, order: 13, name: "Sissal – Hallucination", country: "Denmark" },
        { id: 14, order: 14, name: "ADONXS – Kiss Kiss Goodbye", country: "Czechia" },
        { id: 15, order: 15, name: "Laura Thorn – La poupée monte le son", country: "Luxembourg" },
        { id: 16, order: 16, name: "Yuval Raphael – New Day Will Rise", country: "Israel" },
        { id: 17, order: 17, name: "Abor & Tynna – Baller", country: "Germany" },
        { id: 18, order: 18, name: "Princ – Mila", country: "Serbia" },
        { id: 19, order: 19, name: "Erika Vikman – Ich komme", country: "Finland" }
    ];

    try {
        // Initialize the contest document
        const contestRef = doc(db, "contests", contestId);
        await setDoc(contestRef, { 
            name: "Eurovision 2025 Semi Final 2",
            createdAt: new Date().toISOString()
        });

        // Add contestants
        for (const contestant of contestants) {
            const contestantRef = doc(collection(db, "contests", contestId, "contestants"), contestant.id.toString());
            await setDoc(contestantRef, contestant);
        }

        console.log("✅ Eurovision 2025 Semi Final 2 initialized successfully!");
    } catch (error) {
        console.error("🔥 Error initializing Eurovision 2025 Semi Final 2:", error);
    }
};

initializeEuro2025SF2();

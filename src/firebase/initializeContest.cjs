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

const deleteExistingContest = async (contestId) => {
    try {
        console.log(`🗑️ Deleting existing contest ${contestId}...`);
        const contestRef = doc(db, "contests", contestId);
        const contestantsRef = collection(contestRef, "contestants");
        const contestantsSnapshot = await getDocs(contestantsRef);
        
        // Delete scores first
        for (const contestantDoc of contestantsSnapshot.docs) {
            const scoresRef = collection(contestRef, "contestants", contestantDoc.id, "scores");
            const scoresSnapshot = await getDocs(scoresRef);
            for (const scoreDoc of scoresSnapshot.docs) {
                await deleteDoc(doc(scoresRef, scoreDoc.id));
            }
            await deleteDoc(contestantDoc.ref);
        }
        
        // Delete the contest document
        await deleteDoc(contestRef);
        console.log("✅ Existing contest deleted successfully!");
    } catch (error) {
        console.error("Error deleting existing contest:", error);
    }
};

const initializeEuro2025SF1 = async () => {
    const contestId = "euro2025sf1";
    const contestants = [
        { id: 1, order: 1, name: "VÆB – RÓA", country: "Iceland" },
        { id: 2, order: 2, name: "Justyna Steczkowska – GAJA", country: "Poland" },
        { id: 3, order: 3, name: "Klemen – How Much Time Do We Have Left", country: "Slovenia" },
        { id: 4, order: 4, name: "Tommy Cash – Espresso Macchiato", country: "Estonia" },
        { id: 5, order: 5, name: "Ziferblat – Bird of Pray", country: "Ukraine" },
        { id: 6, order: 6, name: "KAJ – Bara Bada Bastu", country: "Sweden" },
        { id: 7, order: 7, name: "NAPA – Deslocado", country: "Portugal" },
        { id: 8, order: 8, name: "Kyle Alessandro – Lighter", country: "Norway" },
        { id: 9, order: 9, name: "Red Sebastian – Strobe Lights", country: "Belgium" },
        { id: 10, order: 10, name: "Mamagama – Run With U", country: "Azerbaijan" },
        { id: 11, order: 11, name: "Gabry Ponte – Tutta L'Italia", country: "San Marino" },
        { id: 12, order: 12, name: "Shkodra Elektronike – Zjerm", country: "Albania" },
        { id: 13, order: 13, name: "Claude – C'est La Vie", country: "Netherlands" },
        { id: 14, order: 14, name: "Marko Bošnjak – Poison Cake", country: "Croatia" },
        { id: 15, order: 15, name: "Theo Evan – Shh", country: "Cyprus" }
    ];

    try {
        // First, delete the existing contest
        await deleteExistingContest(contestId);

        // Initialize the contest document
        const contestRef = doc(db, "contests", contestId);
        await setDoc(contestRef, { 
            name: "Eurovision 2025 Semi Final 1",
            createdAt: new Date().toISOString()
        });

        // Add contestants in order
        for (const contestant of contestants) {
            const contestantRef = doc(collection(db, "contests", contestId, "contestants"), contestant.id.toString());
            await setDoc(contestantRef, contestant);
        }

        console.log("✅ Eurovision 2025 Semi Final 1 initialized successfully!");
    } catch (error) {
        console.error("Error initializing contest:", error);
    }
};

initializeEuro2025SF1();
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const deleteExistingContest = async (contestId) => {
    try {
        console.log(`🗑️ Deleting existing contest ${contestId}...`);
        const contestRef = doc(db, "contests", contestId);
        const contestantsRef = collection(contestRef, "contestants");
        const contestantsSnapshot = await getDocs(contestantsRef);
        for (const contestantDoc of contestantsSnapshot.docs) {
            const scoresRef = collection(contestRef, "contestants", contestantDoc.id, "scores");
            const scoresSnapshot = await getDocs(scoresRef);
            for (const scoreDoc of scoresSnapshot.docs) {
                await deleteDoc(doc(scoresRef, scoreDoc.id));
            }
            await deleteDoc(contestantDoc.ref);
        }
        await deleteDoc(contestRef);
        console.log("✅ Existing contest deleted successfully!");
    } catch (error) {
        console.error("Error deleting existing contest:", error);
    }
};

const initializeEuro2025Final = async () => {
    const contestId = "euro2025final";
    const contestants = [
        { id: 1, order: 1, name: "Kyle Alessandro – Lighter", country: "Norway" },
        { id: 2, order: 2, name: "Laura Thorn – La Poupée Monte Le Son", country: "Luxembourg" },
        { id: 3, order: 3, name: "Tommy Cash – Espresso Macchiato", country: "Estonia" },
        { id: 4, order: 4, name: "Yuval Raphael – New Day Will Rise", country: "Israel" },
        { id: 5, order: 5, name: "Katarsis – Tavo Akys", country: "Lithuania" },
        { id: 6, order: 6, name: "Melody – Esa Diva", country: "Spain" },
        { id: 7, order: 7, name: "Ziferblat – Bird of Pray", country: "Ukraine" },
        { id: 8, order: 8, name: "Remember Monday – What The Hell Just Happened?", country: "United Kingdom" },
        { id: 9, order: 9, name: "JJ – Wasted Love", country: "Austria" },
        { id: 10, order: 10, name: "VÆB – RÓA", country: "Iceland" },
        { id: 11, order: 11, name: "Tautumeitas – Bur Man Laimi", country: "Latvia" },
        { id: 12, order: 12, name: "Claude – C’est La Vie", country: "Netherlands" },
        { id: 13, order: 13, name: "Erika Vikman – Ich Komme", country: "Finland" },
        { id: 14, order: 14, name: "Lucio Corsi – Volevo Essere un Duro", country: "Italy" },
        { id: 15, order: 15, name: "Justyna Steczkowska – Gaja", country: "Poland" },
        { id: 16, order: 16, name: "Abor & Tynna – Baller", country: "Germany" },
        { id: 17, order: 17, name: "Klavdia – Asteromata", country: "Greece" },
        { id: 18, order: 18, name: "Parg – Survivor", country: "Armenia" },
        { id: 19, order: 19, name: "Zoë Më – Voyage", country: "Switzerland" },
        { id: 20, order: 20, name: "Miriana Conte – Serving", country: "Malta" },
        { id: 21, order: 21, name: "Napa – Deslocado", country: "Portugal" },
        { id: 22, order: 22, name: "Sissal – Hallucination", country: "Denmark" },
        { id: 23, order: 23, name: "KAJ – Bara Bada Bastu", country: "Sweden" },
        { id: 24, order: 24, name: "Louane – Maman", country: "France" },
        { id: 25, order: 25, name: "Gabry Ponte – Tutta l’Italia", country: "San Marino" },
        { id: 26, order: 26, name: "Shkodra Elektronike – Zjerm", country: "Albania" }
    ];

    try {
        await deleteExistingContest(contestId);
        const contestRef = doc(db, "contests", contestId);
        await setDoc(contestRef, {
            name: "Eurovision 2025",
            createdAt: new Date().toISOString()
        });
        for (const contestant of contestants) {
            const contestantRef = doc(collection(db, "contests", contestId, "contestants"), contestant.id.toString());
            await setDoc(contestantRef, contestant);
        }
        console.log("✅ Eurovision 2025 Final initialized successfully!");
    } catch (error) {
        console.error("Error initializing contest:", error);
    }
};

initializeEuro2025Final();

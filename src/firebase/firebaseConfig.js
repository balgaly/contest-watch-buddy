import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

export { app, db };

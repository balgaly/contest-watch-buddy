import { useState, useEffect, useRef, useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { ADMIN_EMAIL } from '../constants';

const googleProvider = new GoogleAuthProvider();

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const loginInProgress = useRef(false);

  // Auto-resume session via Firebase Auth persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (loginInProgress.current) return;

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() });
          } else {
            // Authenticated but no Firestore profile yet - create one
            const userData = buildUserData(firebaseUser);
            userData.createdAt = new Date().toISOString();
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            setUser({ id: firebaseUser.uid, ...userData });
          }
        } catch (e) {
          console.error('Error loading user profile:', e);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    loginInProgress.current = true;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const existingDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = buildUserData(firebaseUser);
      if (!existingDoc.exists()) {
        userData.createdAt = new Date().toISOString();
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true });

      const userObj = { id: firebaseUser.uid, ...userData };
      setUser(userObj);
      setAuthLoading(false);
      return userObj;
    } finally {
      loginInProgress.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  return { user, authLoading, login, logout };
};

function buildUserData(firebaseUser) {
  return {
    name: firebaseUser.displayName || 'Anonymous',
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL || null,
    isAdmin: firebaseUser.email === ADMIN_EMAIL,
    updatedAt: new Date().toISOString(),
  };
}

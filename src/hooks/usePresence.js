import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const usePresence = (roomId, userId) => {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(collection(db, 'rooms', roomId, 'presence'), (snap) => {
      const now = Date.now();
      const active = snap.docs.some(d => {
        const data = d.data();
        const lastActive = data.lastActive?.toDate?.() || new Date(data.lastActive);
        return now - lastActive.getTime() < 60000;
      });
      setIsLive(active);
    });
    return unsub;
  }, [roomId]);

  const markActive = useCallback(async () => {
    if (!roomId || !userId) return;
    try {
      await setDoc(doc(db, 'rooms', roomId, 'presence', userId), {
        lastActive: Timestamp.now(),
        isVoting: true,
      }, { merge: true });
    } catch (e) {
      console.error('Failed to update presence:', e);
    }
  }, [roomId, userId]);

  return { isLive, markActive };
};

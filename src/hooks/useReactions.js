import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const useReactions = (roomId) => {
  const [reactions, setReactions] = useState([]);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    const thirtySecsAgo = Timestamp.fromDate(new Date(Date.now() - 30000));
    const q = query(
      collection(db, 'rooms', roomId, 'reactions'),
      where('timestamp', '>', thirtySecsAgo)
    );
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const recent = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => {
          const ts = r.timestamp?.toDate?.() || new Date(r.timestamp);
          return now - ts.getTime() < 30000;
        });
      setReactions(recent);
    });
    return unsub;
  }, [roomId]);

  const sendReaction = useCallback(async (userId, userName, emoji, contestantId) => {
    if (!roomId) return;
    const now = Date.now();
    if (now - lastSentRef.current < 2000) return;
    lastSentRef.current = now;
    try {
      await addDoc(collection(db, 'rooms', roomId, 'reactions'), {
        userId,
        userName,
        emoji,
        contestantId,
        timestamp: Timestamp.now(),
      });
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (e) {
      console.error('Failed to send reaction:', e);
    }
  }, [roomId]);

  return { reactions, sendReaction };
};

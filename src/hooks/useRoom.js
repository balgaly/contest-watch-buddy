import { useState, useEffect } from 'react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const useRoom = (roomId) => {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) { setLoading(false); return; }

    let cancelled = false;

    const loadRoom = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (!cancelled && roomDoc.exists()) {
          setRoom({ id: roomId, ...roomDoc.data() });
        }
      } catch (error) {
        console.error('Error loading room:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRoom();

    // Real-time member list
    const unsubscribe = onSnapshot(
      collection(db, 'rooms', roomId, 'members'),
      (snapshot) => {
        if (cancelled) return;
        setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error('Error listening to members:', error)
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [roomId]);

  const memberIds = members.map(m => m.id);

  return { room, members, memberIds, loading };
};

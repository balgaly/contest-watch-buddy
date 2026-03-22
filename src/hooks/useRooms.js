import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const useRooms = (user) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRooms([]); setLoading(false); return; }

    const loadRooms = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        const roomIds = userDoc.data()?.roomIds || [];

        const loaded = [];
        for (const roomId of roomIds) {
          const roomDoc = await getDoc(doc(db, 'rooms', roomId));
          if (roomDoc.exists()) {
            const membersSnap = await getDocs(collection(db, 'rooms', roomId, 'members'));
            loaded.push({ id: roomId, ...roomDoc.data(), memberCount: membersSnap.size });
          }
        }
        setRooms(loaded);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [user]);

  const createRoom = useCallback(async (name, contestId) => {
    if (!user) throw new Error('Not authenticated');

    const code = generateRoomCode();
    const roomRef = doc(collection(db, 'rooms'));

    await setDoc(roomRef, {
      name,
      code,
      contestId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'rooms', roomRef.id, 'members', user.id), {
      name: user.name,
      photoURL: user.photoURL || null,
      joinedAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'users', user.id), {
      roomIds: arrayUnion(roomRef.id)
    }, { merge: true });

    const newRoom = { id: roomRef.id, name, code, contestId, createdBy: user.id, memberCount: 1 };
    setRooms(prev => [...prev, newRoom]);
    return newRoom;
  }, [user]);

  const joinByCode = useCallback(async (code) => {
    if (!user) throw new Error('Not authenticated');

    const q = query(collection(db, 'rooms'), where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error('Room not found. Check the code and try again.');

    const roomDoc = snapshot.docs[0];
    const roomId = roomDoc.id;

    const memberRef = doc(db, 'rooms', roomId, 'members', user.id);
    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) {
      await setDoc(memberRef, {
        name: user.name,
        photoURL: user.photoURL || null,
        joinedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'users', user.id), {
        roomIds: arrayUnion(roomId)
      }, { merge: true });
    }

    const room = { id: roomId, ...roomDoc.data() };
    setRooms(prev => {
      if (prev.find(r => r.id === roomId)) return prev;
      return [...prev, { ...room, memberCount: (room.memberCount || 0) + 1 }];
    });
    return room;
  }, [user]);

  const leaveRoom = useCallback(async (roomId) => {
    if (!user) return;
    await deleteDoc(doc(db, 'rooms', roomId, 'members', user.id));
    await setDoc(doc(db, 'users', user.id), {
      roomIds: arrayRemove(roomId)
    }, { merge: true });
    setRooms(prev => prev.filter(r => r.id !== roomId));
  }, [user]);

  return { rooms, loading, createRoom, joinByCode, leaveRoom };
};

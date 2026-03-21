import { useState, useEffect, useCallback, useRef } from 'react';
import { collectionGroup, collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { CRITERIA } from '../constants';

/**
 * Manages scores for a single contest with real-time updates via a single
 * collection group query instead of per-contestant listeners.
 * allScores shape: { [contestantId]: { [userId]: scoreData } }
 */
export const useScores = (contestId, user) => {
  const [allScores, setAllScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastChanged, setLastChanged] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!contestId || !user) { setLoading(false); return; }
    setLoading(true);

    // Clean up prior listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // Single collection group query filtered by contestId
    const scoresQuery = query(
      collectionGroup(db, 'scores'),
      where('contestId', '==', contestId)
    );

    const unsub = onSnapshot(scoresQuery, (snap) => {
      const nextScores = {};

      snap.forEach((sDoc) => {
        const data = sDoc.data();
        // Extract contestantId from path: contests/{cid}/contestants/{contestantId}/scores/{userId}
        const contestantId = sDoc.ref.parent.parent.id;

        if (!nextScores[contestantId]) nextScores[contestantId] = {};

        // Calculate overall from criteria if missing
        if (data.overall === undefined) {
          let total = 0, hasAll = true;
          CRITERIA.forEach(c => {
            if (data[c.id] !== undefined) total += parseFloat(data[c.id]) * c.weight;
            else hasAll = false;
          });
          if (hasAll) data.overall = total;
        }

        nextScores[contestantId][sDoc.id] = data;
      });

      setAllScores(prev => {
        // Detect which contestant changed by comparing with previous state
        for (const cId of Object.keys(nextScores)) {
          const prevJson = JSON.stringify(prev[cId] || {});
          const nextJson = JSON.stringify(nextScores[cId]);
          if (prevJson !== nextJson) {
            setLastChanged({ contestantId: cId, timestamp: Date.now() });
            break;
          }
        }
        return nextScores;
      });

      setLoading(false);
    });

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [contestId, user]);

  const getScore = useCallback((contestantId, criterionId) => {
    if (!user) return 0;
    return allScores[contestantId.toString()]?.[user.id]?.[criterionId] || 0;
  }, [allScores, user]);

  const submitScore = useCallback(async (contestantId, criterionId, value) => {
    if (!user || !contestId) return;
    const key = contestantId.toString();

    let dataToWrite;
    setAllScores(prev => {
      const current = { ...(prev[key]?.[user.id] || {}) };
      current[criterionId] = parseFloat(value) || 0;
      current.voterName = user.name;
      current.voterPhotoURL = user.photoURL || null;
      current.voterIsAdmin = user.isAdmin;
      current.contestId = contestId;

      let overall = 0;
      let hasAll = true;
      CRITERIA.forEach(c => {
        if (current[c.id] !== undefined) {
          overall += parseFloat(current[c.id]) * c.weight;
        } else { hasAll = false; }
      });
      if (hasAll) current.overall = overall;
      else delete current.overall;

      dataToWrite = current;
      return { ...prev, [key]: { ...(prev[key] || {}), [user.id]: current } };
    });

    try {
      const scoreRef = doc(db, "contests", contestId, "contestants", key, "scores", user.id);
      await setDoc(scoreRef, { ...dataToWrite, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      console.error("Error updating score:", error);
    }
  }, [user, contestId]);

  const deleteScore = useCallback(async (userId, contestantId) => {
    if (!user?.isAdmin || !contestId) return;
    const key = contestantId.toString();
    await deleteDoc(doc(db, "contests", contestId, "contestants", key, "scores", userId));
    setAllScores(prev => {
      const next = { ...prev };
      if (next[key]?.[userId]) {
        const { [userId]: _, ...rest } = next[key];
        next[key] = rest;
      }
      return next;
    });
  }, [user, contestId]);

  const clearAllScores = useCallback(async () => {
    if (!user?.isAdmin || !contestId) return;
    const contestantsRef = collection(db, "contests", contestId, "contestants");
    const contestantsSnapshot = await getDocs(contestantsRef);
    for (const cDoc of contestantsSnapshot.docs) {
      const scoresRef = collection(db, "contests", contestId, "contestants", cDoc.id, "scores");
      const scoresSnapshot = await getDocs(scoresRef);
      for (const sDoc of scoresSnapshot.docs) {
        await deleteDoc(sDoc.ref);
      }
    }
    setAllScores({});
  }, [user, contestId]);

  return {
    allScores, loading, lastChanged, getScore, submitScore,
    deleteScore, clearAllScores,
  };
};

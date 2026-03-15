import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { CRITERIA } from '../constants';

/**
 * Manages scores for a single contest.
 * allScores shape: { [contestantId]: { [userId]: scoreData } }
 */
export const useScores = (contestId, user) => {
  const [allScores, setAllScores] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    if (!contestId || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const contestantsRef = collection(db, "contests", contestId, "contestants");
      const contestantsSnapshot = await getDocs(contestantsRef);
      const scores = {};

      await Promise.all(contestantsSnapshot.docs.map(async (cDoc) => {
        scores[cDoc.id] = {};
        const scoresRef = collection(db, "contests", contestId, "contestants", cDoc.id, "scores");
        const scoresSnapshot = await getDocs(scoresRef);
        scoresSnapshot.forEach((sDoc) => {
          const data = sDoc.data();
          // Calculate overall from criteria if missing (data integrity)
          if (data.overall === undefined) {
            let total = 0, hasAll = true;
            CRITERIA.forEach(c => {
              if (data[c.id] !== undefined) total += parseFloat(data[c.id]) * c.weight;
              else hasAll = false;
            });
            if (hasAll) data.overall = total;
          }
          scores[cDoc.id][sDoc.id] = data;
        });
      }));

      setAllScores(scores);
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setLoading(false);
    }
  }, [contestId, user]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const getScore = useCallback((contestantId, criterionId) => {
    if (!user) return 0;
    return allScores[contestantId.toString()]?.[user.id]?.[criterionId] || 0;
  }, [allScores, user]);

  const submitScore = useCallback(async (contestantId, criterionId, value) => {
    if (!user || !contestId) return;
    const key = contestantId.toString();

    // Use functional updater to read accumulated state from prior calls
    // (fixes race condition when called sequentially for multiple criteria)
    let dataToWrite;
    setAllScores(prev => {
      const current = { ...(prev[key]?.[user.id] || {}) };
      current[criterionId] = parseFloat(value) || 0;
      current.voterName = user.name;
      current.voterPhotoURL = user.photoURL || null;
      current.voterIsAdmin = user.isAdmin;

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
    allScores, loading, getScore, submitScore,
    deleteScore, clearAllScores, refresh: fetchScores,
  };
};

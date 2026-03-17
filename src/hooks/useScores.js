import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { CRITERIA } from '../constants';

/**
 * Manages scores for a single contest with real-time updates via onSnapshot.
 * allScores shape: { [contestantId]: { [userId]: scoreData } }
 */
export const useScores = (contestId, user) => {
  const [allScores, setAllScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastChanged, setLastChanged] = useState(null);
  const unsubsRef = useRef([]);

  // Set up real-time listeners per contestant
  useEffect(() => {
    if (!contestId || !user) { setLoading(false); return; }
    setLoading(true);

    const setup = async () => {
      try {
        const contestantsRef = collection(db, "contests", contestId, "contestants");
        const contestantsSnapshot = await getDocs(contestantsRef);
        const initialScores = {};

        // Clean up any prior listeners
        unsubsRef.current.forEach(fn => fn());
        unsubsRef.current = [];

        contestantsSnapshot.docs.forEach((cDoc) => {
          initialScores[cDoc.id] = {};

          const scoresRef = collection(db, "contests", contestId, "contestants", cDoc.id, "scores");
          const unsub = onSnapshot(scoresRef, (snap) => {
            const contestantScores = {};
            snap.forEach((sDoc) => {
              const data = sDoc.data();
              // Calculate overall from criteria if missing
              if (data.overall === undefined) {
                let total = 0, hasAll = true;
                CRITERIA.forEach(c => {
                  if (data[c.id] !== undefined) total += parseFloat(data[c.id]) * c.weight;
                  else hasAll = false;
                });
                if (hasAll) data.overall = total;
              }
              contestantScores[sDoc.id] = data;
            });

            setAllScores(prev => {
              const next = { ...prev, [cDoc.id]: contestantScores };
              return next;
            });

            // Track which contestant changed for flash animation
            setLastChanged({ contestantId: cDoc.id, timestamp: Date.now() });
            setLoading(false);
          });

          unsubsRef.current.push(unsub);
        });

        // If no contestants, still finish loading
        if (contestantsSnapshot.docs.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error setting up score listeners:", error);
        setLoading(false);
      }
    };

    setup();

    return () => {
      unsubsRef.current.forEach(fn => fn());
      unsubsRef.current = [];
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

import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';

// ── useWrongQuestions ──────────────────────────────────────────────────────────
// Stores wrong question references as { qId, src, cat } per category.
// Uses localStorage for instant reads + Firestore for cross-device persistence.
// Writes are BATCHED — only flushes at session end to stay within free tier.
// ──────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'cm_wrong_qs';

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocal(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

export function useWrongQuestions(user) {
  const [wrongMap, setWrongMap] = useState(() => loadLocal());
  const pendingFlush = useRef({});

  // On login, merge Firestore data into local (Firestore wins for new keys)
  useEffect(() => {
    if (!user || !db) return;
    const userRef = doc(db, 'players', user.uid);
    getDoc(userRef).then(snap => {
      if (!snap.exists()) return;
      const remote = snap.data().wrongQuestions || {};
      const local = loadLocal();
      // Merge: union of all IDs
      const merged = { ...local };
      for (const cat of Object.keys(remote)) {
        merged[cat] = merged[cat] || {};
        for (const [qId, meta] of Object.entries(remote[cat])) {
          if (!merged[cat][qId]) merged[cat][qId] = meta;
        }
      }
      setWrongMap(merged);
      saveLocal(merged);
    }).catch(() => {});
  }, [user]);

  // Add a wrong question reference (called during quiz)
  const addWrong = useCallback((cat, qId, src) => {
    setWrongMap(prev => {
      const updated = {
        ...prev,
        [cat]: { ...(prev[cat] || {}), [qId]: { src } }
      };
      saveLocal(updated);
      // Stage for batch flush
      if (!pendingFlush.current[cat]) pendingFlush.current[cat] = {};
      pendingFlush.current[cat][qId] = { src };
      return updated;
    });
  }, []);

  // Remove a question (user got it right in My Mistakes quiz)
  const removeWrong = useCallback((cat, qId) => {
    setWrongMap(prev => {
      const updated = { ...prev };
      if (updated[cat]) {
        updated[cat] = { ...updated[cat] };
        delete updated[cat][qId];
        if (Object.keys(updated[cat]).length === 0) delete updated[cat];
      }
      saveLocal(updated);
      return updated;
    });
  }, []);

  // Flush pending wrong questions to Firestore (call at session end)
  const flushToFirestore = useCallback(async () => {
    if (!user || !db) return;
    const batch = pendingFlush.current;
    if (Object.keys(batch).length === 0) return;
    pendingFlush.current = {};
    try {
      const userRef = doc(db, 'players', user.uid);
      const updatePayload = {};
      for (const [cat, qs] of Object.entries(batch)) {
        for (const [qId, meta] of Object.entries(qs)) {
          updatePayload[`wrongQuestions.${cat}.${qId}`] = meta;
        }
      }
      await setDoc(userRef, updatePayload, { merge: true });
    } catch (e) {
      console.error('Failed to flush wrong questions:', e);
    }
  }, [user]);

  // Flush removals to Firestore
  const flushRemoval = useCallback(async (cat, qId) => {
    if (!user || !db) return;
    try {
      const userRef = doc(db, 'players', user.uid);
      await setDoc(userRef, {
        [`wrongQuestions.${cat}.${qId}`]: deleteField()
      }, { merge: true });
    } catch {}
  }, [user]);

  // Counts per category
  const counts = {};
  for (const [cat, qs] of Object.entries(wrongMap)) {
    counts[cat] = Object.keys(qs).length;
  }
  const total = Object.values(counts).reduce((s, c) => s + c, 0);

  return { wrongMap, counts, total, addWrong, removeWrong, flushToFirestore, flushRemoval };
}

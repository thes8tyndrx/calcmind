import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ── Season 1 — Official Launch ────────────────────────────────────────────────
// All XP fields use _s1 suffix for a clean leaderboard start.
const S = '_s1';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async (category = 'global') => {
    if (!db) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const playersRef = collection(db, 'players');
      // Fetch top 20 players by specific category XP or global XP
      const field = category === 'global' ? `xp${S}` : `xp_${category}${S}`;
      const q = query(playersRef, orderBy(field, 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      
      const players = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      setLeaderboard(players);
      setError(null);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // xpChange: +1 for correct, -0.25 for wrong, 0 for skip
  const submitScore = async (user, xpChange, category = 'maths', dailyDate = null) => {
    if (!db || !user) return;
    if (xpChange === 0) return; // skip — no Firestore write needed
    
    try {
      const userRef = doc(db, 'players', user.uid);
      const userSnap = await getDoc(userRef);
      
      const globalField = `xp${S}`;
      const catField    = `xp_${category}${S}`;
      const dailyField  = `xp_daily_${category}${S}`;
      const dateField   = `current_daily_${category}_date${S}`;
      const doneField   = `completed_${category}_${dailyDate}${S}`;

      let newXp = xpChange;
      let catXp = xpChange;
      let dailyXp = xpChange;
      let name = user.displayName || 'Anonymous Player';
      let avatar = user.photoURL || '';
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Prevent XP farming on already completed daily quizzes
        if (dailyDate && data[doneField]) return;

        newXp = Math.max(0, (data[globalField] || 0) + xpChange);
        catXp = Math.max(0, (data[catField] || 0) + xpChange);
        name = data.name || name;
        avatar = data.avatar || avatar;
        
        if (dailyDate) {
          if (data[dateField] !== dailyDate) {
            dailyXp = Math.max(0, xpChange > 0 ? xpChange : 0); // Reset for new day, no carry-over penalty
          } else {
            dailyXp = Math.max(0, (data[dailyField] || 0) + xpChange);
          }
        }
      } else {
        newXp = Math.max(0, xpChange > 0 ? xpChange : 0);
        catXp = Math.max(0, xpChange > 0 ? xpChange : 0);
        dailyXp = Math.max(0, xpChange > 0 ? xpChange : 0);
      }
      
      const updateData = {
        name,
        avatar,
        [globalField]: newXp,
        [catField]: catXp,
        lastActive: new Date().toISOString()
      };
      
      if (dailyDate) {
        updateData[dailyField] = dailyXp;
        updateData[dateField] = dailyDate;
      }
      
      await setDoc(userRef, updateData, { merge: true });
      
    } catch (err) {
      console.error("Error submitting score:", err);
    }
  };

  const markDailyCompleted = async (user, category, dailyDate) => {
    if (!db || !user || !dailyDate) return;
    try {
      const userRef = doc(db, 'players', user.uid);
      const doneField = `completed_${category}_${dailyDate}${S}`;
      await setDoc(userRef, { [doneField]: true }, { merge: true });
    } catch (err) {
      console.error("Error marking daily complete:", err);
    }
  };

  return { leaderboard, loading, error, refresh: fetchLeaderboard, submitScore, markDailyCompleted };
}

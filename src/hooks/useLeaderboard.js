import { useState, useCallback } from 'react';
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

      // ── Daily leaderboards: fetch all players ordered by global XP (indexed),
      //    then filter client-side by today's date on the daily date field.
      //    This avoids needing separate composite indexes for each daily category.
      // ── Global / category leaderboards: order by the relevant XP field directly.
      const isDailyCategory = category.startsWith('daily_');
      const orderField = isDailyCategory ? `xp${S}` : (category === 'global' ? `xp${S}` : `xp_${category}${S}`);
      const fetchLimit = isDailyCategory ? 200 : 50; // Fetch more so client-side filter has enough data

      const q = query(playersRef, orderBy(orderField, 'desc'), limit(fetchLimit));
      const querySnapshot = await getDocs(q);
      
      const players = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      setLeaderboard(players);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
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
      // Always prefer the live auth name/avatar over potentially stale stored values
      let name = user.displayName || user.email?.split('@')[0] || 'Anonymous';
      let avatar = user.photoURL || '';
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Prevent XP farming on already completed daily quizzes
        if (dailyDate && data[doneField]) return;

        newXp = Math.max(0, (data[globalField] || 0) + xpChange);
        catXp = Math.max(0, (data[catField] || 0) + xpChange);
        // Use stored custom name if the user saved one via profile, otherwise keep auth name
        if (data.name) name = data.name;
        if (data.avatar) avatar = data.avatar;
        
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
      console.error('Error submitting score:', err);
    }
  };

  const markDailyCompleted = async (user, category, dailyDate) => {
    if (!db || !user || !dailyDate) return;
    try {
      const userRef = doc(db, 'players', user.uid);
      const doneField = `completed_${category}_${dailyDate}${S}`;
      await setDoc(userRef, { [doneField]: true }, { merge: true });
    } catch (err) {
      console.error('Error marking daily complete:', err);
    }
  };

  return { leaderboard, loading, error, refresh: fetchLeaderboard, submitScore, markDailyCompleted };
}

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
      const field = category === 'global' ? 'xp' : `xp_${category}`;
      const q = query(playersRef, orderBy(field, 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      
      const players = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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

  const submitScore = async (user, xpChange, category = 'maths', dailyDate = null) => {
    if (!db || !user) return;
    
    try {
      const userRef = doc(db, 'players', user.uid);
      const userSnap = await getDoc(userRef);
      
      let newXp = xpChange;
      let catXp = xpChange;
      let dailyXp = xpChange;
      let name = user.displayName || 'Anonymous Player';
      let avatar = user.photoURL || '';
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Prevent XP farming on already completed daily quizzes
        if (dailyDate && data[`completed_${category}_${dailyDate}`]) {
          return; 
        }

        newXp = Math.max(0, (data.xp || 0) + xpChange);
        catXp = Math.max(0, (data[`xp_${category}`] || 0) + xpChange);
        name = data.name || name;
        avatar = data.avatar || avatar;
        
        if (dailyDate) {
          if (data[`current_daily_${category}_date`] !== dailyDate) {
            dailyXp = Math.max(0, xpChange); // Reset for new day
          } else {
            dailyXp = Math.max(0, (data[`xp_daily_${category}`] || 0) + xpChange);
          }
        }
      } else {
        newXp = Math.max(0, newXp);
        catXp = Math.max(0, catXp);
        dailyXp = Math.max(0, dailyXp);
      }
      
      const updateData = {
        name,
        avatar,
        xp: newXp,
        [`xp_${category}`]: catXp,
        lastActive: new Date().toISOString()
      };
      
      if (dailyDate) {
        updateData[`xp_daily_${category}`] = dailyXp;
        updateData[`current_daily_${category}_date`] = dailyDate;
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
      await setDoc(userRef, { [`completed_${category}_${dailyDate}`]: true }, { merge: true });
    } catch (err) {
      console.error("Error marking daily complete:", err);
    }
  };

  return { leaderboard, loading, error, refresh: fetchLeaderboard, submitScore, markDailyCompleted };
}

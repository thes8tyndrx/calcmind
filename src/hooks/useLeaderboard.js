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

  const submitScore = async (user, xpChange, category = 'maths') => {
    if (!db || !user) return;
    
    try {
      const userRef = doc(db, 'players', user.uid);
      const userSnap = await getDoc(userRef);
      
      let newXp = xpChange;
      let catXp = xpChange;
      let name = user.displayName || 'Anonymous Player';
      let avatar = user.photoURL || '';
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        newXp = Math.max(0, (data.xp || 0) + xpChange);
        catXp = Math.max(0, (data[`xp_${category}`] || 0) + xpChange);
        name = data.name || name;
        avatar = data.avatar || avatar;
      } else {
        newXp = Math.max(0, newXp);
        catXp = Math.max(0, catXp);
      }
      
      await setDoc(userRef, {
        name,
        avatar,
        xp: newXp,
        [`xp_${category}`]: catXp,
        lastActive: new Date().toISOString()
      }, { merge: true });
      
    } catch (err) {
      console.error("Error submitting score:", err);
    }
  };

  return { leaderboard, loading, error, refresh: fetchLeaderboard, submitScore };
}

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const playersRef = collection(db, 'players');
      // Fetch top 20 players by XP
      const q = query(playersRef, orderBy('xp', 'desc'), limit(20));
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

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const submitScore = async (user, xpGained) => {
    if (!db || !user) return;
    
    try {
      const userRef = doc(db, 'players', user.uid);
      const userSnap = await getDoc(userRef);
      
      let newXp = xpGained;
      let name = user.displayName || 'Anonymous Player';
      let avatar = user.photoURL || '';
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        newXp += data.xp || 0;
        name = data.name || name;
        avatar = data.avatar || avatar;
      }
      
      await setDoc(userRef, {
        name,
        avatar,
        xp: newXp,
        lastActive: new Date().toISOString()
      }, { merge: true });
      
    } catch (err) {
      console.error("Error submitting score:", err);
    }
  };

  return { leaderboard, loading, error, refresh: fetchLeaderboard, submitScore };
}

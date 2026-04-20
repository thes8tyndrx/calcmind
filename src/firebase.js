import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Placeholder configuration - you will need to replace these with actual values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC_gip6-pvIQUUitBOL84AK4bU1qwSC7M4",
  authDomain: "calcmind-4251b.firebaseapp.com",
  projectId: "calcmind-4251b",
  storageBucket: "calcmind-4251b.firebasestorage.app",
  messagingSenderId: "1036255835213",
  appId: "1:1036255835213:web:f95b55a74dafb1e1c61804",
  measurementId: "G-WE5QJ2GVW3"
};

// We wrap initialization in a try-catch so the app doesn't crash if Firebase isn't configured yet
let app, auth, db, googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.warn("Firebase is not configured yet. Set up firebaseConfig in src/firebase.js to enable login & leaderboard.");
}

export { app, auth, db, googleProvider };

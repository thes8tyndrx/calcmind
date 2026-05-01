import { useState, useEffect } from 'react';
import { signInWithPopup, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    // Check if user just returned from a redirect
    getRedirectResult(auth).catch((error) => {
      console.error("Error with redirect result", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (!auth) {
      alert("Firebase is not configured yet. Check src/firebase.js");
      return;
    }
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        // Use popup for better SPA flow and to prevent redirect loops
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("Sign in failed. " + (error.message || "Please ensure Google Play Services are available."));
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const signInWithEmail = async (email, password) => {
    if (!auth) throw new Error("Firebase not configured");
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email, password) => {
    if (!auth) throw new Error("Firebase not configured");
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const sendPhoneOtp = async (phoneNumber) => {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Phone login is currently only supported on the Android App.");
    }
    const result = await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber });
    return result.verificationId;
  };

  const verifyPhoneOtp = async (verificationId, smsCode) => {
    const result = await FirebaseAuthentication.signInWithPhoneNumber({ verificationId, smsCode });
    if (result.credential?.idToken) {
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      await signInWithCredential(auth, credential);
    }
  };

  return { user, signIn, signOut, loading, signInWithEmail, signUpWithEmail, sendPhoneOtp, verifyPhoneOtp };
}

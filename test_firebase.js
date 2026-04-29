import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: "AIzaSyC_gip6-pvIQAUit8OL84AK4bU1qwSC7M4",
  authDomain: "calcmind.mxprime.in",
  projectId: "calcmind-4251b",
  storageBucket: "calcmind-4251b.firebasestorage.app",
  messagingSenderId: "1036255835213",
  appId: "1:1036255835213:web:f95b55a74dafb1e1c61804",
  measurementId: "G-WE5QJ2GVW3"
};
try {
  initializeApp(firebaseConfig);
  console.log("Success");
} catch(e) {
  console.error("ERROR:", e);
}

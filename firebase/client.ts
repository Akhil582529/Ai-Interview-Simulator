// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAIrM_HspwzhmBhJl3qAaBxPXXoujIIagw",
  authDomain: "ai-interview-sims.firebaseapp.com",
  projectId: "ai-interview-sims",
  storageBucket: "ai-interview-sims.firebasestorage.app",
  messagingSenderId: "493862934803",
  appId: "1:493862934803:web:8124f2bc8a629c5b3e22e6",
  measurementId: "G-D72JHF4LKC"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);    
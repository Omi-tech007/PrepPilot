// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR KEYS INSIDE THIS BLOCK ---
const firebaseConfig = {
  apiKey: "AIzaSyBDuxUxmldUoef45N-3mG_hdMauFgMNSq4",
  authDomain: "jee-planner-97951.firebaseapp.com",
  projectId: "jee-planner-97951",
  storageBucket: "jee-planner-97951.firebasestorage.app",
  messagingSenderId: "975684471638",
  appId: "1:975684471638:web:9a2f031d261b0f784024f7",
  measurementId: "G-Q1840GE3PW"
};

// --- THIS IS THE PART THAT WAS MISSING ---
const app = initializeApp(firebaseConfig);

// We need to 'export' these so App.js can use them:
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the values below with your NEW Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyC310A6fhBb04sOmUjV_vFoZsOxDpUhc7E",
  authDomain: "preppilotapp.firebaseapp.com",
  projectId: "preppilotapp",
  storageBucket: "preppilotapp.firebasestorage.app",
  messagingSenderId: "391244178642",
  appId: "1:391244178642:web:948b4e19b3b8b5a292f90b",
  measurementId: "G-NHW7F78504"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORT these so App.jsx can use them
export const auth = getAuth(app); 
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
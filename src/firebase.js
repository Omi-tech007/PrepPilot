// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDuxUxmldUoef45N-3mG_hdMauFgMNSq4",
  authDomain: "jee-planner-97951.firebaseapp.com",
  projectId: "jee-planner-97951",
  storageBucket: "jee-planner-97951.firebasestorage.app",
  messagingSenderId: "975684471638",
  appId: "1:975684471638:web:9a2f031d261b0f784024f7",
  measurementId: "G-Q1840GE3PW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
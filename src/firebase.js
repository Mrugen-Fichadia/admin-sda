// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔑 Replace with your Firebase web config:
const firebaseConfig = {
  apiKey: "AIzaSyAP_SGZ-8uxOg-oktRAIEj0Jp2p9d8IvNE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "smart-distribution-app",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "654105791492",
  appId: "1:654105791492:android:6e6f031557c6f1953bf951"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

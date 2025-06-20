import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCyaRoIa9bNBLnjy_L6QMzLehI2EDr6zwg',
  authDomain: 'smart-distribution-app.firebaseapp.com',
  projectId: 'smart-distribution-app',
  storageBucket: 'smart-distribution-app.firebasestorage.app',
  messagingSenderId: '654105791492',
  appId: '1:654105791492:web:4207beffb6a668313bf951',
  measurementId: 'G-03TYPV7RCX',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDtHfMmHA5_AiDHvFw4zIUIT6HDSlnyXo",
  authDomain: "splito-b7785.firebaseapp.com",
  projectId: "splito-b7785",
  storageBucket: "splito-b7785.firebasestorage.app",
  messagingSenderId: "203730765332",
  appId: "1:203730765332:web:68302a833abe1526234901",
  measurementId: "G-NL9KQBT4V8"
};

// Check if we are using the dummy config
export const isMock = firebaseConfig.apiKey === "AIzaSyDummyKeyForNow";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

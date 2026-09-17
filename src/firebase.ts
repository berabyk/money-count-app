import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForNow",
  authDomain: "dummy-app.firebaseapp.com",
  projectId: "dummy-app",
  storageBucket: "dummy-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:dummy"
};

// Check if we are using the dummy config
export const isMock = firebaseConfig.apiKey === "AIzaSyDummyKeyForNow";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

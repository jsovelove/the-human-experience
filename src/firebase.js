import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCpyux-wUEIp0JigJLjQFtkpBRFe2AtTks",
  authDomain: "the-human-experience-b75b0.firebaseapp.com",
  projectId: "the-human-experience-b75b0",
  storageBucket: "the-human-experience-b75b0.firebasestorage.app",
  messagingSenderId: "159533841573",
  appId: "1:159533841573:web:cb715d5db0ddc79cdc614c",
  measurementId: "G-XC2H09PWNJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);


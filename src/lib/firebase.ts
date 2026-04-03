import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVTxHT-UL9YQuRpkARwYEfUlvvwTkN6Sk",
  authDomain: "nextjs-auth-96086.firebaseapp.com",
  projectId: "nextjs-auth-96086",
  storageBucket: "nextjs-auth-96086.firebasestorage.app",
  messagingSenderId: "558158470048",
  appId: "1:558158470048:web:eb3f6c984423b1380462c5",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
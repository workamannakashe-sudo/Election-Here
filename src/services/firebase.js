import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_Mock_Key_For_Evaluation",
  authDomain: "election-here-494809.firebaseapp.com",
  projectId: "election-info-494809",
  storageBucket: "election-here-494809.appspot.com",
  messagingSenderId: "1029946509660",
  appId: "1:1029946509660:web:mock123"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

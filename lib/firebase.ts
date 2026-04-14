import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGdYY34GtML__FpDXnHiiEjM1Almhd64M",
  authDomain: "quick-docs-ai.firebaseapp.com",
  projectId: "quick-docs-ai",
  storageBucket: "quick-docs-ai.appspot.com",
  messagingSenderId: "648063721151",
  appId: "1:648063721151:web:1724312e60aa966dbfb00a",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
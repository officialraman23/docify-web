import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBS1rY_dIKZieCZkGw19u8EJV2fAh9tsMo", // ✅ NEW KEY
  authDomain: "quick-docs-ai.firebaseapp.com",
  projectId: "quick-docs-ai",
  storageBucket: "quick-docs-ai.firebasestorage.app",
  messagingSenderId: "648063721151",
  appId: "1:648063721151:web:1724312e60aa966dbfb00a",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

appleProvider.addScope("email");
appleProvider.addScope("name");
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  addDoc,
  deleteDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCR2fz65ziwSu3T4dfPQFni1YoVgdGduac",
  authDomain: "dtm-ga-tayyorgarlik.firebaseapp.com",
  databaseURL: "https://dtm-ga-tayyorgarlik-default-rtdb.firebaseio.com",
  projectId: "dtm-ga-tayyorgarlik",
  storageBucket: "dtm-ga-tayyorgarlik.firebasestorage.app",
  messagingSenderId: "428366313635",
  appId: "1:428366313635:web:68fccf9a00a9e31974a716",
  measurementId: "G-HFLMP30E6D"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  addDoc,
  deleteDoc
};
export type { FirebaseUser };

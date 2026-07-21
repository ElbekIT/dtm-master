import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  runTransaction,
  writeBatch
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

// Explicit user-provided Firebase configuration
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

// Initialize Firebase client
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auto-retry wrapper helper to guarantee flawless operation under transient network errors
export async function runWithRetry<T>(fn: () => Promise<T>, maxRetries = 5, delayMs = 1500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      console.warn(`[Firebase Retry] Attempt ${attempt} failed. Error:`, error);
      if (attempt >= maxRetries) {
        throw error;
      }
      // Wait before next attempt (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(1.5, attempt - 1)));
    }
  }
}

/**
 * Check if username is already taken.
 */
export async function checkUsernameUnique(username: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  return runWithRetry(async () => {
    const docRef = doc(db, "usernames", normalized);
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
  });
}

/**
 * Reserves a username in a transactional transaction to prevent race conditions.
 */
export async function reserveUsername(uid: string, username: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  return runWithRetry(async () => {
    try {
      await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, "usernames", normalized);
        const usernameSnap = await transaction.get(usernameRef);
        if (usernameSnap.exists()) {
          throw new Error("Username is already taken");
        }
        transaction.set(usernameRef, { uid });
      });
      return true;
    } catch (e) {
      console.error("Failed to reserve username transactionally:", e);
      return false;
    }
  });
}

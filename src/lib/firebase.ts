/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc as firebaseGetDoc, 
  setDoc as firebaseSetDoc, 
  addDoc as firebaseAddDoc, 
  getDocs as firebaseGetDocs, 
  deleteDoc as firebaseDeleteDoc,
  collection, 
  query, 
  where, 
  limit, 
  orderBy 
} from "firebase/firestore";

// Real client-side Firebase configuration supplied by the user
export const firebaseConfig = {
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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Operations for handleFirestoreError
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
    },
    operationType,
    path
  };
  console.error('Firestore Security/Execution Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------- LOCAL STORAGE FALLBACK ENGINE ---------------- //
const LOCAL_STORAGE_PREFIX = "dtm_master_local_";

export function getLocalData<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

export function setLocalData(key: string, value: any): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage save failed", e);
  }
}

// Helper to promise-timeout a Firestore operation to prevent infinite loading screen
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Operation timed out"));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// High Quality pre-seeded contestants for Leaderboard to keep app looking alive Offline/Bypassed
export const initialLeaderboardSeed: any[] = [];

// Seed collections set to empty so only real Firebase Database data is shown
export const initialUsersSeed: any[] = [];
export const initialPurchasesSeed: any[] = [];

// Safe Firestore wrappers that fallback instantly on timeout or failure
export async function getDoc(docRef: any): Promise<any> {
  const path = docRef.path;
  try {
    const docSnap = await withTimeout(firebaseGetDoc(docRef), 10000);
    if (docSnap.exists()) {
      setLocalData(path, docSnap.data());
    }
    return docSnap;
  } catch (err) {
    console.warn(`Firestore getDoc timed out/failed for ${path}. Using localStorage.`, err);
    const local = getLocalData<any>(path);
    return {
      exists: () => !!local,
      data: () => local,
      id: docRef.id
    };
  }
}

export async function setDoc(docRef: any, data: any, options?: any): Promise<void> {
  const path = docRef.path;
  const existingLocal = getLocalData<any>(path) || {};
  const merged = options?.merge ? { ...existingLocal, ...data } : data;
  setLocalData(path, merged);

  // Sync cache list in local storage for parent collection
  const lastSlashIndex = path.lastIndexOf("/");
  if (lastSlashIndex > 0) {
    const colPath = path.substring(0, lastSlashIndex);
    const colListKey = `col_list_${colPath}`;
    const currentList = getLocalData<any[]>(colListKey) || [];
    const docId = path.substring(lastSlashIndex + 1);
    
    const existingIndex = currentList.findIndex(item => item.id === docId || item.uid === docId || (item && item.uid && item.uid === docId));
    if (existingIndex > -1) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...merged, id: docId, uid: docId };
    } else {
      currentList.push({ ...merged, id: docId, uid: docId });
    }
    setLocalData(colListKey, currentList);
  }

  try {
    await withTimeout(firebaseSetDoc(docRef, data, options), 10000);
  } catch (err) {
    console.warn(`Firestore setDoc timed out/failed for ${path}. Saved locally.`, err);
  }
}

export async function addDoc(colRef: any, data: any): Promise<any> {
  const colPath = colRef.path;
  const docId = `local_doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `${colPath}/${docId}`;
  setLocalData(path, data);

  const colListKey = `col_list_${colPath}`;
  const currentList = getLocalData<any[]>(colListKey) || [];
  currentList.push({ id: docId, ...data });
  setLocalData(colListKey, currentList);

  try {
    return await withTimeout(firebaseAddDoc(colRef, data), 10000);
  } catch (err) {
    console.warn(`Firestore addDoc timed out/failed for ${colPath}. Saved locally.`, err);
    return {
      id: docId,
      path: path
    };
  }
}

export async function getDocs(queryOrCol: any): Promise<any> {
  let colPath = "unknown";
  if (queryOrCol.path) {
    colPath = queryOrCol.path;
  } else if (queryOrCol._query && queryOrCol._query.path) {
    colPath = queryOrCol._query.path.segments.join("/");
  } else if (queryOrCol.query && queryOrCol.query.path) {
    colPath = queryOrCol.query.path.segments.join("/");
  } else {
    try {
      const strRepresentation = JSON.stringify(queryOrCol) || "";
      if (strRepresentation.includes("leaderboard")) colPath = "leaderboard";
      else if (strRepresentation.includes("users")) colPath = "users";
      else if (strRepresentation.includes("results")) colPath = "results";
      else if (strRepresentation.includes("purchases")) colPath = "purchases";
    } catch (e) {}
  }

  try {
    const querySnapshot = await withTimeout(firebaseGetDocs(queryOrCol), 10000);
    const list: any[] = [];
    querySnapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...(doc.data() as any) });
    });
    
    if (colPath !== "unknown") {
      setLocalData(`col_list_${colPath}`, list);
    }
    return querySnapshot;
  } catch (err) {
    console.warn(`Firestore getDocs timed out/failed for query path ${colPath}. Using localStorage.`, err);
    let cachedList = getLocalData<any[]>(`col_list_${colPath}`) || [];
    
    if (colPath === "leaderboard" && cachedList.length === 0) {
      cachedList = initialLeaderboardSeed;
      setLocalData(`col_list_leaderboard`, cachedList);
    }

    if (colPath === "users" && cachedList.length === 0) {
      cachedList = initialUsersSeed;
      setLocalData(`col_list_users`, cachedList);
    }

    if (colPath === "purchases" && cachedList.length === 0) {
      cachedList = initialPurchasesSeed;
      setLocalData(`col_list_purchases`, cachedList);
    }

    let filteredList = cachedList;
    if (colPath === "results" && auth.currentUser) {
      filteredList = cachedList.filter(item => item.uid === auth.currentUser?.uid);
    }

    if (colPath === "leaderboard") {
      filteredList.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return {
      forEach: (callback: (doc: any) => void) => {
        filteredList.forEach((item: any) => {
          const { id, ...data } = (item || {}) as any;
          callback({
            id: id || "mock_id",
            data: () => data
          });
        });
      },
      empty: filteredList.length === 0,
      size: filteredList.length,
      docs: filteredList.map((item: any) => {
        const { id, ...data } = (item || {}) as any;
        return {
          id: id || "mock_id",
          data: () => data
        };
      })
    };
  }
}

export async function deleteDoc(docRef: any): Promise<void> {
  const path = docRef.path;
  const colPath = path.substring(0, path.lastIndexOf("/"));
  const docId = docRef.id;

  localStorage.removeItem(LOCAL_STORAGE_PREFIX + path);
  const colListKey = `col_list_${colPath}`;
  const currentList = getLocalData<any[]>(colListKey) || [];
  const updatedList = currentList.filter(item => item.id !== docId);
  setLocalData(colListKey, updatedList);

  try {
    await withTimeout(firebaseDeleteDoc(docRef), 10000);
  } catch (err) {
    console.warn(`Firestore deleteDoc timed out/failed for ${path}. Removed locally.`, err);
  }
}

// Check Connection helper
export async function testConnection() {
  try {
    const testDocRef = doc(db, 'system_test', 'connection');
    await withTimeout(firebaseGetDoc(testDocRef), 5000);
    console.log("Firebase Connection verified successfully.");
  } catch (error) {
    console.warn("Please check your Firebase configuration or network connection. Operating in Offline Resilient Mode.");
  }
}

testConnection();

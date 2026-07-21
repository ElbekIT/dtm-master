/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

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

// Check Connection helper as required by the Firebase integration guide
export async function testConnection() {
  try {
    const testDocRef = doc(db, 'system_test', 'connection');
    await getDoc(testDocRef);
    console.log("Firebase Connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network connection.");
    }
  }
}

testConnection();

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId =
  firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
    ? firebaseConfigJson.firestoreDatabaseId
    : undefined;

// Initialize Firestore with auto-detect long polling to ensure resilient connectivity across iframes and networks
let dbInstance;
try {
  dbInstance = initializeFirestore(
    firebaseApp,
    {
      experimentalAutoDetectLongPolling: true,
    },
    dbId
  );
} catch {
  dbInstance = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
}

export const firestoreDb = dbInstance;

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestoreDb, '_test_connection', 'ping'));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        error.message.includes('unavailable') ||
        error.message.includes('Could not reach Cloud Firestore backend'))
    ) {
      console.warn('Firebase Firestore client is offline or connecting in background.');
      return false;
    }
    return true;
  }
}

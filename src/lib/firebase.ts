import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const isCustomProject = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "bellini-odontalgia";

const firebaseConfig = {
  apiKey: "AIzaSyBAxuLU6Qq1o213lqBOKuwMt7dzK2eNb9Y",
  authDomain: "bellinidatabase.firebaseapp.com",
  projectId: "bellinidatabase",
  storageBucket: "bellinidatabase.firebasestorage.app",
  messagingSenderId: "962539251643",
  appId: "1:962539251643:web:d72407d0c5b4f2a0e2469e",
  measurementId: "G-E8Y822V0PM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard and customized configurations for authentication pop-ups
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth Helpers
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error in Google Sign In:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Error Handling exactly as instructed in SKILL.md
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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection is tested dynamically on demand, no immediate forced startup check is needed


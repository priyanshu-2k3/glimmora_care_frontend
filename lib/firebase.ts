import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase must only initialize in the browser — never during SSR/build
let app: FirebaseApp | null = null
let auth: Auth | null = null
const googleProvider = new GoogleAuthProvider()

function getFirebase(): { app: FirebaseApp; auth: Auth } {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be used in the browser.')
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
  }
  return { app, auth: auth! }
}

export async function signInWithGoogle() {
  const { auth: a } = getFirebase()
  const result = await signInWithPopup(a, googleProvider)
  return result.user
}

export async function signOutFromFirebase() {
  const { auth: a } = getFirebase()
  await firebaseSignOut(a)
}

export function getFirebaseAuth(): Auth {
  return getFirebase().auth
}

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth'

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
let googleProvider: GoogleAuthProvider | null = null

function getFirebase(): { app: FirebaseApp; auth: Auth } {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be used in the browser.')
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
  }
  return { app, auth: auth! }
}

export async function signInWithGoogle() {
  const { auth: a } = getFirebase()
  const result = await signInWithPopup(a, googleProvider!)
  return result.user
}

export async function signOutFromFirebase() {
  const { auth: a } = getFirebase()
  await firebaseSignOut(a)
}

export function getFirebaseAuth(): Auth {
  return getFirebase().auth
}

// ── Phone Auth ────────────────────────────────────────────────────────────────

let recaptchaVerifier: RecaptchaVerifier | null = null

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  const { auth: a } = getFirebase()
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }
  recaptchaVerifier = new RecaptchaVerifier(a, containerId, { size: 'invisible' })
  return recaptchaVerifier
}

export async function sendPhoneOtp(phone: string, containerId = 'recaptcha-container'): Promise<ConfirmationResult> {
  const { auth: a } = getFirebase()
  const verifier = setupRecaptcha(containerId)
  return signInWithPhoneNumber(a, phone, verifier)
}

export async function verifyPhoneOtp(confirmationResult: ConfirmationResult, otp: string): Promise<string> {
  const credential = await confirmationResult.confirm(otp)
  return credential.user.getIdToken()
}

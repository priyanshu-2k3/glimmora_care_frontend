"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let googleProvider: GoogleAuthProvider | null = null

function getFirebase(): { app: FirebaseApp; auth: Auth } {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be used in the browser.")
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
  }
  return { app, auth: auth! }
}

export function getFirebaseAuth(): Auth {
  return getFirebase().auth
}

// ─── Google sign-in via redirect ─────────────────────────────────────────────
// Redirect flow (vs popup) works reliably on production hosts where popups
// are blocked, on mobile Safari, and behind COOP/COEP headers.

export type GoogleAuthIntent = "login" | "connect"
const INTENT_KEY = "glimmora_google_intent"

export function startGoogleSignIn(intent: GoogleAuthIntent = "login"): Promise<void> {
  const { auth: a } = getFirebase()
  try {
    sessionStorage.setItem(INTENT_KEY, intent)
  } catch {
    // ignore — sessionStorage may be unavailable
  }
  return signInWithRedirect(a, googleProvider!)
}

export interface GoogleRedirectPayload {
  intent: GoogleAuthIntent
  idToken: string
  email: string | null
  name: string | null
  picture: string | null
}

/** Call once on app mount. Returns the redirect result if we just came back from Google, else null. */
export async function consumeGoogleRedirect(): Promise<GoogleRedirectPayload | null> {
  const { auth: a } = getFirebase()
  const result = await getRedirectResult(a)
  if (!result?.user) return null

  let intent: GoogleAuthIntent = "login"
  try {
    const stored = sessionStorage.getItem(INTENT_KEY)
    if (stored === "connect" || stored === "login") intent = stored
    sessionStorage.removeItem(INTENT_KEY)
  } catch {
    // ignore
  }

  const idToken = await result.user.getIdToken()
  return {
    intent,
    idToken,
    email: result.user.email,
    name: result.user.displayName,
    picture: result.user.photoURL,
  }
}

export async function signOutFromFirebase() {
  const { auth: a } = getFirebase()
  await firebaseSignOut(a)
}

// ─── Phone Auth ──────────────────────────────────────────────────────────────

let recaptchaVerifier: RecaptchaVerifier | null = null

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  const { auth: a } = getFirebase()
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }
  recaptchaVerifier = new RecaptchaVerifier(a, containerId, { size: "invisible" })
  return recaptchaVerifier
}

export async function sendPhoneOtp(
  phone: string,
  containerId = "recaptcha-container"
): Promise<ConfirmationResult> {
  const { auth: a } = getFirebase()
  const verifier = setupRecaptcha(containerId)
  return signInWithPhoneNumber(a, phone, verifier)
}

export async function verifyPhoneOtp(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<string> {
  const credential = await confirmationResult.confirm(otp)
  return credential.user.getIdToken()
}

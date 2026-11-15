import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase'

// Staff = anyone who may use the Admin portal
export const isStaffRole = (role) => role === 'admin' || role === 'owner'

export async function registerUser({ fullName, email, phone, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
  await setDoc(doc(db, 'users', cred.user.uid), {
    fullName,
    email: cleanEmail,
    phone,
    address: '',
    role: 'customer', // every website sign-up is a customer
    createdAt: serverTimestamp(),
  })
  return cred.user
}

// remember = true keeps you signed in after closing the browser
export async function loginUser(email, password, remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
  const profile = await getUserProfile(cred.user.uid)
  return { user: cred.user, profile }
}

export const logoutUser = () => signOut(auth)

export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim())

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function updateUserProfile(uid, { fullName, phone, address }) {
  return updateDoc(doc(db, 'users', uid), { fullName, phone, address })
}

// ---- One-time owner setup ----

export async function isSetupDone() {
  const snap = await getDoc(doc(db, 'config', 'setup'))
  return snap.exists()
}

// Creates the owner's login, their profile with role 'owner', and the lock document, together.
// The security rules (Step 10) only allow this while the lock document does not exist.
export async function setupOwner({ fullName, email, phone, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
  try {
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', cred.user.uid), {
      fullName,
      email: cleanEmail,
      phone,
      address: '',
      role: 'owner',
      createdAt: serverTimestamp(),
    })
    batch.set(doc(db, 'config', 'setup'), { ownerId: cred.user.uid, completedAt: serverTimestamp() })
    await batch.commit()
  } catch (err) {
    await cred.user.delete() // setup was refused, so remove the login we just made
    throw err
  }
}

const MESSAGES = {
  'auth/email-already-in-use': 'That email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'No account uses that email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/network-request-failed': 'No internet connection. Please try again.',
  'permission-denied': 'You do not have permission to do that.',
}

export const authErrorMessage = (err) => MESSAGES[err?.code] || 'Something went wrong. Please try again.'

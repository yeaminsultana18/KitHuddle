import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

// Create the login account, then save the user's details in Firestore
export async function registerUser({ fullName, email, phone, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await setDoc(doc(db, 'users', cred.user.uid), {
    fullName,
    email,
    phone,
    address: '',
    role: 'customer',
    createdAt: serverTimestamp(),
  })
  return cred.user
}

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const logoutUser = () => signOut(auth)

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function updateUserProfile(uid, { fullName, phone, address }) {
  return updateDoc(doc(db, 'users', uid), { fullName, phone, address })
}

// Turn Firebase error codes into readable messages
const MESSAGES = {
  'auth/email-already-in-use': 'That email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/network-request-failed': 'No internet connection. Please try again.',
}

export const authErrorMessage = (err) =>
  MESSAGES[err.code] || 'Something went wrong. Please try again.'
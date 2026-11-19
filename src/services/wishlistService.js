import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getProduct } from './productService'

// Each saved product is one document: users/{uid}/wishlist/{productId}
const wishRef = (uid, productId) => doc(db, 'users', uid, 'wishlist', productId)

export async function isInWishlist(uid, productId) {
  const snap = await getDoc(wishRef(uid, productId))
  return snap.exists()
}

export const addToWishlist = (uid, productId) => setDoc(wishRef(uid, productId), { addedAt: serverTimestamp() })

export const removeFromWishlist = (uid, productId) => deleteDoc(wishRef(uid, productId))

// The saved products, newest first (products that were deleted are skipped)
export async function getWishlist(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'wishlist'))
  const saved = snap.docs.map((d) => ({ id: d.id, addedAt: d.data().addedAt?.seconds || 0 }))
  saved.sort((a, b) => b.addedAt - a.addedAt)
  const products = await Promise.all(saved.map((s) => getProduct(s.id)))
  return products.filter(Boolean)
}

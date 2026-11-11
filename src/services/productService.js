import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

// All products, sorted by name
export async function getProducts() {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// One product by its ID, or null if it doesn't exist
export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// All categories, sorted by name
export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Show prices as "৳850"
export const formatPrice = (amount) => `৳${Number(amount).toLocaleString('en-BD')}`
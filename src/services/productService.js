import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

export async function getProducts() {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// The price the customer pays, after any sale
export const salePrice = (product) =>
  product.salePercent > 0
    ? Math.round(product.price * (1 - product.salePercent / 100))
    : product.price

export const formatPrice = (amount) => `৳${Number(amount).toLocaleString('en-BD')}`

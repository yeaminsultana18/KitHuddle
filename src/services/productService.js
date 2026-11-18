import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
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

// ---- Module 3: admins manage products ----

// A grey placeholder picture when the admin gives no image link
export const placeholderImage = (name) => `https://placehold.co/600x800?text=${encodeURIComponent(name)}`

// Adds a new product and returns its new id
export async function addProduct(data) {
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    tryOnImageUrl: '', // used in Module 7
    tryOnPrompt: '',
  })
  return ref.id
}

// Changes only the fields given, so tryOnImageUrl and tryOnPrompt stay as they are
export const updateProduct = (id, data) => updateDoc(doc(db, 'products', id), data)

export const deleteProduct = (id) => deleteDoc(doc(db, 'products', id))

// ---- Module 3: admins manage categories ----

// "Table Tennis" -> "table-tennis" (used in the link /category/table-tennis)
export const makeCategoryId = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export async function addCategory(name) {
  const id = makeCategoryId(name)
  if (!id) throw new Error('Please enter a category name.')
  const ref = doc(db, 'categories', id)
  const existing = await getDoc(ref)
  if (existing.exists()) throw new Error('That category already exists.')
  await setDoc(ref, { name: name.trim() })
  return id
}

// The id (and so the link) stays the same; only the name shown changes
export const renameCategory = (id, name) => updateDoc(doc(db, 'categories', id), { name: name.trim() })

export const deleteCategory = (id) => deleteDoc(doc(db, 'categories', id))

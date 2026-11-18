import { collection, doc, getCountFromServer, getDocs, limit, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'

export async function getDashboardCounts() {
  const [products, outOfStock, categories, customers, orders, pendingOrders] = await Promise.all([
    getCountFromServer(collection(db, 'products')),
    getCountFromServer(query(collection(db, 'products'), where('stock', '<=', 0))),
    getCountFromServer(collection(db, 'categories')),
    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'customer'))),
    getCountFromServer(collection(db, 'orders')),
    getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'confirmed'))),
  ])
  return {
    products: products.data().count,
    outOfStock: outOfStock.data().count,
    categories: categories.data().count,
    customers: customers.data().count,
    orders: orders.data().count,
    pendingOrders: pendingOrders.data().count,
  }
}

// Everyone who can use the Admin portal
export async function getStaff() {
  const snap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['owner', 'admin'])))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Finds a registered account by email (checks the email as typed and in lower case)
export async function findUserByEmail(email) {
  const typed = email.trim()
  const options = [...new Set([typed, typed.toLowerCase()])]
  const snap = await getDocs(query(collection(db, 'users'), where('email', 'in', options), limit(1)))
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// Only the owner may do this; the security rules check it again on the server
export const setUserRole = (uid, role) => updateDoc(doc(db, 'users', uid), { role })

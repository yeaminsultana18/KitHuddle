import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { formatPrice, salePrice } from './productService'
import { ADMIN_INBOX, newNotification } from './notificationService'

// The order goes through these steps. Delivered and Cancelled are final.
export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// Tailwind colours for the status badge
export const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-violet-100 text-violet-800',
  shipped: 'bg-brand-100 text-brand-700',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-200 text-slate-700',
}

export const isFinalStatus = (status) => status === 'delivered' || status === 'cancelled'

// A short code to show people, e.g. "KH-4F2A9C"
export const orderCode = (id) => `KH-${id.slice(0, 6).toUpperCase()}`

// Places a cash-on-delivery order.
// Everything happens in one transaction: the stock is checked again, the stock goes down,
// the order is saved and the admins get a notification. If anything fails, nothing is saved.
export async function placeOrder({ userId, customer, cartItems }) {
  // How many of each product the cart needs (two sizes of one product count together)
  const needed = {}
  cartItems.forEach((item) => {
    needed[item.productId] = (needed[item.productId] || 0) + item.quantity
  })
  const productIds = Object.keys(needed)

  const orderRef = doc(collection(db, 'orders'))
  const noteRef = doc(collection(db, 'notifications'))
  const customerNoteRef = doc(collection(db, 'notifications'))

  await runTransaction(db, async (tx) => {
    // 1. Read every product first (a transaction must do all reads before any write)
    const snaps = await Promise.all(productIds.map((id) => tx.get(doc(db, 'products', id))))

    // 2. Check each one still exists and has enough stock, and take today's price
    const prices = {}
    snaps.forEach((snap) => {
      if (!snap.exists()) {
        throw new Error('A product in your cart is no longer sold. Please remove it from your cart.')
      }
      const product = snap.data()
      if (product.stock < needed[snap.id]) {
        throw new Error(
          product.stock <= 0
            ? `${product.name} is now out of stock. Please remove it from your cart.`
            : `Only ${product.stock} left of ${product.name}. Please lower the quantity.`,
        )
      }
      prices[snap.id] = salePrice(product)
    })

    // 3. Build the order lines with the price from the database, not from the browser
    const items = cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: prices[item.productId],
      imageUrl: item.imageUrl || '',
    }))
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

    // 4. Lower the stock
    snaps.forEach((snap) => {
      tx.update(snap.ref, { stock: snap.data().stock - needed[snap.id] })
    })

    // 5. Save the order
    tx.set(orderRef, {
      userId,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      note: customer.note || '',
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      total,
      paymentMethod: 'cash_on_delivery',
      status: 'confirmed', // confirmed straight away; admins move it to shipped / delivered
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // 6. Tell the admins
    tx.set(
      noteRef,
      newNotification(
        ADMIN_INBOX,
        'New order',
        `${customer.name} placed order ${orderCode(orderRef.id)} for ${formatPrice(total)}.`,
        '/admin/orders',
      ),
    )

    // 7. Tell the customer it is confirmed
    tx.set(
      customerNoteRef,
      newNotification(
        userId,
        'Order confirmed',
        `Your order ${orderCode(orderRef.id)} for ${formatPrice(total)} is confirmed. We will call you before delivery.`,
        '/orders',
      ),
    )
  })

  return orderRef.id
}

// The signed-in customer's orders, newest first
export async function getMyOrders(userId) {
  const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId)))
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Sorted here instead of in the query, so Firestore needs no extra index
  list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  return list
}

// Every order, newest first (admins only)
export async function getAllOrders() {
  const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// What the customer is told when an admin changes the status
const CUSTOMER_MESSAGES = {
  confirmed: 'is confirmed. We will call you before delivery.',
  shipped: 'is on its way.',
  delivered: 'has been delivered. Thank you for shopping with KitHuddle!',
  cancelled: 'was cancelled. Contact us if you have a question.',
}

// Admin changes an order's status and the customer gets a notification.
// Cancelling also puts the items back in stock.
export async function updateOrderStatus(order, newStatus) {
  const orderRef = doc(db, 'orders', order.id)
  const noteRef = doc(collection(db, 'notifications'))
  const note =
    newStatus === 'pending'
      ? null
      : newNotification(
          order.userId,
          `Order ${STATUS_LABELS[newStatus].toLowerCase()}`,
          `Your order ${orderCode(order.id)} ${CUSTOMER_MESSAGES[newStatus]}`,
          '/orders',
        )

  if (newStatus !== 'cancelled') {
    const batch = writeBatch(db)
    batch.update(orderRef, { status: newStatus, updatedAt: serverTimestamp() })
    if (note) batch.set(noteRef, note)
    await batch.commit()
    return
  }

  // Cancelling: return the stock in the same transaction
  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists()) throw new Error('This order no longer exists.')
    if (orderSnap.data().status === 'cancelled') throw new Error('This order is already cancelled.')

    // How many of each product to put back
    const back = {}
    orderSnap.data().items.forEach((item) => {
      back[item.productId] = (back[item.productId] || 0) + item.quantity
    })
    const productIds = Object.keys(back)
    const snaps = await Promise.all(productIds.map((id) => tx.get(doc(db, 'products', id))))

    snaps.forEach((snap) => {
      if (snap.exists()) tx.update(snap.ref, { stock: snap.data().stock + back[snap.id] })
    })
    tx.update(orderRef, { status: 'cancelled', updatedAt: serverTimestamp() })
    tx.set(noteRef, note)
  })
}

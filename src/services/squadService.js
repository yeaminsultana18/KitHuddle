import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
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
import { orderCode } from './orderService'

// Squad discount: more members, bigger discount
export function squadDiscount(memberCount) {
  if (memberCount >= 15) return 15
  if (memberCount >= 10) return 10
  if (memberCount >= 5) return 5
  return 0
}

// How many more members are needed for the next discount (null when at the top)
export function nextDiscountStep(memberCount) {
  if (memberCount < 5) return { members: 5, percent: 5 }
  if (memberCount < 10) return { members: 10, percent: 10 }
  if (memberCount < 15) return { members: 15, percent: 15 }
  return null
}

// 6 letters/numbers that are easy to read (no 0/O or 1/I)
function makeJoinCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += letters[Math.floor(Math.random() * letters.length)]
  return code
}

// Whole days until the deadline (0 when it has passed)
export const daysLeft = (squad) =>
  Math.max(0, Math.ceil((squad.deadline.toMillis() - Date.now()) / (24 * 60 * 60 * 1000)))

export const isSquadOpen = (squad) =>
  squad.status === 'open' && squad.deadline?.toMillis && squad.deadline.toMillis() > Date.now()

// Captain creates a squad. deadlineDate is "2026-11-30" from a date input.
export async function createSquad({ captain, teamName, product, deadlineDate }) {
  const deadline = Timestamp.fromDate(new Date(`${deadlineDate}T23:59:59`))
  const ref = await addDoc(collection(db, 'squads'), {
    name: teamName.trim(),
    joinCode: makeJoinCode(),
    productId: product.id,
    productName: product.name,
    unitPrice: salePrice(product), // the price per kit when the squad was made
    imageUrl: product.imageUrls?.[0] || '',
    sizes: product.sizes || [],
    captainId: captain.uid,
    captainName: captain.name,
    deadline,
    status: 'open', // open -> ordered
    orderId: '',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getSquad(id) {
  const snap = await getDoc(doc(db, 'squads', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function findSquadByCode(code) {
  const clean = code.trim().toUpperCase()
  const snap = await getDocs(query(collection(db, 'squads'), where('joinCode', '==', clean), limit(1)))
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// Squads this user is the captain of, newest first
export async function getMySquads(uid) {
  const snap = await getDocs(query(collection(db, 'squads'), where('captainId', '==', uid)))
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  return list
}

// Every squad, newest first (admins only)
export async function getAllSquads() {
  const snap = await getDocs(query(collection(db, 'squads'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Live list of members. Each member's document id is their jersey number,
// so two people can never take the same number.
export function listenToMembers(squadId, onChange) {
  return onSnapshot(
    collection(db, 'squads', squadId, 'members'),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => Number(a.jerseyNumber) - Number(b.jerseyNumber))
      onChange(list)
    },
    () => onChange([]),
  )
}

export async function getMembers(squadId) {
  const snap = await getDocs(collection(db, 'squads', squadId, 'members'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Phone numbers are kept apart so only the captain and admins can read them
export async function getMemberPhones(squadId) {
  const snap = await getDocs(collection(db, 'squads', squadId, 'contacts'))
  const phones = {}
  snap.docs.forEach((d) => (phones[d.id] = d.data().phone))
  return phones
}

// Anyone with the code joins - no account needed
export async function joinSquad(squadId, { name, phone, size, jerseyName, jerseyNumber }) {
  const number = String(Number(jerseyNumber))
  const memberRef = doc(db, 'squads', squadId, 'members', number)
  const contactRef = doc(db, 'squads', squadId, 'contacts', number)

  const taken = await getDoc(memberRef)
  if (taken.exists()) throw new Error(`Number ${number} is already taken in this squad. Pick another number.`)

  const batch = writeBatch(db)
  batch.set(memberRef, {
    name: name.trim(),
    size,
    jerseyName: jerseyName.trim().toUpperCase(),
    jerseyNumber: number,
    joinedAt: serverTimestamp(),
  })
  batch.set(contactRef, { phone: phone.trim() })
  await batch.commit()
}

// Captain or admin removes a member
export async function removeMember(squadId, memberId) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'squads', squadId, 'members', memberId))
  batch.delete(doc(db, 'squads', squadId, 'contacts', memberId))
  await batch.commit()
}

// Counts sizes: { M: 4, L: 3 }
export function countSizes(members) {
  const counts = {}
  members.forEach((m) => (counts[m.size] = (counts[m.size] || 0) + 1))
  return counts
}

// The captain places ONE cash-on-delivery order for the whole squad.
// Joining closes, the stock goes down and the admins are notified, all together.
export async function placeSquadOrder({ squad, captain, delivery }) {
  const members = await getMembers(squad.id)
  if (members.length === 0) throw new Error('Nobody has joined yet.')

  const orderRef = doc(collection(db, 'orders'))
  const noteRef = doc(collection(db, 'notifications'))
  const captainNoteRef = doc(collection(db, 'notifications'))
  const squadRef = doc(db, 'squads', squad.id)
  const productRef = doc(db, 'products', squad.productId)

  await runTransaction(db, async (tx) => {
    const squadSnap = await tx.get(squadRef)
    const productSnap = await tx.get(productRef)
    if (!squadSnap.exists() || squadSnap.data().status !== 'open') throw new Error('This squad has already ordered.')
    if (!productSnap.exists()) throw new Error('This kit is no longer sold. Contact us for help.')
    const product = productSnap.data()
    if (product.stock < members.length) {
      throw new Error(`Only ${product.stock} kits left, but the squad has ${members.length} members. Contact us for help.`)
    }

    const unitPrice = squadSnap.data().unitPrice
    const sizeCounts = countSizes(members)
    const items = Object.keys(sizeCounts).map((size) => ({
      productId: squad.productId,
      name: squad.productName,
      size,
      quantity: sizeCounts[size],
      unitPrice,
      imageUrl: squad.imageUrl || '',
    }))
    const subtotal = unitPrice * members.length
    const discountPercent = squadDiscount(members.length)
    const total = Math.round(subtotal * (1 - discountPercent / 100))

    tx.update(productRef, { stock: product.stock - members.length })
    tx.set(orderRef, {
      type: 'squad',
      squadId: squad.id,
      squadName: squad.name,
      userId: captain.uid,
      customerName: delivery.name,
      phone: delivery.phone,
      address: delivery.address,
      note: '',
      items,
      itemCount: members.length,
      // What to print on each jersey
      jerseys: members.map((m) => ({ name: m.name, size: m.size, jerseyName: m.jerseyName, jerseyNumber: m.jerseyNumber })),
      subtotal,
      discountPercent,
      total,
      paymentMethod: 'cash_on_delivery',
      status: 'confirmed', // confirmed straight away
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    tx.update(squadRef, { status: 'ordered', orderId: orderRef.id })
    tx.set(
      noteRef,
      newNotification(
        ADMIN_INBOX,
        'New squad order',
        `${squad.name}: ${members.length} kits, order ${orderCode(orderRef.id)} for ${formatPrice(total)}.`,
        '/admin/squads',
      ),
    )
    tx.set(
      captainNoteRef,
      newNotification(
        captain.uid,
        'Squad order confirmed',
        `${squad.name}: ${members.length} kits, order ${orderCode(orderRef.id)} for ${formatPrice(total)} is confirmed.`,
        '/orders',
      ),
    )
  })

  return orderRef.id
}

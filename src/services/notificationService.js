import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

// Who a notification is for:
//   'admin'      -> every admin sees it in the Admin portal
//   a user's uid -> only that customer sees it
export const ADMIN_INBOX = 'admin'

// The data for a new notification (saved together with an order or a status change)
export const newNotification = (to, title, text, link) => ({
  to,
  title,
  text,
  link,
  read: false,
  createdAt: serverTimestamp(),
})

// Listens for notifications and calls onChange with the newest 20, every time something changes.
// Returns a function that stops listening.
export function listenToNotifications(to, onChange) {
  const q = query(collection(db, 'notifications'), where('to', '==', to))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Sorted here instead of in the query, so Firestore needs no extra index
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      onChange(list.slice(0, 20))
    },
    () => onChange([]),
  )
}

export const markNotificationRead = (id) => updateDoc(doc(db, 'notifications', id), { read: true })

export async function markAllNotificationsRead(list) {
  const unread = list.filter((n) => !n.read)
  if (unread.length === 0) return
  const batch = writeBatch(db)
  unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { read: true }))
  await batch.commit()
}

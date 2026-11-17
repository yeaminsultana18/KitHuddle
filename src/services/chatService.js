import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { newNotification } from './notificationService'

// Help chat for the whole shop. One chat per person: chats/{chatId}, messages in chats/{chatId}/messages.
//   Signed-in customers: chatId = their uid
//   Guests (no account): chatId = "guest-" + a long random code kept in their browser
// Admins act as moderators and reply from the Admin portal.

const GUEST_KEY = 'kithuddle-guest-chat'

export const isGuestChat = (chatId) => chatId.startsWith('guest-')

// The guest's chat id and name, saved in this browser so the chat is still there after a refresh
export function getGuestChat() {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_KEY) || 'null')
    if (saved?.id) return saved
  } catch {
    // ignore broken data and start fresh
  }
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
  return { id: `guest-${random}`, name: '' }
}

export function saveGuestName(guest, name) {
  const updated = { ...guest, name: name.trim() }
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(updated))
  } catch {
    // private browsing: the chat still works until the page closes
  }
  return updated
}

export function listenToMessages(chatId, onChange) {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => onChange([]),
  )
}

// A customer or guest sends a message
export async function sendUserMessage(chatId, userName, text) {
  const batch = writeBatch(db)
  batch.set(doc(collection(db, 'chats', chatId, 'messages')), {
    from: 'user',
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
  batch.set(
    doc(db, 'chats', chatId),
    {
      userName,
      isGuest: isGuestChat(chatId),
      lastText: text.trim(),
      lastFrom: 'user',
      lastAt: serverTimestamp(),
      unreadForAdmin: true,
    },
    { merge: true },
  )
  await batch.commit()
}

// A moderator replies. Signed-in customers also get a notification (guests see it in the open chat).
export async function sendAdminReply(chatId, text) {
  const batch = writeBatch(db)
  batch.set(doc(collection(db, 'chats', chatId, 'messages')), {
    from: 'admin',
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
  batch.update(doc(db, 'chats', chatId), {
    lastText: text.trim(),
    lastFrom: 'admin',
    lastAt: serverTimestamp(),
    unreadForAdmin: false,
  })
  if (!isGuestChat(chatId)) {
    batch.set(
      doc(collection(db, 'notifications')),
      newNotification(chatId, 'New reply from KitHuddle', text.trim().slice(0, 80), '/?chat=open'),
    )
  }
  await batch.commit()
}

// Every chat, newest first (admins only)
export function listenToChats(onChange) {
  const q = query(collection(db, 'chats'), orderBy('lastAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => onChange([]),
  )
}

export const markChatRead = (chatId) => updateDoc(doc(db, 'chats', chatId), { unreadForAdmin: false })

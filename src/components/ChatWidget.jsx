import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getGuestChat, listenToMessages, saveGuestName, sendUserMessage } from '../services/chatService'

// "Chat with us" button in the bottom-right corner of every shop page.
// Anyone can ask anything: signed-in customers chat under their account,
// guests just type their name first. A moderator (admin) replies live.
export default function ChatWidget() {
  const { user, profile, isAdmin } = useAuth()
  const [params] = useSearchParams()
  // Opens by itself when the customer comes from a "new reply" notification (?chat=open)
  const [open, setOpen] = useState(params.get('chat') === 'open')
  const [guest, setGuest] = useState(() => getGuestChat())
  const [nameInput, setNameInput] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // Signed in: the chat is the account's. Guest: the chat id saved in this browser.
  const chatId = user ? user.uid : guest.id
  const myName = user ? profile?.fullName || 'Customer' : guest.name
  const needsName = !user && !guest.name

  useEffect(() => {
    if (!open || isAdmin || needsName) return undefined
    return listenToMessages(chatId, setMessages)
  }, [open, isAdmin, needsName, chatId])

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, open])

  // Admins answer from the Admin portal, not here
  if (isAdmin) return null

  function handleName(e) {
    e.preventDefault()
    if (!nameInput.trim()) return setError('Please enter your name.')
    setError('')
    setGuest(saveGuestName(guest, nameInput))
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    setSending(true)
    try {
      await sendUserMessage(chatId, myName, text)
      setText('')
    } catch {
      setError('Could not send. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <section aria-label="Chat with KitHuddle" className="flex h-[28rem] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between bg-brand-900 px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Chat with us</p>
              <p className="text-xs text-brand-100">Ask anything: orders, sizes, squads. A moderator replies here.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
              ✕
            </button>
          </header>

          {needsName ? (
            // Guests tell us their name once
            <form onSubmit={handleName} className="flex flex-1 flex-col justify-center gap-3 p-5">
              <p className="text-sm text-slate-600">No account needed. What should we call you?</p>
              <label htmlFor="guest-name" className="text-sm font-semibold text-slate-700">Your name</label>
              <input
                id="guest-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
                className="rounded-lg border border-slate-300 px-3 py-2.5"
              />
              {error && <p className="text-xs text-red-700">{error}</p>}
              <button className="rounded-xl bg-brand-900 py-2.5 font-semibold text-white">Start chat</button>
            </form>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
                {messages.length === 0 && (
                  <p className="mt-6 text-center text-sm text-slate-500">Hi {myName}! How can we help you today?</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <p
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        m.from === 'user' ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {m.from === 'admin' && <span className="mb-0.5 block text-xs font-semibold text-brand-700">KitHuddle moderator</span>}
                      {m.text}
                    </p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {error && <p className="px-3 pt-2 text-xs text-red-700">{error}</p>}
              <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3">
                <label htmlFor="chat-message" className="sr-only">Message</label>
                <input
                  id="chat-message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  placeholder="Type your question..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button disabled={sending || !text.trim()} className="rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 font-semibold text-white shadow-lg hover:bg-brand-700"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
        Chat with us
      </button>
    </div>
  )
}

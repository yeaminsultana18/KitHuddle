import { useEffect, useRef, useState } from 'react'
import { listenToChats, listenToMessages, markChatRead, sendAdminReply } from '../../services/chatService'

const timeText = (ts) =>
  ts?.toDate ? ts.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''

// Moderators (admins) read and answer customers' squad questions
export default function AdminChats() {
  const [chats, setChats] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => listenToChats(setChats), [])

  useEffect(() => {
    if (!activeId) return undefined
    return listenToMessages(activeId, setMessages)
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const active = chats.find((c) => c.id === activeId)

  function openChat(chat) {
    setActiveId(chat.id)
    setMessages([])
    setError('')
    if (chat.unreadForAdmin) markChatRead(chat.id).catch(() => {})
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    setError('')
    try {
      await sendAdminReply(activeId, reply)
      setReply('')
    } catch {
      setError('Could not send the reply. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Customer chat</h1>
        <p className="text-sm text-slate-600">
          Questions from anyone on the shop, with or without an account. Signed-in customers also get a notification when you reply.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Chat list */}
        <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:w-80">
          {chats.length === 0 && <li className="p-5 text-sm text-slate-500">No questions yet.</li>}
          {chats.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => openChat(c)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${activeId === c.id ? 'bg-brand-50' : ''}`}
              >
                <p className="flex items-center justify-between gap-2 font-semibold">
                  <span>
                    {c.userName}
                    {c.isGuest && <span className="ml-1 text-xs font-normal text-slate-500">(guest)</span>}
                  </span>
                  {c.unreadForAdmin && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">New</span>}
                </p>
                <p className="truncate text-sm text-slate-600">
                  {c.lastFrom === 'admin' ? 'You: ' : ''}{c.lastText}
                </p>
                <p className="text-xs text-slate-500">{timeText(c.lastAt)}</p>
              </button>
            </li>
          ))}
        </ul>

        {/* Conversation */}
        <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {!active ? (
            <p className="m-auto p-6 text-sm text-slate-500">Choose a chat on the left.</p>
          ) : (
            <>
              <header className="border-b border-slate-200 px-5 py-3">
                <p className="font-semibold text-brand-900">
                  {active.userName}
                  {active.isGuest && <span className="ml-2 text-xs font-normal text-slate-500">Guest, no account</span>}
                </p>
              </header>
              <div className="max-h-[28rem] flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === 'admin' ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white'}`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <p className={`mt-1 text-[11px] ${m.from === 'admin' ? 'text-brand-100' : 'text-slate-500'}`}>{timeText(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {error && <p className="px-4 pt-2 text-sm text-red-700">{error}</p>}
              <form onSubmit={handleReply} className="flex gap-2 border-t border-slate-200 p-3">
                <label htmlFor="admin-reply" className="sr-only">Reply</label>
                <input
                  id="admin-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={500}
                  placeholder="Write a reply..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button disabled={sending || !reply.trim()} className="rounded-lg bg-brand-600 px-5 font-semibold text-white disabled:opacity-50">
                  Reply
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

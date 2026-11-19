import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listenToNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService'

// A bell with a red number for unread notifications. Updates live.
// inbox = 'admin' in the Admin portal, or the customer's uid in the shop.
// dark = true for the dark admin header styles.
export default function NotificationBell({ inbox, dark = false }) {
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!inbox) return undefined
    return listenToNotifications(inbox, setList)
  }, [inbox])

  const unread = list.filter((n) => !n.read).length

  async function openNotification(n) {
    setOpen(false)
    if (!n.read) markNotificationRead(n.id).catch(() => {})
    if (n.link) navigate(n.link)
  }

  const timeText = (n) =>
    n.createdAt?.toDate
      ? n.createdAt.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
      : 'Just now'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full ${dark ? 'hover:bg-slate-100' : 'hover:bg-gray-100'}`}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-brand-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(list).catch(() => {})}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {list.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50'}`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {!n.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-600" aria-hidden="true" />}
                      {n.title}
                    </p>
                    <p className="text-sm text-slate-600">{n.text}</p>
                    <p className="mt-1 text-xs text-slate-500">{timeText(n)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

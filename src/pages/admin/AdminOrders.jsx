import { useEffect, useState } from 'react'
import { formatPrice } from '../../services/productService'
import {
  ORDER_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  getAllOrders,
  isFinalStatus,
  orderCode,
  updateOrderStatus,
} from '../../services/orderService'
import { authErrorMessage } from '../../services/authService'

const dateText = (order) =>
  order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'Just now'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState(null)

  function load() {
    return getAllOrders()
      .then(setOrders)
      .catch(() => setMessage({ type: 'error', text: 'Could not load the orders.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const countOf = (status) => orders.filter((o) => o.status === status).length
  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  async function changeStatus(order, newStatus) {
    if (newStatus === order.status) return
    if (newStatus === 'cancelled' && !window.confirm(`Cancel order ${orderCode(order.id)}? Its items go back in stock.`)) return
    setMessage(null)
    setSavingId(order.id)
    try {
      await updateOrderStatus(order, newStatus)
      setMessage({ type: 'success', text: `Order ${orderCode(order.id)} is now ${STATUS_LABELS[newStatus]}. The customer was notified.` })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.code ? authErrorMessage(err) : err.message })
    } finally {
      setSavingId(null)
    }
  }

  const chip = (active) =>
    `rounded-full border px-4 py-2 text-sm ${active ? 'border-brand-900 bg-brand-900 font-semibold text-white' : 'border-slate-300 bg-white'}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Orders</h1>
        <p className="text-sm text-slate-600">Newest first. Cancelling an order puts its items back in stock.</p>
      </div>

      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter('all')} className={chip(filter === 'all')}>
          All ({orders.length})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={chip(filter === s)}>
            {STATUS_LABELS[s]} ({countOf(s)})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="5" className="px-4 py-4 text-slate-500">Loading...</td></tr>
            )}
            {!loading && shown.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No orders here yet.</td></tr>
            )}
            {shown.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold">{orderCode(o.id)}</p>
                  <p className="text-xs text-slate-500">{dateText(o)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{o.customerName}</p>
                  <p className="text-xs text-slate-500">{o.phone}</p>
                  <p className="max-w-56 text-xs text-slate-500">{o.address}</p>
                  {o.note && <p className="mt-1 max-w-56 text-xs italic text-slate-600">Note: {o.note}</p>}
                </td>
                <td className="max-w-64 px-4 py-3 text-slate-700">
                  {o.items.map((item, i) => (
                    <p key={i}>{item.name} ({item.size}) × {item.quantity}</p>
                  ))}
                </td>
                <td className="px-4 py-3 font-bold text-brand-900">
                  {formatPrice(o.total)}
                </td>
                <td className="px-4 py-3">
                  <label htmlFor={`status-${o.id}`} className="sr-only">Status for order {orderCode(o.id)}</label>
                  <select
                    id={`status-${o.id}`}
                    value={o.status}
                    disabled={savingId === o.id || isFinalStatus(o.status)}
                    onChange={(e) => changeStatus(o, e.target.value)}
                    className={`rounded-lg border border-slate-300 px-2 py-2 text-sm font-semibold disabled:opacity-80 ${STATUS_STYLES[o.status] || ''}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  {savingId === o.id && <p className="mt-1 text-xs text-slate-500">Saving...</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

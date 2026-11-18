import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../services/productService'
import { STATUS_LABELS, STATUS_STYLES, getMyOrders, orderCode } from '../services/orderService'

const dateText = (order) =>
  order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Just now'

export default function MyOrders() {
  const { user } = useAuth()
  const location = useLocation()
  const justPlaced = location.state?.placedOrderId

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyOrders(user.uid)
      .then(setOrders)
      .catch(() => setError('Could not load your orders. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [user.uid])

  return (
    <div className="mx-auto max-w-3xl">
      {justPlaced && (
        <p role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-800">
          ✓ Order {orderCode(justPlaced)} is confirmed! We will call you before delivery. Pay cash when it arrives.
        </p>
      )}

      <h1 className="mb-5 font-display text-5xl tracking-wide text-brand-900">My orders</h1>

      {loading && <p className="text-slate-500">Loading your orders...</p>}
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="text-slate-600">You have not placed any orders yet.</p>
          <Link to="/products" className="mt-3 inline-block font-semibold text-brand-600 underline">Start shopping</Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-brand-900">
                  Order {orderCode(order.id)}
                </p>
                <p className="text-sm text-slate-600">{dateText(order)} · Cash on delivery</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[order.status] || ''}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <ul className="mt-3 text-sm text-slate-700">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} ({item.size}) × {item.quantity} · {formatPrice(item.unitPrice * item.quantity)}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold">
              <span>Total</span>
              <span className="text-brand-900">{formatPrice(order.total)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../services/productService'
import { placeOrder } from '../services/orderService'
import { authErrorMessage } from '../services/authService'

const input = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal'
const isBdPhone = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''))

export default function Checkout() {
  const { user, profile } = useAuth()
  const { items, count, total, clearCart } = useCart()
  const navigate = useNavigate()

  // Filled in from the profile; the customer can change them for this order
  const [form, setForm] = useState({
    name: profile?.fullName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    note: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (items.length === 0 && !busy) return <Navigate to="/cart" replace />

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Please enter your name.')
    if (!isBdPhone(form.phone)) return setError('Enter a mobile number like 01712345678.')
    if (form.address.trim().length < 10) return setError('Please enter your full delivery address.')

    setBusy(true)
    try {
      const orderId = await placeOrder({
        userId: user.uid,
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        },
        cartItems: items,
      })
      clearCart()
      navigate('/orders', { replace: true, state: { placedOrderId: orderId } })
    } catch (err) {
      // Our own messages (like "Only 3 left") have no code; Firebase errors do
      setError(err.code ? authErrorMessage(err) : err.message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/cart" className="text-sm text-brand-600 underline">← Back to cart</Link>
      <h1 className="mb-6 mt-2 font-display text-5xl tracking-wide text-brand-900">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Delivery details</h2>
            <p className="text-sm text-slate-600">Filled in from your profile. Change anything for this order.</p>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Full name
            <input name="name" value={form.name} onChange={update} className={input} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Mobile number
            <input name="phone" value={form.phone} onChange={update} placeholder="01XXXXXXXXX" className={input} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Delivery address
            <textarea name="address" rows="3" value={form.address} onChange={update} className={input} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Note for the delivery person (optional)
            <input name="note" value={form.note} onChange={update} placeholder="e.g. call before coming" className={input} />
          </label>
          <div className="flex items-center gap-3 rounded-xl border-2 border-brand-600 bg-brand-50 px-4 py-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand-700" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            <div>
              <p className="font-semibold text-brand-900">Cash on delivery</p>
              <p className="text-sm text-slate-600">Pay when your order arrives</p>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 lg:w-96">
          <h2 className="mb-3 text-lg font-semibold text-brand-900">Your order ({count} items)</h2>
          <ul>
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm">
                <span>{item.name} · {item.size} × {item.quantity}</span>
                <span className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between pt-4 text-xl font-bold text-brand-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button disabled={busy} className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? 'Placing your order...' : 'Place order'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">Stock is checked again when you place the order.</p>
        </aside>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../services/productService'
import { orderCode } from '../services/orderService'
import {
  countSizes,
  daysLeft,
  getMemberPhones,
  getSquad,
  isSquadOpen,
  listenToMembers,
  nextDiscountStep,
  placeSquadOrder,
  removeMember,
  squadDiscount,
} from '../services/squadService'
import { authErrorMessage } from '../services/authService'

const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-normal'
const isBdPhone = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''))

export default function SquadDashboard() {
  const { id } = useParams()
  const { user, profile, isAdmin } = useAuth()

  const [squad, setSquad] = useState(null)
  const [members, setMembers] = useState([])
  const [phones, setPhones] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [delivery, setDelivery] = useState({
    name: profile?.fullName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  })

  useEffect(() => {
    getSquad(id)
      .then(setSquad)
      .catch(() => setMessage({ type: 'error', text: 'Could not load this squad.' }))
      .finally(() => setLoading(false))
  }, [id])

  // Live: the list updates by itself when someone joins
  useEffect(() => listenToMembers(id, setMembers), [id])

  // Phone numbers (captain and admins only); reloaded when the member count changes
  const isCaptain = squad && user && squad.captainId === user.uid
  const canManage = isCaptain || isAdmin
  useEffect(() => {
    if (canManage) getMemberPhones(id).then(setPhones).catch(() => {})
  }, [id, canManage, members.length])

  if (loading) return <p className="text-slate-500">Loading squad...</p>
  if (!squad) return <p className="rounded-lg bg-red-50 p-4 text-red-700">Squad not found.</p>
  if (!canManage) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-brand-900">Only the captain can see this page</h1>
        <Link to={`/squad/join/${squad.joinCode}`} className="mt-3 inline-block text-brand-600 underline">Join this squad instead</Link>
      </div>
    )
  }

  const count = members.length
  const discount = squadDiscount(count)
  const next = nextDiscountStep(count)
  const subtotal = squad.unitPrice * count
  const total = Math.round(subtotal * (1 - discount / 100))
  const sizeCounts = countSizes(members)
  const open = isSquadOpen(squad)
  const joinLink = `${window.location.origin}/squad/join/${squad.joinCode}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage({ type: 'error', text: `Copy this link: ${joinLink}` })
    }
  }

  async function handleRemove(member) {
    if (!window.confirm(`Remove ${member.name} (#${member.jerseyNumber}) from the squad?`)) return
    try {
      await removeMember(squad.id, member.id)
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    }
  }

  async function handleOrder(e) {
    e.preventDefault()
    setMessage(null)
    if (!delivery.name.trim()) return setMessage({ type: 'error', text: 'Enter the name for delivery.' })
    if (!isBdPhone(delivery.phone)) return setMessage({ type: 'error', text: 'Enter a mobile number like 01712345678.' })
    if (delivery.address.trim().length < 10) return setMessage({ type: 'error', text: 'Enter the full delivery address.' })
    if (!window.confirm(`Place one order for ${count} kits (${formatPrice(total)})? Nobody can join after this.`)) return

    setBusy(true)
    try {
      const orderId = await placeSquadOrder({
        squad,
        captain: { uid: user.uid },
        delivery: { name: delivery.name.trim(), phone: delivery.phone.trim(), address: delivery.address.trim() },
      })
      setSquad({ ...squad, status: 'ordered', orderId })
      setMessage({ type: 'success', text: `Squad order ${orderCode(orderId)} is confirmed! We will call you before delivery.` })
    } catch (err) {
      setMessage({ type: 'error', text: err.code ? authErrorMessage(err) : err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600">{isCaptain ? 'Captain view' : 'Admin view'} · {squad.productName}</p>
          <h1 className="font-display text-5xl tracking-wide text-brand-900">{squad.name}</h1>
        </div>
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-brand-600 bg-white px-4 py-2">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-slate-500">JOIN CODE</p>
            <p className="text-2xl font-extrabold tracking-[0.3em] text-brand-900">{squad.joinCode}</p>
          </div>
          <button type="button" onClick={copyLink} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Members</p>
          <p className="text-3xl font-bold text-brand-900">{count}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Squad discount</p>
          <p className="text-3xl font-bold text-brand-600">{discount}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Status</p>
          <p className="text-xl font-bold text-brand-900">
            {squad.status === 'ordered' ? 'Order placed' : open ? `Open · ${daysLeft(squad)} days left` : 'Deadline passed'}
          </p>
        </div>
      </div>

      {next && squad.status === 'open' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold">
              {next.members - count} more {next.members - count === 1 ? 'member unlocks' : 'members unlock'} {next.percent}% off
            </span>
            <span className="text-slate-600">{count} / {next.members}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-brand-50" role="img" aria-label={`${count} of ${next.members} members`}>
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (count / next.members) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Members */}
        <div className="min-w-0 flex-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Jersey</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {count === 0 && (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">Nobody has joined yet. Share the code with your team (you can join too).</td></tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3">{m.size}</td>
                  <td className="px-4 py-3 font-bold text-brand-900">{m.jerseyName} · {m.jerseyNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{phones[m.id] || '…'}</td>
                  <td className="px-4 py-3 text-right">
                    {squad.status === 'open' && (
                      <button onClick={() => handleRemove(m)} className="text-sm text-red-700 hover:underline">Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Combined order */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:w-96">
          <h2 className="mb-3 font-semibold text-brand-900">Combined order</h2>
          <div className="mb-1 flex justify-between text-sm text-slate-600">
            <span>{count} × {formatPrice(squad.unitPrice)}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="mb-1 flex justify-between text-sm text-green-800">
              <span>Squad discount ({discount}%)</span>
              <span>−{formatPrice(subtotal - total)}</span>
            </div>
          )}
          <p className="mb-3 text-sm text-slate-600">
            Sizes: {Object.keys(sizeCounts).map((s) => `${s}×${sizeCounts[s]}`).join(' · ') || 'none yet'}
          </p>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold text-brand-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {squad.status === 'ordered' ? (
            <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
              Ordered as {orderCode(squad.orderId)}.{' '}
              {isCaptain && <Link to="/orders" className="font-semibold underline">Track it in My orders</Link>}
            </p>
          ) : isCaptain && open ? (
            <form onSubmit={handleOrder} noValidate className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Deliver to (cash on delivery)</p>
              <label className="block text-xs font-semibold text-slate-600">
                Name
                <input value={delivery.name} onChange={(e) => setDelivery({ ...delivery, name: e.target.value })} className={input} />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Phone
                <input value={delivery.phone} onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })} className={input} />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Address
                <textarea rows="2" value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} className={input} />
              </label>
              <button disabled={busy || count === 0} className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white disabled:opacity-50">
                {busy ? 'Placing order...' : 'Place squad order (COD)'}
              </button>
              <p className="text-center text-xs text-slate-500">Joining closes once you place the order.</p>
            </form>
          ) : (
            !open && <p className="mt-4 text-sm text-slate-600">The deadline has passed. Contact us in the chat if you still want to order.</p>
          )}
        </aside>
      </div>

    </div>
  )
}

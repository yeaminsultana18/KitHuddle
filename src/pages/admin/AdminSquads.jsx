import { useEffect, useState } from 'react'
import { formatPrice } from '../../services/productService'
import { orderCode } from '../../services/orderService'
import {
  countSizes,
  getAllSquads,
  getMemberPhones,
  getMembers,
  isSquadOpen,
  squadDiscount,
} from '../../services/squadService'

export default function AdminSquads() {
  const [squads, setSquads] = useState([])
  const [counts, setCounts] = useState({}) // members per squad
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [detail, setDetail] = useState({ members: [], phones: {} })

  useEffect(() => {
    getAllSquads()
      .then(async (list) => {
        setSquads(list)
        // Count the members of each squad
        const c = {}
        await Promise.all(
          list.map(async (s) => {
            c[s.id] = (await getMembers(s.id)).length
          }),
        )
        setCounts(c)
      })
      .catch(() => setError('Could not load the squads.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(squad) {
    if (openId === squad.id) return setOpenId(null)
    setOpenId(squad.id)
    setDetail({ members: [], phones: {} })
    const [members, phones] = await Promise.all([getMembers(squad.id), getMemberPhones(squad.id)])
    members.sort((a, b) => Number(a.jerseyNumber) - Number(b.jerseyNumber))
    setDetail({ members, phones })
  }

  const statusOf = (s) =>
    s.status === 'ordered'
      ? ['Order placed', 'bg-brand-100 text-brand-700']
      : isSquadOpen(s)
        ? ['Open · joining', 'bg-amber-100 text-amber-900']
        : ['Deadline passed', 'bg-slate-200 text-slate-700']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Squad orders</h1>
        <p className="text-sm text-slate-600">
          Team orders are kept apart here. Open one to see every member's size and jersey print. Change the order status in Orders.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {loading && <p className="text-slate-500">Loading...</p>}
      {!loading && squads.length === 0 && <p className="rounded-2xl bg-white p-6 text-slate-600">No squads yet.</p>}

      <div className="flex flex-col gap-3">
        {squads.map((s) => {
          const n = counts[s.id] ?? 0
          const discount = squadDiscount(n)
          const [label, style] = statusOf(s)
          return (
            <article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-56 flex-1">
                  <p className="font-bold text-brand-900">{s.name}</p>
                  <p className="text-sm text-slate-600">Code {s.joinCode} · Captain {s.captainName} · {s.productName}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{n}</p>
                  <p className="text-xs text-slate-500">members</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-brand-600">{discount}%</p>
                  <p className="text-xs text-slate-500">discount</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-900">{formatPrice(Math.round(s.unitPrice * n * (1 - discount / 100)))}</p>
                  {s.orderId && <p className="text-xs text-slate-500">{orderCode(s.orderId)}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{label}</span>
                <button onClick={() => toggle(s)} aria-expanded={openId === s.id} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                  {openId === s.id ? 'Hide members' : 'View members'}
                </button>
              </div>

              {openId === s.id && (
                <div className="mt-4 overflow-x-auto border-t border-slate-100 pt-4">
                  <p className="mb-2 text-sm text-slate-600">
                    Sizes: {Object.entries(countSizes(detail.members)).map(([size, c]) => `${size}×${c}`).join(' · ') || '—'}
                  </p>
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Member</th>
                        <th className="py-2 pr-4 font-semibold">Size</th>
                        <th className="py-2 pr-4 font-semibold">Print</th>
                        <th className="py-2 font-semibold">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.members.map((m) => (
                        <tr key={m.id} className="border-t border-slate-100">
                          <td className="py-2 pr-4">{m.name}</td>
                          <td className="py-2 pr-4">{m.size}</td>
                          <td className="py-2 pr-4 font-bold text-brand-900">{m.jerseyName} · {m.jerseyNumber}</td>
                          <td className="py-2 text-slate-600">{detail.phones[m.id] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

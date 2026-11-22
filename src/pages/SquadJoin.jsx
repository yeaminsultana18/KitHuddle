import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SizeAdvisor from '../components/SizeAdvisor'
import { getProduct, stockOfSize } from '../services/productService'
import {
  findSquadByCode,
  isSquadOpen,
  joinSquad,
  listenToMembers,
  squadDiscount,
} from '../services/squadService'
import { authErrorMessage } from '../services/authService'

const input = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal'
const isBdPhone = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''))

export default function SquadJoin() {
  const { code } = useParams()
  const [squad, setSquad] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', phone: '', size: '', jerseyName: '', jerseyNumber: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [kit, setKit] = useState(null) // the squad's product, for the size chart
  const [showAdvisor, setShowAdvisor] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    findSquadByCode(code)
      .then(setSquad)
      .catch(() => setError('Could not load this squad. Check your connection.'))
      .finally(() => setLoading(false))
  }, [code])

  // The kit, so the size advisor can show its size chart
  useEffect(() => {
    if (squad) getProduct(squad.productId).then(setKit).catch(() => {})
  }, [squad])

  // Live member list, so taken numbers update while you fill in the form
  useEffect(() => {
    if (!squad) return undefined
    return listenToMembers(squad.id, setMembers)
  }, [squad])

  if (loading) return <p className="text-slate-500">Loading squad...</p>
  if (!squad) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-brand-900">Squad not found</h1>
        <p className="mt-2 text-slate-600">No squad uses the code {code}. Check it with your captain.</p>
        <Link to="/squad-orders" className="mt-4 inline-block text-brand-600 underline">Back to squad orders</Link>
      </div>
    )
  }

  const open = isSquadOpen(squad)
  const takenNumbers = members.map((m) => m.jerseyNumber)
  const deadlineText = squad.deadline?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Kits still free in a size: the stock minus the members who already chose it
  // (joining does not lower the stock; the captain's order does).
  // Old products only have a total, shared by every member.
  function freeInSize(s) {
    if (!kit) return Infinity // kit not loaded yet: do not block anyone
    if (kit.sizeStock) return stockOfSize(kit, s) - members.filter((m) => m.size === s).length
    return (kit.stock ?? 0) - members.length
  }
  const sizeFull = (s) => freeInSize(s) <= 0

  function pickSize(s) {
    if (sizeFull(s)) return setError(`Size ${s} has run out for this squad. Choose another size.`)
    setError('')
    setForm({ ...form, size: s })
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    const number = Number(form.jerseyNumber)
    if (!form.name.trim()) return setError('Enter your name.')
    if (!isBdPhone(form.phone)) return setError('Enter a mobile number like 01712345678.')
    if (!form.size) return setError('Choose your size.')
    if (sizeFull(form.size)) return setError(`Size ${form.size} has just run out for this squad. Choose another size.`)
    if (!form.jerseyName.trim()) return setError('Enter the name to print on your jersey.')
    if (form.jerseyName.trim().length > 12) return setError('The jersey name can have at most 12 letters.')
    if (!Number.isInteger(number) || number < 1 || number > 99) return setError('Jersey number must be from 1 to 99.')
    if (takenNumbers.includes(String(number))) return setError(`Number ${number} is already taken. Pick another number.`)

    setBusy(true)
    try {
      await joinSquad(squad.id, form)
      // Back to Squad Orders with a "you're in" message
      navigate('/squad-orders', {
        state: { joinedMessage: `You joined ${squad.name} as #${Number(form.jerseyNumber)} (size ${form.size}). Your captain will place the order for everyone.` },
      })
    } catch (err) {
      setError(err.code ? authErrorMessage(err) : err.message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start">
      <section className="rounded-2xl bg-brand-900 p-6 text-white md:w-80">
        <p className="text-xs font-semibold tracking-[0.15em] text-brand-300">YOU'RE JOINING</p>
        <h1 className="mt-1 font-display text-5xl tracking-wide">{squad.name}</h1>
        <div className="mt-4 aspect-[3/4] overflow-hidden rounded-xl bg-brand-700">
          {squad.imageUrl && <img src={squad.imageUrl} alt={squad.productName} className="h-full w-full object-cover" />}
        </div>
        <div className="mt-4 space-y-1 text-sm text-brand-100">
          <p>Kit: {squad.productName}</p>
          <p>Captain: {squad.captainName}</p>
          <p>Join by: {deadlineText}</p>
          <p>
            {members.length} members so far
            {squadDiscount(members.length) > 0 && <span className="font-bold text-gold"> · {squadDiscount(members.length)}% off now</span>}
          </p>
        </div>
      </section>

      <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
        {!open ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-brand-900">Joining is closed</h2>
            <p className="mt-2 text-slate-600">
              {squad.status === 'ordered' ? 'The captain has already placed the order.' : 'The deadline has passed.'} Ask your captain if you still need a kit.
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoin} noValidate className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-brand-900">Your details</h2>
              <p className="text-sm text-slate-600">No account needed. Your captain places one order for everyone.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Your name
                <input name="name" value={form.name} onChange={update} className={input} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Phone
                <input name="phone" value={form.phone} onChange={update} placeholder="01XXXXXXXXX" className={input} />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Size{' '}
                <button
                  type="button"
                  onClick={() => setShowAdvisor(!showAdvisor)}
                  aria-expanded={showAdvisor}
                  className="ml-1 text-xs font-medium text-brand-600 underline"
                >
                  {showAdvisor ? 'Hide size advisor' : 'Not sure? Use the size advisor'}
                </button>
              </p>
              {/* The advisor opens right here; "Use this size" fills in the size and closes it */}
              {showAdvisor && kit && (
                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <SizeAdvisor
                    product={kit}
                    onPick={(s) => {
                      pickSize(s)
                      setShowAdvisor(false)
                    }}
                  />
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {squad.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pickSize(s)}
                    disabled={sizeFull(s)}
                    aria-label={sizeFull(s) ? `${s}, sold out` : s}
                    title={sizeFull(s) ? 'Sold out' : undefined}
                    className={`h-11 min-w-12 rounded-lg border px-3 font-semibold disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:line-through ${form.size === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Name on jersey
                <input name="jerseyName" value={form.jerseyName} onChange={update} maxLength={12} className={`${input} uppercase`} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Number (1–99)
                <input name="jerseyNumber" type="number" min="1" max="99" value={form.jerseyNumber} onChange={update} className={input} />
              </label>
            </div>
            {takenNumbers.length > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Already taken: {takenNumbers.join(', ')}</p>
            )}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white disabled:opacity-60">
              {busy ? 'Joining...' : 'Join squad'}
            </button>
          </form>
        )}
      </section>

    </div>
  )
}

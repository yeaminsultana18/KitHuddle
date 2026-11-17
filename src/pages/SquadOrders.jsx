import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatPrice, getProducts, salePrice } from '../services/productService'
import { createSquad, findSquadByCode, getMySquads, isSquadOpen } from '../services/squadService'
import { authErrorMessage } from '../services/authService'

const input = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal'

// "2026-11-30" two weeks from today, for the date input
function inTwoWeeks() {
  const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

export default function SquadOrders() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const joinedMessage = useLocation().state?.joinedMessage

  const [products, setProducts] = useState([])
  const [mySquads, setMySquads] = useState([])
  const [teamName, setTeamName] = useState('')
  const [productId, setProductId] = useState('')
  const [deadline, setDeadline] = useState(inTwoWeeks())
  const [code, setCode] = useState('')
  const [createError, setCreateError] = useState('')
  const [joinError, setJoinError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getProducts()
      .then((list) => {
        // Kits that are in stock, jerseys first
        const kits = list.filter((p) => p.stock > 0)
        kits.sort((a, b) => (b.type === 'Jerseys') - (a.type === 'Jerseys'))
        setProducts(kits)
        if (kits[0]) setProductId(kits[0].id)
      })
      .catch(() => setCreateError('Could not load the kits. Refresh the page.'))
  }, [])

  useEffect(() => {
    if (user) getMySquads(user.uid).then(setMySquads).catch(() => {})
  }, [user])

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    if (!teamName.trim()) return setCreateError('Enter your team name.')
    const product = products.find((p) => p.id === productId)
    if (!product) return setCreateError('Choose a kit.')
    if (!deadline || deadline < today()) return setCreateError('Choose a deadline from today onwards.')
    setBusy(true)
    try {
      const id = await createSquad({
        captain: { uid: user.uid, name: profile?.fullName || 'Captain' },
        teamName,
        product,
        deadlineDate: deadline,
      })
      navigate(`/squads/${id}`)
    } catch (err) {
      setCreateError(authErrorMessage(err))
      setBusy(false)
    }
  }

  async function handleFind(e) {
    e.preventDefault()
    setJoinError('')
    if (code.trim().length !== 6) return setJoinError('The join code has 6 letters and numbers.')
    try {
      const squad = await findSquadByCode(code)
      if (!squad) return setJoinError('No squad uses that code. Check it with your captain.')
      navigate(`/squad/join/${squad.joinCode}`)
    } catch (err) {
      setJoinError(authErrorMessage(err))
    }
  }

  return (
    <div className="space-y-8">
      {joinedMessage && (
        <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-800">
          ✓ {joinedMessage}
        </p>
      )}
      <section className="flex flex-col gap-6 rounded-2xl bg-brand-900 p-8 text-white md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-6xl tracking-wide">Squad orders</h1>
          <p className="mt-2 text-brand-100">
            Order matching kits for your whole team. Share one join code, everyone adds their size and jersey name, and the captain places one order.
          </p>
        </div>
        <div className="flex gap-3">
          {[['5%', '5+ members'], ['10%', '10+ members'], ['15%', '15+ members']].map(([pct, label]) => (
            <div key={pct} className="rounded-xl bg-white/10 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gold">{pct}</p>
              <p className="text-xs text-brand-100">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Create a squad */}
        <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-brand-900">Create a squad (captain)</h2>
          {!user ? (
            <div className="mt-3">
              <p className="text-slate-600">Captains need an account so they can place the order.</p>
              <Link to="/login" state={{ from: '/squad-orders' }} className="mt-4 inline-block rounded-xl bg-brand-900 px-6 py-3 font-semibold text-white">
                Log in to create a squad
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCreate} noValidate className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Team name
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. EWU Strikers FC" className={input} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Kit
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className={input}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {formatPrice(salePrice(p))}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Join deadline
                <input type="date" min={today()} value={deadline} onChange={(e) => setDeadline(e.target.value)} className={input} />
              </label>
              {createError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{createError}</p>}
              <button disabled={busy} className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white disabled:opacity-60">
                {busy ? 'Creating...' : 'Create squad and get join code'}
              </button>
            </form>
          )}
        </section>

        {/* Join with a code */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:w-96">
          <h2 className="text-lg font-semibold text-brand-900">Got a join code?</h2>
          <p className="mt-1 text-sm text-slate-600">Your captain shares a 6-letter code. No account needed.</p>
          <form onSubmit={handleFind} noValidate className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Join code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="STRK26"
                className={`${input} text-xl font-bold uppercase tracking-[0.3em]`}
              />
            </label>
            {joinError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{joinError}</p>}
            <button className="w-full rounded-xl bg-brand-900 py-3.5 font-semibold text-white">Find squad</button>
          </form>
        </section>
      </div>

      {/* The captain's squads */}
      {user && mySquads.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-brand-900">My squads</h2>
          <ul className="divide-y divide-slate-100">
            {mySquads.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-slate-600">Code {s.joinCode} · {s.productName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSquadOpen(s) ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                    {s.status === 'ordered' ? 'Ordered' : isSquadOpen(s) ? 'Open' : 'Deadline passed'}
                  </span>
                  <Link to={`/squads/${s.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-900">
                    Open dashboard
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}

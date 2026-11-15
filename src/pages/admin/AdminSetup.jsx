import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordInput, fieldClass } from '../../components/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { authErrorMessage, isSetupDone, setupOwner } from '../../services/authService'

export default function AdminSetup() {
  const [done, setDone] = useState(null) // null = still checking
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    isSetupDone().then(setDone).catch(() => setDone(true))
  }, [])

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) return setError('Please fill in every field.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await setupOwner({ ...form, fullName: form.fullName.trim() })
      await refreshProfile()
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071430] p-6">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 md:p-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">KitHuddle Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-brand-900">Set up the owner account</h1>
        </div>

        {done === null && <p className="text-center text-slate-500">Checking...</p>}

        {done === true && (
          <div className="space-y-4 text-center">
            <p className="rounded-xl bg-green-50 p-4 text-green-800">
              Setup is already complete. New admins are added by the owner from the Admin portal.
            </p>
            <Link to="/admin/login" className="inline-block rounded-xl bg-brand-900 px-6 py-3 font-semibold text-white">
              Go to the Admin portal
            </Link>
          </div>
        )}

        {done === false && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <p className="text-sm text-slate-600">
              This runs once. The account you create here becomes the shop owner, who can add and remove admins.
            </p>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <input name="fullName" value={form.fullName} onChange={update} placeholder="Full name" aria-label="Full name" className={fieldClass(false)} />
            <input name="email" type="email" value={form.email} onChange={update} placeholder="Owner email" aria-label="Owner email" className={fieldClass(false)} />
            <input name="phone" value={form.phone} onChange={update} placeholder="Phone (01XXXXXXXXX)" aria-label="Phone" className={fieldClass(false)} />
            <PasswordInput id="owner-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (6+ characters)" />
            <PasswordInput id="owner-confirm" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Confirm password" />
            <button disabled={busy} className="w-full rounded-xl bg-brand-900 py-3.5 font-semibold text-white disabled:opacity-60">
              {busy ? 'Creating...' : 'Create owner account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

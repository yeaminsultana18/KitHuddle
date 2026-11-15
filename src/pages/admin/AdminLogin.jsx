import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PasswordInput } from '../../components/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { authErrorMessage, isSetupDone, isStaffRole, loginUser, logoutUser, resetPassword } from '../../services/authService'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alert, setAlert] = useState(null)
  const [busy, setBusy] = useState(false)
  const [setupDone, setSetupDone] = useState(true)
  const { isAdmin, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    isSetupDone().then(setSetupDone).catch(() => {})
  }, [])

  if (!loading && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!email.trim() || !password) return setAlert({ type: 'error', text: 'Enter your staff email and password.' })
    setBusy(true)
    try {
      const { profile } = await loginUser(email, password, true)
      if (!isStaffRole(profile?.role)) {
        await logoutUser()
        setAlert({ type: 'error', text: "This account does not have admin access. Customers can sign in on the shop's login page." })
        return
      }
      await refreshProfile()
      navigate('/admin', { replace: true })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot() {
    if (!email.trim()) return setAlert({ type: 'error', text: 'Enter your staff email first.' })
    try {
      await resetPassword(email)
      setAlert({ type: 'success', text: 'If that account exists, a reset link is on its way.' })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#071430] text-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-6 md:px-10">
        <span className="text-2xl font-extrabold text-white">
          Kit<span className="text-brand-500">Huddle</span>
          <span className="ml-3 rounded-full bg-brand-500/20 px-3 py-1 align-middle text-xs font-semibold text-brand-300">Admin</span>
        </span>
        <Link to="/" className="text-sm text-brand-300 hover:text-white">← Back to the shop</Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-[#1e3566] bg-[#0f2148] p-8 shadow-2xl md:p-10">
          <div className="space-y-3 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-white">Admin portal</h1>
            <p className="text-sm text-slate-400">Sign in with your staff account to manage the shop.</p>
          </div>

          {!setupDone && (
            <p className="rounded-xl bg-amber-400/15 p-3 text-sm text-amber-200">
              No owner account yet.{' '}
              <Link to="/admin/setup" className="font-semibold underline">Set up the owner account</Link>
            </p>
          )}

          {alert && (
            <p role="alert" className={`rounded-xl p-3 text-sm ${alert.type === 'error' ? 'bg-red-500/15 text-red-200' : 'bg-green-500/15 text-green-200'}`}>
              {alert.text}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-slate-800">
            <div>
              <label htmlFor="staff-email" className="mb-1.5 block text-sm font-semibold text-slate-300">Staff email</label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kithuddle.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="staff-password" className="mb-1.5 block text-sm font-semibold text-slate-300">Password</label>
              <PasswordInput id="staff-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button disabled={busy} className="w-full rounded-xl bg-brand-500 py-3.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {busy ? 'Signing in...' : 'Sign in to admin'}
            </button>
            <button type="button" onClick={handleForgot} className="block w-full text-center text-sm text-brand-300 hover:text-white">
              Forgot password?
            </button>
          </form>
        </div>
      </main>

      <footer className="p-5 text-center text-xs text-slate-500">
        Only accounts given admin access by the shop owner can sign in here.
      </footer>
    </div>
  )
}

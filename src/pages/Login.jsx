import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout, { PasswordInput, fieldClass } from '../components/AuthLayout'
import { authErrorMessage, isStaffRole, loginUser, logoutUser, resetPassword } from '../services/authService'
import { useAuth } from '../context/AuthContext'

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null) // { type: 'error' or 'success', text }
  const [busy, setBusy] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function validate() {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!isEmail(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!validate()) return
    setBusy(true)
    try {
      const { profile } = await loginUser(email, password, remember)
      if (isStaffRole(profile?.role)) {
        // Staff must use the Admin portal, not the shop login
        await logoutUser()
        setAlert({ type: 'error', text: 'This is a staff account. Please sign in through the Admin portal.' })
        return
      }
      await refreshProfile()
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot() {
    setAlert(null)
    if (!isEmail(email)) {
      setErrors({ email: 'Enter your email above, then click Forgot password' })
      return
    }
    try {
      await resetPassword(email)
      setAlert({ type: 'success', text: `If an account uses ${email.trim()}, a reset link is on its way.` })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-900">Sign in to your account</h1>
        <p className="mt-2 text-slate-600">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-600 underline">Create an account</Link>
        </p>
      </div>

      {alert && (
        <p
          role="alert"
          className={`rounded-xl p-3 text-sm ${alert.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}
        >
          {alert.text}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClass(errors.email)}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={errors.password} />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Remember me
          </label>
          <button type="button" onClick={handleForgot} className="font-medium text-brand-600 hover:underline">
            Forgot password?
          </button>
        </div>

        <button disabled={busy} className="w-full rounded-xl bg-brand-900 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />OR<span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link to="/" className="block rounded-xl bg-brand-50 py-3 text-center font-semibold text-brand-700 hover:bg-brand-100">
        Continue as a guest
        <span className="block text-xs font-normal text-slate-600">Browse the shop without an account</span>
      </Link>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />STAFF<span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link
        to="/admin/login"
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-semibold text-brand-900 hover:border-brand-600"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Go to the Admin portal
      </Link>
    </AuthLayout>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout, { PasswordInput, fieldClass } from '../components/AuthLayout'
import { authErrorMessage, registerUser } from '../services/authService'
import { useAuth } from '../context/AuthContext'

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isBdPhone = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''))

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState('')
  const [busy, setBusy] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!isEmail(form.email)) e.email = 'Enter a valid email address'
    if (!isBdPhone(form.phone)) e.phone = 'Enter a mobile number like 01712345678'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert('')
    if (!validate()) return
    setBusy(true)
    try {
      await registerUser({ ...form, fullName: form.fullName.trim() })
      await refreshProfile()
      navigate('/')
    } catch (err) {
      setAlert(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input id={name} name={name} value={form[name]} onChange={update} className={fieldClass(errors[name])} {...props} />
      {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
    </div>
  )

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-900">Create your account</h1>
        <p className="mt-2 text-slate-600">
          Already have one?{' '}
          <Link to="/login" className="font-semibold text-brand-600 underline">Sign in</Link>
        </p>
      </div>

      {alert && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{alert}</p>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {field('fullName', 'Full name', { placeholder: 'Your name' })}
        {field('email', 'Email', { type: 'email', placeholder: 'you@example.com' })}
        {field('phone', 'Phone', { placeholder: '01XXXXXXXXX' })}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            invalid={errors.password}
            placeholder="At least 6 characters"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm password</label>
          <PasswordInput
            id="confirm"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            invalid={errors.confirm}
            placeholder="Type it again"
          />
          {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>}
        </div>
        <button disabled={busy} className="w-full rounded-xl bg-brand-900 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <Link to="/" className="block text-center text-sm font-medium text-brand-600 hover:underline">
        Continue as a guest instead
      </Link>
    </AuthLayout>
  )
}

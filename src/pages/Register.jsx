import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, authErrorMessage } from '../services/authService'
import { useAuth } from '../context/AuthContext'

const input = 'w-full rounded border px-3 py-2'
const isBdPhone = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''))

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) return setError('Please enter your name.')
    if (!isBdPhone(form.phone)) return setError('Enter a mobile number like 01712345678.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')

    setBusy(true)
    try {
      await registerUser({ ...form, fullName: form.fullName.trim() })
      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="fullName" placeholder="Full name" value={form.fullName} onChange={update} className={input} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} className={input} required />
        <input name="phone" placeholder="Phone (01XXXXXXXXX)" value={form.phone} onChange={update} className={input} />
        <input name="password" type="password" placeholder="Password (6+ characters)" value={form.password} onChange={update} className={input} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-50">
          {busy ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <Link to="/login" className="text-blue-600 underline">Log in</Link>
      </p>
    </div>
  )
}
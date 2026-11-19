import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutUser, updateUserProfile } from '../services/authService'

const input = 'mt-1 w-full rounded border px-3 py-2 font-normal'
const isBdPhone = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''))

export default function Profile() {
  const { profile } = useAuth()

  if (!profile) return <p className="text-gray-500">Loading profile...</p>

  // The form only appears once the profile has loaded, so it can start with the right values
  return <ProfileForm key={profile.id} profile={profile} />
}

function ProfileForm({ profile }) {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logoutUser()
    navigate('/')
  }

  const [form, setForm] = useState({
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    address: profile.address || '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) return setError('Please enter your name.')
    if (!isBdPhone(form.phone)) return setError('Enter a mobile number like 01712345678.')

    setBusy(true)
    try {
      await updateUserProfile(user.uid, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      })
      await refreshProfile()
      setMessage('Saved.')
    } catch {
      setError('Could not save. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-1 text-2xl font-semibold">My profile</h1>
      <p className="mb-4 text-sm text-gray-500">{profile.email} · {profile.role}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium">
          Full name
          <input name="fullName" value={form.fullName} onChange={update} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input name="phone" value={form.phone} onChange={update} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Delivery address
          <textarea name="address" rows="3" value={form.address} onChange={update} className={input} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button disabled={busy} className="w-full rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-50">
          {busy ? 'Saving...' : 'Save changes'}
        </button>
      </form>
      <Link
        to="/orders"
        className="mt-4 block w-full rounded-lg border border-slate-300 py-2 text-center font-medium text-brand-900 hover:border-brand-600"
      >
        My orders
      </Link>
      <Link
        to="/wishlist"
        className="mt-3 block w-full rounded-lg border border-slate-300 py-2 text-center font-medium text-brand-900 hover:border-brand-600"
      >
        My wishlist
      </Link>
      <Link
        to="/squad-orders"
        className="mt-3 block w-full rounded-lg border border-slate-300 py-2 text-center font-medium text-brand-900 hover:border-brand-600"
      >
        My squads
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 w-full rounded-lg border border-red-200 py-2 font-medium text-red-600 hover:bg-red-50"
      >
        Log out
      </button>
    </div>
  )
}
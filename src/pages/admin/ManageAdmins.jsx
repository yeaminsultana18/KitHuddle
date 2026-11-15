import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { findUserByEmail, getStaff, setUserRole } from '../../services/adminService'
import { authErrorMessage } from '../../services/authService'

export default function ManageAdmins() {
  const { user, isOwner } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  function load() {
    return getStaff()
      .then((list) => setStaff(list.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0))))
      .catch(() => setMessage({ type: 'error', text: 'Could not load the admin list.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function makeAdmin(e) {
    e.preventDefault()
    setMessage(null)
    if (!email.trim()) return setMessage({ type: 'error', text: 'Enter an email address.' })
    setBusy(true)
    try {
      const found = await findUserByEmail(email)
      if (!found) {
        setMessage({ type: 'error', text: 'No registered account uses that email. Ask the person to create an account first.' })
      } else if (found.role !== 'customer') {
        setMessage({ type: 'error', text: `${found.fullName} already has staff access.` })
      } else {
        await setUserRole(found.id, 'admin')
        setMessage({ type: 'success', text: `${found.fullName} is now an admin.` })
        setEmail('')
        await load()
      }
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function removeAdmin(person) {
    if (!window.confirm(`Remove admin access from ${person.fullName}?`)) return
    setMessage(null)
    try {
      await setUserRole(person.id, 'customer')
      setMessage({ type: 'success', text: `${person.fullName} is no longer an admin.` })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Manage admins</h1>
        <p className="text-sm text-slate-600">Only the owner can add or remove admins.</p>
      </div>

      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}

      {isOwner && (
        <form onSubmit={makeAdmin} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="min-w-64 flex-1 text-sm font-semibold text-slate-700">
            Registered user's email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal"
            />
          </label>
          <button disabled={busy} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Checking...' : 'Make admin'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="4" className="px-5 py-4 text-slate-500">Loading...</td></tr>
            )}
            {staff.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 font-semibold">{p.fullName}</td>
                <td className="px-5 py-3 text-slate-600">{p.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.role === 'owner' ? 'bg-amber-100 text-amber-900' : 'bg-brand-50 text-brand-700'}`}>
                    {p.role === 'owner' ? 'Owner' : 'Admin'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {p.id === user?.uid ? (
                    <span className="text-slate-500">You</span>
                  ) : isOwner && p.role === 'admin' ? (
                    <button onClick={() => removeAdmin(p)} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50">
                      Remove admin
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useCategories from '../../hooks/useCategories'
import { getDashboardCounts } from '../../services/adminService'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')
  const categories = useCategories()

  useEffect(() => {
    getDashboardCounts().then(setCounts).catch(() => setError('Could not load the numbers.'))
  }, [])

  const cards = [
    ['Products', counts?.products, counts ? `${counts.outOfStock} out of stock` : ''],
    ['Categories', counts?.categories, categories.map((c) => c.name).join(', ')],
    ['Customers', counts?.customers, 'Registered accounts'],
    ['Orders', counts?.orders, counts ? `${counts.pendingOrders} confirmed, waiting to ship` : ''],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Welcome back, {profile?.fullName}.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-1 text-3xl font-bold text-brand-900">{value ?? '…'}</p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-brand-900">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/admins" className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">Manage admins</Link>
          
          <Link to="/admin/products" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-brand-900">Products</Link>
          <Link to="/admin/orders" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-brand-900">Orders</Link>
        </div>
      </div>
    </div>
  )
}

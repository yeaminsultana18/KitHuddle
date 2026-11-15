import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()
  const staffPage = role === 'admin'

  if (loading) return <p className="p-6 text-slate-500">Loading...</p>

  if (!user) {
    return <Navigate to={staffPage ? '/admin/login' : '/login'} replace state={{ from: location.pathname }} />
  }

  if (staffPage && !isAdmin) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-xl font-bold text-brand-900">No admin access</h1>
        <p className="mt-2 text-slate-600">This page is for KitHuddle staff only.</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 underline">Back to the shop</Link>
      </div>
    )
  }

  return children
}

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-gray-500">Loading...</p>

  if (!user) {
    // Remember the page they wanted, so Login can send them back to it
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role === 'admin' && !isAdmin) {
    return (
      <div className="rounded bg-yellow-50 p-4 text-yellow-800">
        This page is for the shop admin only.
      </div>
    )
  }

  return children
}
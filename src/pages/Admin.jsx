import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { profile } = useAuth()
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-2 text-2xl font-semibold">Admin dashboard</h1>
      <p className="mb-4 text-gray-600">Welcome, {profile?.fullName}.</p>
      <Link to="/admin/seed" className="text-blue-600 underline">
        Seed sample products
      </Link>
    </div>
  )
}
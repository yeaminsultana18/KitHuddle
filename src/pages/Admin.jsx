import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { profile } = useAuth()
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-2 text-2xl font-semibold">Admin dashboard</h1>
      <p className="text-gray-600">
        Welcome, {profile?.fullName}. Product and order management come in Module 3.
      </p>
    </div>
  )
}
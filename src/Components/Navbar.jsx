import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../services/authService'

const linkClass = ({ isActive }) =>
  `block rounded px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const close = () => setOpen(false)

  async function handleLogout() {
    close()
    await logoutUser()
    navigate('/login')
  }

  return (
    <header className="relative border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" onClick={close} className="text-xl font-bold text-blue-700">
          KitHuddle
        </Link>

        <button className="rounded border px-3 py-1 md:hidden" onClick={() => setOpen(!open)}>
          Menu
        </button>

        <div
          className={`${open ? 'block' : 'hidden'} absolute left-0 right-0 top-full z-10 border-b bg-white p-2
            md:static md:flex md:items-center md:gap-1 md:border-0 md:p-0`}
        >
          <NavLink to="/" end className={linkClass} onClick={close}>Home</NavLink>
          <NavLink to="/products" className={linkClass} onClick={close}>Shop</NavLink>
          {user ? (
            <>
              {isAdmin && <NavLink to="/admin" className={linkClass} onClick={close}>Admin</NavLink>}
              <NavLink to="/profile" className={linkClass} onClick={close}>
                {profile?.fullName?.split(' ')[0] || 'Profile'}
              </NavLink>
              <button
                onClick={handleLogout}
                className="block w-full rounded px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-gray-100 md:w-auto"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={close}>Login</NavLink>
              <NavLink to="/register" className={linkClass} onClick={close}>Register</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
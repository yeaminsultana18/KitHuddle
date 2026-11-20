import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../services/authService'
import NotificationBell from '../../components/NotificationBell'
import { ADMIN_INBOX } from '../../services/notificationService'

const LINKS = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/orders', 'Orders'],
  ['/admin/squads', 'Squad orders'],
  ['/admin/chats', 'Customer chat'],
  ['/admin/admins', 'Admins'],
  
]

export default function AdminLayout() {
  const { profile, isOwner } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logoutUser()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 md:flex-row">
      <aside className="flex flex-col gap-6 bg-brand-950 p-4 text-slate-300 md:w-64 md:p-5">
        <div className="px-2">
          <p className="text-2xl font-extrabold text-white">Kit<span className="text-brand-500">Huddle</span></p>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">ADMIN PORTAL</p>
        </div>
        <nav aria-label="Admin" className="flex flex-wrap gap-1 md:flex-col">
          {LINKS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-brand-600 font-semibold text-white' : 'hover:bg-white/10 hover:text-white'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <a href="/" className="mt-auto px-2 text-sm text-brand-300 hover:text-white">View the shop →</a>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4 md:px-8">
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-brand-900">{profile?.fullName}</span>
          </p>
          <div className="flex items-center gap-3">
            {/* New-order notifications for every admin */}
            <NotificationBell inbox={ADMIN_INBOX} dark />
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOwner ? 'bg-amber-100 text-amber-900' : 'bg-brand-50 text-brand-700'}`}>
              {isOwner ? 'Owner' : 'Admin'}
            </span>
            <button onClick={handleLogout} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

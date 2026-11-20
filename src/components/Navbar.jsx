import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import useCategories from '../hooks/useCategories'
import FilterPanel from './FilterPanel'
import NotificationBell from './NotificationBell'

const LOGO = '/kithuddle-logo.webp'

const FIRST_LINKS = [{ to: '/products', label: 'New Arrivals' }]
const LAST_LINKS = [
  { to: '/squad-orders', label: 'Squad Orders' },
  { to: '/size-guide', label: 'Size Guide' },
]

const linkClass = ({ isActive }) =>
  `block py-2 text-sm font-medium md:py-1 ${
    isActive ? 'font-semibold text-brand-600 md:border-b-2 md:border-brand-600' : 'text-slate-800 hover:text-brand-600'
  }`

const iconButton = 'flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')
  const { user, profile, isAdmin } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const categories = useCategories()

  // New Arrivals, then one link per category from the database, then the rest
  const links = [
    ...FIRST_LINKS,
    ...categories.map((c) => ({ to: `/category/${c.id}`, label: c.name })),
    ...LAST_LINKS,
  ]

  const accountLink = isAdmin ? '/admin' : user ? '/profile' : '/login'

  function closeAll() {
    setMenuOpen(false)
    setFilterOpen(false)
    setSearchOpen(false)
  }

  function search(e) {
    e.preventDefault()
    if (!term.trim()) return
    closeAll()
    navigate(`/products?q=${encodeURIComponent(term.trim())}`)
    setTerm('')
  }

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <p className="bg-brand-900 px-4 py-1.5 text-center text-xs font-medium tracking-wide text-white">
        <span className="text-gold">Cash on delivery</span> all over Bangladesh · Squad orders up to{' '}
        <span className="text-gold">15% off</span>
      </p>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-7">
        <Link to="/" onClick={closeAll} aria-label="KitHuddle home">
          <img src={LOGO} alt="KitHuddle" className="h-12 w-auto" />
        </Link>

        <nav
          aria-label="Categories"
          className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col border-b border-gray-200 bg-white px-4 pb-4
            md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:p-0`}
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={closeAll}>
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              setFilterOpen(!filterOpen)
              setSearchOpen(false)
            }}
            aria-expanded={filterOpen}
            className={`mt-2 flex items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold md:mt-0 ${
              filterOpen ? 'border-brand-900 bg-brand-900 text-white' : 'border-slate-300 bg-white'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filter
          </button>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            className={iconButton}
            onClick={() => {
              setSearchOpen(!searchOpen)
              setFilterOpen(false)
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
          <Link to={accountLink} onClick={closeAll} aria-label="Account" className={iconButton}>
            {user && profile ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {(profile.fullName || 'U').charAt(0).toUpperCase()}
              </span>
            ) : (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
              </svg>
            )}
          </Link>
          {/* Customers get order notifications here (admins see theirs in the Admin portal) */}
          {user && !isAdmin && <NotificationBell inbox={user.uid} />}
          <Link
            to="/cart"
            onClick={closeAll}
            aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}
            className={`relative ${iconButton}`}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {count > 0 && (
              <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="ml-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={search} className="border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-[1400px] gap-2 px-4 py-4 md:px-7">
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search jerseys, boots, bats..."
              aria-label="Search products"
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
            />
            <button className="rounded-lg bg-brand-900 px-6 font-semibold text-white">Search</button>
          </div>
        </form>
      )}

      {filterOpen && <FilterPanel onClose={closeAll} />}
      <div className="h-1 bg-gradient-to-r from-brand-600 via-gold to-emerald-500" aria-hidden="true" />
    </header>
  )
}

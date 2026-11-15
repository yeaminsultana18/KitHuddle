import { useState } from 'react'
import { Link } from 'react-router-dom'

const LOGO = '/kithuddle-logo.webp'

// Input style: red border when the field has an error
export const fieldClass = (invalid) =>
  `w-full rounded-xl border px-4 py-3 ${
    invalid ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-50 focus:border-brand-600'
  }`

export function PasswordInput({ id, value, onChange, invalid, placeholder = 'Enter your password' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${fieldClass(invalid)} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-500"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {show && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  )
}

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <aside
        className="flex min-h-[240px] flex-col justify-between bg-brand-900 bg-cover p-8 text-white md:w-1/2 md:p-12"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(5,11,26,0.15), rgba(5,11,26,0.85)), url('/kit-banner.jpg')",
          backgroundPosition: '70% center',
        }}
      >
        <Link to="/" className="text-2xl font-extrabold">
          Kit<span className="text-brand-300">Huddle</span>
        </Link>
        <div className="max-w-md space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-300">Gear up together</p>
          <p className="leading-relaxed text-slate-200">
            Track your orders, save your delivery address and, soon, organise team orders with a single join code.
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="block">
            <img src={LOGO} alt="KitHuddle" className="mx-auto h-24 w-auto" />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}

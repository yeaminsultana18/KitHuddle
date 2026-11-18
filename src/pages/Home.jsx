import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SportIcon from '../components/SportIcon'
import { getProducts } from '../services/productService'

const ROWS = [
  { id: 'football', name: 'Football', tiles: [['Jerseys', 'jersey'], ['Shorts', 'shorts'], ['Boots', 'boot']] },
  { id: 'cricket', name: 'Cricket', tiles: [['Jerseys', 'jersey'], ['Bats', 'bat'], ['Gloves', 'gloves']] },
  { id: 'running', name: 'Running', tiles: [['Shoes', 'shoe'], ['T-shirts', 'jersey'], ['Socks', 'socks']] },
]

const TINTS = ['bg-[#e7eef9]', 'bg-[#eef2f8]', 'bg-[#e3ebf7]']

const INFO = [
  ['Cash on delivery', 'Pay when your kit arrives'],
  ['Squad orders', 'One join code for the whole team, coming soon'],
  ['Size advisor', 'The right size from your height and weight, coming soon'],
]

const glow = { textShadow: '0 0 18px rgba(140,184,255,0.85), 0 0 42px rgba(47,127,224,0.6)' }

export default function Home() {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    getProducts()
      .then((products) => {
        const c = {}
        products.forEach((p) => (c[p.categoryId] = (c[p.categoryId] || 0) + 1))
        setCounts(c)
      })
      .catch(() => {}) // the page still works without the counts
  }, [])

  return (
    <div className="space-y-14">
      {/* Offer banners */}
      <section className="grid gap-5 md:grid-cols-2">
        <Link
          to="/category/football?type=Jerseys"
          className="flex aspect-[16/15] flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand-900 bg-cover p-8 text-center text-white"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(5,11,26,0.35), rgba(5,11,26,0.55)), url('/kit-banner.jpg')",
            backgroundPosition: '70% center',
          }}
        >
          <span className="text-xs font-semibold tracking-[0.4em] text-slate-200">KITHUDDLE</span>
          <span className="font-display text-5xl tracking-wider md:text-6xl lg:text-7xl">New season kits</span>
          <span className="font-display text-8xl leading-[0.85] text-gold lg:text-[170px]">20% off</span>
          <span className="font-display text-3xl tracking-wider lg:text-4xl">On all football jerseys</span>
          <span className="mt-4 rounded-lg border-2 border-white px-6 py-1 font-display text-2xl tracking-wider lg:text-3xl">
            Shop jerseys
          </span>
        </Link>

        <Link
          to="/products"
          className="flex aspect-[16/15] flex-col items-center justify-center gap-1 overflow-hidden rounded-lg p-8 text-center text-white"
          style={{
            backgroundColor: '#0b1f42',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 14px, rgba(0,0,0,0.12) 14px 28px), radial-gradient(circle at 50% 45%, #1f66c9 0%, #0f2a56 55%, #050b1a 100%)',
          }}
        >
          <span className="font-display text-9xl leading-[0.85] lg:text-[200px]" style={glow}>12.12</span>
          <span className="font-display text-6xl tracking-[0.1em] lg:text-[92px]" style={glow}>Mega sale</span>
          <span className="mt-5 font-display text-3xl tracking-wider text-brand-100 lg:text-5xl">12 – 18 December</span>
          <span className="mt-2 rounded-lg border-2 border-white/85 px-5 py-1 font-display text-2xl tracking-wider lg:text-3xl">
            Up to 30% off · Cash on delivery
          </span>
        </Link>
      </section>

      {/* One row per sport */}
      {ROWS.map((row) => (
        <section key={row.id}>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-3xl font-semibold text-gray-900">{row.name}</h2>
            <Link to={`/category/${row.id}`} className="text-sm font-medium underline hover:text-brand-600">
              Explore all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {row.tiles.map(([label, icon], i) => (
              <Link
                key={label}
                to={`/category/${row.id}?type=${encodeURIComponent(label)}`}
                className={`group relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md ${TINTS[i % 3]}`}
              >
                <SportIcon name={icon} className="h-28 w-28 text-brand-600 transition duration-300 group-hover:scale-110" />
                <span
                  className="absolute inset-0 flex items-end p-4 text-xl font-semibold text-white"
                  style={{ background: 'linear-gradient(180deg, rgba(15,42,86,0) 45%, rgba(15,42,86,0.8) 100%)' }}
                >
                  {label}
                </span>
              </Link>
            ))}
            <Link
              to={`/category/${row.id}`}
              className="flex aspect-[3/4] flex-col justify-end gap-2 rounded-md bg-brand-900 p-5 text-white hover:bg-brand-700"
            >
              <span className="text-sm text-brand-300">
                {counts[row.id] ? `${counts[row.id]} products` : 'All products'}
              </span>
              <span className="text-2xl font-bold leading-tight">Explore all {row.name}</span>
              <span className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-brand-900">→</span>
            </Link>
          </div>
        </section>
      ))}

      {/* Information strip */}
      <section className="grid gap-4 md:grid-cols-3">
        {INFO.map(([title, text]) => (
          <div key={title} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="font-semibold text-brand-900">{title}</p>
            <p className="text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

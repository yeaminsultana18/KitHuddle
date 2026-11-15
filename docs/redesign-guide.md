# KitHuddle Redesign Implementation Guide

Nov 16, 2026 · @yeamin18

This guide turns the approved design into working code in 12 steps: the new shop look, a category page instead of the Shop page, a Filter panel, new customer login and register pages with a guest option, and a separate Admin portal where admins are managed on the website.

## Before you start

Do the steps in order: each one builds on the files from the step before. Steps 1 to 7 change the shop; steps 8 to 12 change login and add the Admin portal. Commit and push after each step, so your teacher sees steady progress.

**How to paste code safely.** For every file below, open it in VS Code (or create it), press `Ctrl+A`, delete, paste the whole code block, and save with `Ctrl+S`. If you get "Failed to resolve import", the file name is wrong: check it with `dir src\pages` or `dir src\components`.

**Honest warning.** I wrote this code carefully but could not run it here. Test after every step, and send me any error message.

| Action | Files |
| --- | --- |
| Replace | `index.html` (font lines), `src/index.css`, `src/seed/seedData.js`, `src/services/productService.js`, `src/services/authService.js`, `src/context/AuthContext.jsx`, `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `src/components/Layout.jsx`, `src/components/ProductCard.jsx`, `src/components/ProtectedRoute.jsx`, `src/pages/Home.jsx`, `src/pages/Login.jsx`, `src/pages/Register.jsx`, `src/pages/ProductDetail.jsx` (one part), `src/pages/Profile.jsx` (one part), `src/App.jsx`, Firestore rules |
| Create | `src/components/SportIcon.jsx`, `src/components/FilterPanel.jsx`, `src/components/AuthLayout.jsx`, `src/pages/ComingSoon.jsx`, `src/pages/Collection.jsx`, `src/services/adminService.js`, `src/pages/admin/AdminLogin.jsx`, `src/pages/admin/AdminSetup.jsx`, `src/pages/admin/AdminLayout.jsx`, `src/pages/admin/AdminDashboard.jsx`, `src/pages/admin/ManageAdmins.jsx`, `public/kit-banner.jpg` |
| Delete | `src/pages/Products.jsx`, `src/pages/Admin.jsx` |

**Where each design page lives in the code:**

| Design page | Address | File |
| --- | --- | --- |
| Home | `/` | `Home.jsx` |
| Category page (Explore all) | `/category/football`, `/category/cricket`, `/category/running` | `Collection.jsx` |
| New Arrivals, Filter results, Search results | `/products` | `Collection.jsx` (same page) |
| Customer login and register | `/login`, `/register` | `Login.jsx`, `Register.jsx` |
| Admin portal login | `/admin/login` | `AdminLogin.jsx` |
| First-time owner setup | `/admin/setup` | `AdminSetup.jsx` |
| Admin dashboard and Manage admins | `/admin`, `/admin/admins` | `AdminDashboard.jsx`, `ManageAdmins.jsx` |

## Step 1: Fonts, brand colours and the banner photo

The design uses two fonts: **Poppins** for normal text and **Bebas Neue** for the tall banner words.

**1.1** Open `index.html` (main folder, not `src`). Just above `</head>`, add these lines (if you added the Poppins lines before, replace them with these):

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

**1.2** Replace everything in `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Poppins", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Bebas Neue", "Poppins", sans-serif;
  --color-brand-50: #eef5ff;
  --color-brand-100: #d9e8ff;
  --color-brand-300: #8cb8ff;
  --color-brand-500: #2f7fe0;
  --color-brand-600: #1f66c9;
  --color-brand-700: #1a52a3;
  --color-brand-900: #0f2a56;
  --color-brand-950: #0b1f42;
  --color-gold: #f5c451;
}

body {
  @apply bg-gray-100 text-slate-800 antialiased;
}
```

Now classes like `font-display`, `bg-brand-900` and `text-gold` work everywhere.

**1.3** Put the kit photo (the one you sent me, resized) in `public` named exactly **`kit-banner.jpg`**. I've sent it in the chat as `kit-banner.jpg`. The home banner and the login page both use it.

**1.4** Check your logo file name: run `dir public`. The guide uses `/kithuddle-logo.webp`. If your file has another name, change the `LOGO` line in Step 4 and Step 9 to match.

**Push:** `git add .` then `git commit -m "Add display font, brand colours and banner photo"` then `git push`.

## Step 2: Product data: type and sale fields

The category page filters by **type** (Jerseys, Shorts, Boots…), and the banner promises **20% off football jerseys**, so each product gets two new fields: `type` and `salePercent`. Add `-type` and `-salePercent` to the Product class card in your report.

**2.1** Replace everything in `src/seed/seedData.js`:

```javascript
import { doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

// Change to true once you've put real photos in public/products/ (p01.jpg ... p12.jpg)
const USE_LOCAL_IMAGES = false

const APPAREL = ['S', 'M', 'L', 'XL']
const SHOES = ['40', '41', '42', '43', '44']

const picture = (id, name) =>
  USE_LOCAL_IMAGES
    ? [`/products/${id}.jpg`]
    : [`https://placehold.co/600x800?text=${encodeURIComponent(name)}`]

export const categories = [
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'running', name: 'Running' },
]

// salePercent: 0 = full price, 20 = 20% off
const product = (id, name, categoryId, type, brand, price, salePercent, stock, sizes, description) => ({
  id,
  name,
  categoryId,
  type,
  brand,
  price, // in BDT, before any sale
  salePercent,
  stock,
  sizes,
  description,
  imageUrls: picture(id, name),
  tryOnImageUrl: '', // used in Module 7
  tryOnPrompt: '',
})

export const products = [
  product('p01', 'Home Jersey 2026', 'football', 'Jerseys', 'Apex', 850, 20, 40, APPAREL, 'Lightweight match jersey with breathable mesh panels.'),
  product('p02', 'Away Jersey 2026', 'football', 'Jerseys', 'Apex', 850, 20, 40, APPAREL, 'Away colours in the same quick-dry fabric as the home kit.'),
  product('p03', 'Training Jersey', 'football', 'Jerseys', 'Nova', 650, 20, 30, APPAREL, 'Everyday training top for hard sessions.'),
  product('p04', 'Football Shorts', 'football', 'Shorts', 'Nova', 450, 0, 35, APPAREL, 'Elastic waist shorts with a drawcord.'),
  product('p05', 'Firm Ground Boots', 'football', 'Boots', 'Stride', 3200, 0, 15, SHOES, 'Studded boots for grass pitches.'),
  product('p06', 'Match Football', 'football', 'Balls', 'Apex', 1200, 0, 20, ['Size 5'], 'Size 5 ball, machine stitched.'),
  product('p07', 'Cricket Jersey', 'cricket', 'Jerseys', 'Nova', 800, 0, 25, APPAREL, 'Short-sleeve cricket top in team colours.'),
  product('p08', 'English Willow Bat', 'cricket', 'Bats', 'Apex', 4500, 0, 10, ['Short handle', 'Long handle'], 'Grade 2 willow bat for club players.'),
  product('p09', 'Batting Gloves', 'cricket', 'Gloves', 'Stride', 1100, 0, 0, ['M', 'L'], 'Padded gloves with a breathable palm.'),
  product('p10', 'Road Running Shoes', 'running', 'Shoes', 'Stride', 3800, 0, 12, SHOES, 'Cushioned shoes for daily road runs.'),
  product('p11', 'Running T-shirt', 'running', 'T-shirts', 'Nova', 550, 0, 30, APPAREL, 'Light, sweat-wicking tee.'),
  product('p12', 'Sports Socks (3 pairs)', 'running', 'Socks', 'Nova', 250, 0, 50, ['Free size'], 'Cushioned ankle socks.'),
]

// Saves everything in one go. Fixed IDs mean running it twice overwrites instead of duplicating.
export async function seedDatabase() {
  const batch = writeBatch(db)
  categories.forEach(({ id, ...data }) => batch.set(doc(db, 'categories', id), data))
  products.forEach(({ id, ...data }) => batch.set(doc(db, 'products', id), data))
  await batch.commit()
  return { categories: categories.length, products: products.length }
}
```

**2.2** Replace everything in `src/services/productService.js`:

```javascript
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

export async function getProducts() {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// The price the customer pays, after any sale
export const salePrice = (product) =>
  product.salePercent > 0
    ? Math.round(product.price * (1 - product.salePercent / 100))
    : product.price

export const formatPrice = (amount) => `৳${Number(amount).toLocaleString('en-BD')}`
```

**2.3** Reseed the database. Run `npm run dev`, log in with your **current** admin account, open `localhost:5173/admin/seed` and click **Seed the database**. In Firestore, open `products/p01`: it now has `type: "Jerseys"` and `salePercent: 20`. (Do this now, before Step 10 changes the rules.)

**Push:** `git commit -m "Add product type and sale fields"`.

## Step 3: Shared pieces

Three small files that later steps use.

**3.1** Create `src/components/SportIcon.jsx`. These are the blue line icons on the category tiles:

```jsx
const PATHS = {
  jersey: 'M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3c0 2-2 3-4 3s-4-1-4-3z',
  shorts: 'M5 4h14l1 15h-6l-2-8-2 8H4z',
  boot: 'M3 16V8h6l2 3 7 2c2 .5 3 1.5 3 3v1H3z M3 19h18',
  ball: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7l4 3-1.5 4.5h-5L8 10z',
  bat: 'M5 19l7-7 M11 9.5l5.5-5.5a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1L14.5 13z',
  gloves: 'M7 21v-8l-2-3V6a1.5 1.5 0 0 1 3 0v3V4.5a1.5 1.5 0 0 1 3 0V9V5a1.5 1.5 0 0 1 3 0v4V7a1.5 1.5 0 0 1 3 0v7c0 3-2 5-4 7z',
  shoe: 'M3 17c3 0 4-1 6-4l2 2c1 1 3 2 5 2h4v3H5c-1 0-2-1-2-3z M9 13l2-5 3 2',
  socks: 'M9 3h6v9l3 4c1 2 0 5-3 5-1.5 0-2.5-.5-3.5-1.5L7 15V3z',
}

export default function SportIcon({ name, className = 'h-28 w-28' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name] || PATHS.jersey} />
    </svg>
  )
}
```

**3.2** Replace everything in `src/components/ProductCard.jsx`. The new card is tall, like the design, with a **−20%** badge and the old price crossed out:

```jsx
import { Link } from 'react-router-dom'
import { formatPrice, salePrice } from '../services/productService'

export default function ProductCard({ product }) {
  const outOfStock = product.stock <= 0
  const onSale = product.salePercent > 0

  return (
    <Link to={`/products/${product.id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-brand-50">
        <img
          src={product.imageUrls?.[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {onSale && (
          <span className="absolute left-3 top-3 rounded bg-gold px-2.5 py-1 text-xs font-bold text-amber-950">
            −{product.salePercent}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-3 top-3 rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="px-0.5">
        <p className="font-semibold group-hover:text-brand-600">{product.name}</p>
        <p className="text-sm text-slate-500">{product.brand}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold text-brand-900">{formatPrice(salePrice(product))}</span>
          {onSale && <span className="text-sm text-slate-500 line-through">{formatPrice(product.price)}</span>}
        </p>
      </div>
    </Link>
  )
}
```

**3.3** Create `src/pages/ComingSoon.jsx`. Squad Orders, Size Guide and the unfinished admin pages show this until their module is built:

```jsx
import { Link } from 'react-router-dom'

export default function ComingSoon({ title, text, back = '/' }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Coming soon</p>
      <h1 className="mt-2 text-3xl font-bold text-brand-900">{title}</h1>
      <p className="mt-3 text-slate-600">{text}</p>
      <Link to={back} className="mt-6 inline-block rounded-xl bg-brand-900 px-6 py-3 font-semibold text-white">
        Go back
      </Link>
    </div>
  )
}
```

**Push:** `git commit -m "Add sport icons, new product card and coming-soon page"`.

## Step 4: Header with Filter panel, footer and layout

The new header has the logo on the left, the category links in the middle (ending with the **Filter** button), and search, account and cart icons on the right. The old Shop, Login, Register and Log out buttons go away: the account icon leads to login or the profile, and the profile page gets a Log out button in Step 7.

**4.1** Create `src/components/FilterPanel.jsx`. It opens under the header and sends the choices to the results page as an address such as `/products?cats=football&min=500&max=1000`:

```jsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const CATEGORIES = [
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'running', name: 'Running' },
]

const input = 'w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-normal'

export default function FilterPanel({ onClose }) {
  const [params] = useSearchParams()
  const [cats, setCats] = useState(params.get('cats')?.split(',').filter(Boolean) || [])
  const [min, setMin] = useState(params.get('min') || '')
  const [max, setMax] = useState(params.get('max') || '')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const toggle = (id) => setCats(cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id])

  function apply(e) {
    e.preventDefault()
    if (min !== '' && max !== '' && Number(min) > Number(max)) {
      return setError('The minimum price is higher than the maximum price.')
    }
    const query = new URLSearchParams()
    if (cats.length) query.set('cats', cats.join(','))
    if (min !== '') query.set('min', min)
    if (max !== '') query.set('max', max)
    onClose()
    navigate(`/products?${query.toString()}`)
  }

  function clear() {
    setCats([])
    setMin('')
    setMax('')
    setError('')
  }

  return (
    <div className="border-t border-gray-200 bg-white shadow-lg">
      <form onSubmit={apply} className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 md:grid-cols-4 md:items-end md:px-7">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700">Category</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  cats.includes(c.id) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'
                }`}
              >
                <input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggle(c.id)} className="accent-brand-600" />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm font-semibold text-slate-700">
          Min price (৳)
          <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} className={`mt-2 ${input}`} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Max price (৳)
          <input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} className={`mt-2 ${input}`} />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={clear} className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm">
            Clear
          </button>
          <button className="flex-[2] rounded-lg bg-brand-900 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Show results
          </button>
        </div>
        {error && <p className="text-sm text-red-600 md:col-span-4">{error}</p>}
      </form>
    </div>
  )
}
```

**4.2** Replace everything in `src/components/Navbar.jsx`. Change the `LOGO` line if your logo file has another name:

```jsx
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FilterPanel from './FilterPanel'

const LOGO = '/kithuddle-logo.webp'

const LINKS = [
  { to: '/products', label: 'New Arrivals' },
  { to: '/category/football', label: 'Football' },
  { to: '/category/cricket', label: 'Cricket' },
  { to: '/category/running', label: 'Running' },
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
  const navigate = useNavigate()

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
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-7">
        <Link to="/" onClick={closeAll} aria-label="KitHuddle home">
          <img src={LOGO} alt="KitHuddle" className="h-12 w-auto" />
        </Link>

        <nav
          aria-label="Categories"
          className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col border-b border-gray-200 bg-white px-4 pb-4
            md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:p-0`}
        >
          {LINKS.map((l) => (
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
          <Link to="/cart" onClick={closeAll} aria-label="Cart" className={iconButton}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
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
    </header>
  )
}
```

**4.3** Replace everything in `src/components/Footer.jsx` (create it if you skipped Part A earlier):

```jsx
import { Link } from 'react-router-dom'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['Football', '/category/football'],
      ['Cricket', '/category/cricket'],
      ['Running', '/category/running'],
    ],
  },
  {
    title: 'Information',
    links: [
      ['Size guide', '/size-guide'],
      ['Squad orders', '/squad-orders'],
      ['New arrivals', '/products'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['Sign in', '/login'],
      ['Create an account', '/register'],
      ['My profile', '/profile'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-950 text-slate-300">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-11 text-sm md:grid-cols-4 md:px-7">
        <div>
          <p className="text-2xl font-extrabold">
            <span className="text-white">Kit</span>
            <span className="text-brand-500">Huddle</span>
          </p>
          <p className="mt-3 leading-relaxed">Sports kits for you and your whole team.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 font-semibold text-white">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © 2026 KitHuddle · Group 02, Department of CSE, East West University · We accept cash on delivery
      </div>
    </footer>
  )
}
```

**4.4** Replace everything in `src/components/Layout.jsx`:

```jsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-7">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
```

**Check:** the header shows the logo, the category links, Filter, and the three icons. Filter opens the panel; the search icon opens a search bar. Some links (Football, Squad Orders, Cart) show "Page not found" until Steps 6 and 12 add their pages.

**Push:** `git commit -m "Add new header with filter and search, and new footer"`.

## Step 5: The new home page

Two offer banners side by side, then a row for each sport with tall tiles and an "Explore all" card, then the information strip.

**About the offers.** The left banner's **20% off football jerseys** is real: Step 2 gave those jerseys `salePercent: 20`, and the cards and product page show the sale price. The right banner announces a **12.12 sale** for later dates; if your teacher asks, say it's an announcement for a future campaign. Change the wording if you prefer.

Replace everything in `src/pages/Home.jsx`:

```jsx
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
```

**Check:** two banners side by side (stacked on a phone), three sport rows with icon tiles, the navy "Explore all" card showing the product count, and the information strip. Clicking tiles opens "Page not found" until Step 6.

**Push:** `git commit -m "Redesign home page with offer banners and sport rows"`.

## Step 6: The category and collection page

One page replaces the old Shop page. It shows:

- **a category**, when opened from a sport row, the menu or "Explore all" (`/category/football`), optionally starting on one type (`?type=Jerseys`)
- **New Arrivals**, all products (`/products`)
- **Filter results** from the Filter panel (`/products?cats=football&min=500&max=1000`)
- **Search results** from the search icon (`/products?q=jersey`)

The type buttons (All, Jerseys, Shorts…) and the **Sort by** menu work on all of them.

Create `src/pages/Collection.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { formatPrice, getCategories, getProducts, salePrice } from '../services/productService'

const SORTS = {
  featured: 'Featured',
  low: 'Price: low to high',
  high: 'Price: high to low',
  name: 'Name: A to Z',
}

export default function Collection() {
  const { categoryId } = useParams()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('featured')

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
      })
      .catch(() => setError('Could not load products. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [])

  // Everything the page shows comes from the address, so links and the Back button just work
  const type = params.get('type') || ''
  const q = (params.get('q') || '').trim()
  const cats = (params.get('cats') || '').split(',').filter(Boolean)
  const min = params.get('min') ? Number(params.get('min')) : null
  const max = params.get('max') ? Number(params.get('max')) : null

  const category = categories.find((c) => c.id === categoryId)
  const isFiltered = q !== '' || cats.length > 0 || min !== null || max !== null

  // Products for this page before the type buttons
  const base = products.filter(
    (p) =>
      (!categoryId || p.categoryId === categoryId) &&
      (cats.length === 0 || cats.includes(p.categoryId)) &&
      (q === '' || p.name.toLowerCase().includes(q.toLowerCase())) &&
      (min === null || salePrice(p) >= min) &&
      (max === null || salePrice(p) <= max),
  )

  const types = [...new Set(base.map((p) => p.type).filter(Boolean))]
  let shown = base.filter((p) => !type || p.type === type)
  if (sort === 'low') shown = [...shown].sort((a, b) => salePrice(a) - salePrice(b))
  if (sort === 'high') shown = [...shown].sort((a, b) => salePrice(b) - salePrice(a))
  if (sort === 'name') shown = [...shown].sort((a, b) => a.name.localeCompare(b.name))

  const title = category
    ? category.name
    : q
      ? `Results for "${q}"`
      : isFiltered
        ? 'Filtered products'
        : 'New Arrivals'

  function chooseType(t) {
    const next = new URLSearchParams(params)
    if (t) next.set('type', t)
    else next.delete('type')
    setParams(next)
  }

  if (loading) return <p className="text-slate-500">Loading products...</p>
  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
  if (categoryId && !category) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center">
        <h1 className="text-2xl font-bold text-brand-900">Category not found</h1>
        <Link to="/" className="mt-3 inline-block text-brand-600 underline">Back to the home page</Link>
      </div>
    )
  }

  const chip = (active) =>
    `rounded-full border px-4 py-2 text-sm ${
      active ? 'border-brand-900 bg-brand-900 font-semibold text-white' : 'border-slate-300 bg-white hover:border-brand-600'
    }`

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <span aria-hidden="true">/</span>
        <span className="text-gray-900">{title}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {shown.length} {shown.length === 1 ? 'product' : 'products'}
            {base.some((p) => p.salePercent > 0) && ' · Sale prices on selected items'}
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
          >
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <span className="font-semibold">Filters:</span>
          {cats.length > 0 && <span>{cats.map((c) => categories.find((x) => x.id === c)?.name || c).join(', ')}</span>}
          {(min !== null || max !== null) && (
            <span>{min !== null ? formatPrice(min) : '৳0'} – {max !== null ? formatPrice(max) : 'any price'}</span>
          )}
          {q && <span>“{q}”</span>}
          <Link to={categoryId ? `/category/${categoryId}` : '/products'} className="ml-auto font-semibold underline">
            Clear all
          </Link>
        </div>
      )}

      {types.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => chooseType('')} className={chip(!type)}>All</button>
          {types.map((t) => (
            <button key={t} type="button" onClick={() => chooseType(t)} className={chip(type === t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="rounded-lg bg-white p-10 text-center text-slate-500">
          No products match. Try another type, or clear the filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
```

The route for this page is added in Step 12 with all the others. To test it now, add these two lines inside the `<Route element={<Layout />}>` block of `src/App.jsx`, with `import Collection from './pages/Collection'` at the top (Step 12 replaces the whole file later anyway):

```jsx
<Route path="/products" element={<Collection />} />
<Route path="/category/:categoryId" element={<Collection />} />
```

If your `App.jsx` already has a `/products` route for the old Products page, replace that line.

**Check:**

| Do this | Expect |
| --- | --- |
| Click **Football** in the menu | "Football", 6 products, buttons All / Jerseys / Boots / Shorts / Balls |
| Click the **Jerseys** tile on the home page | Football page with **Jerseys** already selected, 3 jerseys at ৳680 / ৳520 with the old price crossed out |
| **Filter**: tick Football, Min 500, Max 1000, **Show results** | "Filtered products": the 3 football jerseys (sale prices count), a blue filter bar and Clear all |
| Search icon, type `jersey` | "Results for "jersey"", 4 jerseys |
| **Sort by** price low to high | Cheapest first |

**Push:** `git commit -m "Add category and collection page with types, sort, filter and search"`.

## Step 7: Sale price on the product page, and Log out on the profile

Two small edits in files you already have.

**7.1** In `src/pages/ProductDetail.jsx`, change the `productService` import line to:

```jsx
import { formatPrice, getCategories, getProduct, salePrice } from '../services/productService'
```

Then find this line:

```jsx
          <p className="mt-2 text-2xl font-bold text-blue-700">{formatPrice(product.price)}</p>
```

and replace it with:

```jsx
          <p className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-600">{formatPrice(salePrice(product))}</span>
            {product.salePercent > 0 && (
              <>
                <span className="text-lg text-slate-500 line-through">{formatPrice(product.price)}</span>
                <span className="rounded bg-gold px-2 py-0.5 text-sm font-bold text-amber-950">−{product.salePercent}%</span>
              </>
            )}
          </p>
```

**7.2** The header has no Log out button any more, so it moves to the profile page. In `src/pages/Profile.jsx`:

- Add these imports at the top:

```jsx
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../services/authService'
```

(If the file already imports from `'../services/authService'`, add `logoutUser` inside those braces instead of a second line.)

- Inside the `ProfileForm` function, under `const { user, refreshProfile } = useAuth()`, add:

```jsx
  const navigate = useNavigate()

  async function handleLogout() {
    await logoutUser()
    navigate('/')
  }
```

- Just before the last `</div>` of the returned page (after `</form>`), add:

```jsx
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 w-full rounded-lg border border-red-200 py-2 font-medium text-red-600 hover:bg-red-50"
      >
        Log out
      </button>
```

**Check:** Home Jersey's page shows ৳680, the old ৳850 crossed out and −20%. The profile page has a Log out button that returns you to the home page.

**Push:** `git commit -m "Show sale prices and move log out to the profile page"`.

## Step 8: Auth and admin services

The new login pages and the Admin portal need some new functions: **Remember me**, **Forgot password**, the one-time **owner setup**, and the admin tools. There are now three roles: `customer`, `admin` (staff) and `owner` (the shop owner, who manages admins).

**8.1** Replace everything in `src/services/authService.js`:

```javascript
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase'

// Staff = anyone who may use the Admin portal
export const isStaffRole = (role) => role === 'admin' || role === 'owner'

export async function registerUser({ fullName, email, phone, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
  await setDoc(doc(db, 'users', cred.user.uid), {
    fullName,
    email: cleanEmail,
    phone,
    address: '',
    role: 'customer', // every website sign-up is a customer
    createdAt: serverTimestamp(),
  })
  return cred.user
}

// remember = true keeps you signed in after closing the browser
export async function loginUser(email, password, remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
  const profile = await getUserProfile(cred.user.uid)
  return { user: cred.user, profile }
}

export const logoutUser = () => signOut(auth)

export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim())

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function updateUserProfile(uid, { fullName, phone, address }) {
  return updateDoc(doc(db, 'users', uid), { fullName, phone, address })
}

// ---- One-time owner setup ----

export async function isSetupDone() {
  const snap = await getDoc(doc(db, 'config', 'setup'))
  return snap.exists()
}

// Creates the owner's login, their profile with role 'owner', and the lock document, together.
// The security rules (Step 10) only allow this while the lock document does not exist.
export async function setupOwner({ fullName, email, phone, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
  try {
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', cred.user.uid), {
      fullName,
      email: cleanEmail,
      phone,
      address: '',
      role: 'owner',
      createdAt: serverTimestamp(),
    })
    batch.set(doc(db, 'config', 'setup'), { ownerId: cred.user.uid, completedAt: serverTimestamp() })
    await batch.commit()
  } catch (err) {
    await cred.user.delete() // setup was refused, so remove the login we just made
    throw err
  }
}

const MESSAGES = {
  'auth/email-already-in-use': 'That email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'No account uses that email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/network-request-failed': 'No internet connection. Please try again.',
  'permission-denied': 'You do not have permission to do that.',
}

export const authErrorMessage = (err) => MESSAGES[err?.code] || 'Something went wrong. Please try again.'
```

**8.2** Replace everything in `src/context/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { getUserProfile, isStaffRole } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshProfile(u = auth.currentUser) {
    setProfile(u ? await getUserProfile(u.uid) : null)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      try {
        await refreshProfile(u)
      } catch {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const value = {
    user,
    profile,
    loading,
    isAdmin: isStaffRole(profile?.role), // admin or owner
    isOwner: profile?.role === 'owner',
    refreshProfile,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

**8.3** Create `src/services/adminService.js`, the functions the admin pages use:

```javascript
import { collection, doc, getCountFromServer, getDocs, limit, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'

export async function getDashboardCounts() {
  const [products, outOfStock, categories, customers] = await Promise.all([
    getCountFromServer(collection(db, 'products')),
    getCountFromServer(query(collection(db, 'products'), where('stock', '<=', 0))),
    getCountFromServer(collection(db, 'categories')),
    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'customer'))),
  ])
  return {
    products: products.data().count,
    outOfStock: outOfStock.data().count,
    categories: categories.data().count,
    customers: customers.data().count,
  }
}

// Everyone who can use the Admin portal
export async function getStaff() {
  const snap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['owner', 'admin'])))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Finds a registered account by email (checks the email as typed and in lower case)
export async function findUserByEmail(email) {
  const typed = email.trim()
  const options = [...new Set([typed, typed.toLowerCase()])]
  const snap = await getDocs(query(collection(db, 'users'), where('email', 'in', options), limit(1)))
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// Only the owner may do this; the security rules check it again on the server
export const setUserRole = (uid, role) => updateDoc(doc(db, 'users', uid), { role })
```

Nothing visible changes yet; Steps 9 to 11 use these.

**Push:** `git commit -m "Add remember me, password reset, owner setup and admin services"`.

## Step 9: Customer login and register pages

Both pages use the split-screen design: your kit photo on the left, the form on the right. Errors appear under each field, the eye button shows or hides the password, **Forgot password** emails a reset link, **Continue as a guest** goes to the shop, and staff accounts are sent to the Admin portal.

**9.1** Create `src/components/AuthLayout.jsx`. It holds the split screen plus two helpers both pages use:

```jsx
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
```

**9.2** Replace everything in `src/pages/Login.jsx`:

```jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout, { PasswordInput, fieldClass } from '../components/AuthLayout'
import { authErrorMessage, isStaffRole, loginUser, logoutUser, resetPassword } from '../services/authService'
import { useAuth } from '../context/AuthContext'

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null) // { type: 'error' or 'success', text }
  const [busy, setBusy] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function validate() {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!isEmail(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!validate()) return
    setBusy(true)
    try {
      const { profile } = await loginUser(email, password, remember)
      if (isStaffRole(profile?.role)) {
        // Staff must use the Admin portal, not the shop login
        await logoutUser()
        setAlert({ type: 'error', text: 'This is a staff account. Please sign in through the Admin portal.' })
        return
      }
      await refreshProfile()
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot() {
    setAlert(null)
    if (!isEmail(email)) {
      setErrors({ email: 'Enter your email above, then click Forgot password' })
      return
    }
    try {
      await resetPassword(email)
      setAlert({ type: 'success', text: `If an account uses ${email.trim()}, a reset link is on its way.` })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-900">Sign in to your account</h1>
        <p className="mt-2 text-slate-600">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-600 underline">Create an account</Link>
        </p>
      </div>

      {alert && (
        <p
          role="alert"
          className={`rounded-xl p-3 text-sm ${alert.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}
        >
          {alert.text}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClass(errors.email)}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={errors.password} />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Remember me
          </label>
          <button type="button" onClick={handleForgot} className="font-medium text-brand-600 hover:underline">
            Forgot password?
          </button>
        </div>

        <button disabled={busy} className="w-full rounded-xl bg-brand-900 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />OR<span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link to="/" className="block rounded-xl bg-brand-50 py-3 text-center font-semibold text-brand-700 hover:bg-brand-100">
        Continue as a guest
        <span className="block text-xs font-normal text-slate-600">Browse the shop without an account</span>
      </Link>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />STAFF<span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link
        to="/admin/login"
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-semibold text-brand-900 hover:border-brand-600"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Go to the Admin portal
      </Link>
    </AuthLayout>
  )
}
```

**9.3** Replace everything in `src/pages/Register.jsx`:

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout, { PasswordInput, fieldClass } from '../components/AuthLayout'
import { authErrorMessage, registerUser } from '../services/authService'
import { useAuth } from '../context/AuthContext'

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isBdPhone = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''))

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState('')
  const [busy, setBusy] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!isEmail(form.email)) e.email = 'Enter a valid email address'
    if (!isBdPhone(form.phone)) e.phone = 'Enter a mobile number like 01712345678'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert('')
    if (!validate()) return
    setBusy(true)
    try {
      await registerUser({ ...form, fullName: form.fullName.trim() })
      await refreshProfile()
      navigate('/')
    } catch (err) {
      setAlert(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input id={name} name={name} value={form[name]} onChange={update} className={fieldClass(errors[name])} {...props} />
      {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
    </div>
  )

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-900">Create your account</h1>
        <p className="mt-2 text-slate-600">
          Already have one?{' '}
          <Link to="/login" className="font-semibold text-brand-600 underline">Sign in</Link>
        </p>
      </div>

      {alert && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{alert}</p>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {field('fullName', 'Full name', { placeholder: 'Your name' })}
        {field('email', 'Email', { type: 'email', placeholder: 'you@example.com' })}
        {field('phone', 'Phone', { placeholder: '01XXXXXXXXX' })}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            invalid={errors.password}
            placeholder="At least 6 characters"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm password</label>
          <PasswordInput
            id="confirm"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            invalid={errors.confirm}
            placeholder="Type it again"
          />
          {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>}
        </div>
        <button disabled={busy} className="w-full rounded-xl bg-brand-900 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <Link to="/" className="block text-center text-sm font-medium text-brand-600 hover:underline">
        Continue as a guest instead
      </Link>
    </AuthLayout>
  )
}
```

These pages have no shop header, so Step 12 moves `/login` and `/register` outside the shop layout. Until then they appear under the header, which is fine for testing.

**Check:** click **Sign in** with empty fields: red borders and "Email is required" / "Password is required". The eye button shows the password. **Forgot password** with your email shows the green message and a reset email arrives (check spam). **Continue as a guest** opens the home page.

**Push:** `git commit -m "Redesign customer login and register pages"`.

## Step 10: New Firestore security rules

These rules make the admin system safe on the server, not just in the website:

- **Sign-ups are always customers.** Nobody can register as admin.
- **Exactly one owner, created once.** The owner can be created only together with the `config/setup` lock document, and only while that lock does not exist yet. After that, the setup can never run again.
- **Only the owner changes roles,** only between `customer` and `admin`, never their own role, and never anything else in another user's profile.
- **Admins and the owner** can read user profiles (for the dashboard and Manage admins) and change products and categories.

In Firebase, open **Firestore Database → Rules**, replace everything, and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function myDoc() { return /databases/$(database)/documents/users/$(request.auth.uid); }
    function myRole() { return get(myDoc()).data.role; }
    function isOwner() { return signedIn() && exists(myDoc()) && myRole() == 'owner'; }
    function isAdmin() { return signedIn() && exists(myDoc()) && myRole() in ['admin', 'owner']; }
    function setupDone() { return exists(/databases/$(database)/documents/config/setup); }

    // The lock that makes owner setup a one-time action
    match /config/setup {
      allow read: if true;
      allow create: if signedIn() && !setupDone()
        && request.resource.data.ownerId == request.auth.uid
        && getAfter(myDoc()).data.role == 'owner';
      allow update, delete: if false;
    }

    match /users/{uid} {
      allow read: if signedIn() && (request.auth.uid == uid || isAdmin());

      // New profiles: customers, or the one owner during setup
      allow create: if signedIn() && request.auth.uid == uid && (
        request.resource.data.role == 'customer'
        || (request.resource.data.role == 'owner' && !setupDone()
            && existsAfter(/databases/$(database)/documents/config/setup))
      );

      // Everyone edits their own profile, but never their own role
      allow update: if signedIn() && request.auth.uid == uid
        && request.resource.data.role == resource.data.role;

      // The owner switches other users between customer and admin, and changes nothing else
      allow update: if isOwner() && request.auth.uid != uid
        && resource.data.role in ['customer', 'admin']
        && request.resource.data.role in ['customer', 'admin']
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['role']);
    }

    // Anyone can see the catalog; only admins and the owner can change it
    match /categories/{id} { allow read: if true; allow write: if isAdmin(); }
    match /products/{id}   { allow read: if true; allow write: if isAdmin(); }
  }
}
```

If you keep the rules in your repo (`firestore.rules`), paste the same text there too, so GitHub shows the current version.

**Check in the Rules Playground** (Firestore → Rules → Rules Playground), using a customer's UID from Authentication → Users:

| Simulation | Location | Authenticated as | Expected |
| --- | --- | --- | --- |
| get | `users/<customer UID>` | the customer | Allowed |
| get | `users/<another UID>` | the customer | Denied |
| create | `products/test` | the customer | Denied |
| get | `config/setup` | not signed in | Allowed |

Screenshot the "Denied" results for your report.

**Push:** `git commit -m "Add owner and admin security rules"` (if you saved `firestore.rules`).

## Step 11: The Admin portal

Five new files in `src/pages/admin/` (the folder already holds `AdminSeed.jsx`), plus an updated route guard. The routes are wired up in Step 12.

**11.1** Replace everything in `src/components/ProtectedRoute.jsx`. Admin pages now send signed-out visitors to the Admin portal, not the shop login:

```jsx
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
```

**11.2** Create `src/pages/admin/AdminLogin.jsx`, the dark Admin portal sign-in:

```jsx
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PasswordInput } from '../../components/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { authErrorMessage, isSetupDone, isStaffRole, loginUser, logoutUser, resetPassword } from '../../services/authService'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alert, setAlert] = useState(null)
  const [busy, setBusy] = useState(false)
  const [setupDone, setSetupDone] = useState(true)
  const { isAdmin, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    isSetupDone().then(setSetupDone).catch(() => {})
  }, [])

  if (!loading && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!email.trim() || !password) return setAlert({ type: 'error', text: 'Enter your staff email and password.' })
    setBusy(true)
    try {
      const { profile } = await loginUser(email, password, true)
      if (!isStaffRole(profile?.role)) {
        await logoutUser()
        setAlert({ type: 'error', text: "This account does not have admin access. Customers can sign in on the shop's login page." })
        return
      }
      await refreshProfile()
      navigate('/admin', { replace: true })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot() {
    if (!email.trim()) return setAlert({ type: 'error', text: 'Enter your staff email first.' })
    try {
      await resetPassword(email)
      setAlert({ type: 'success', text: 'If that account exists, a reset link is on its way.' })
    } catch (err) {
      setAlert({ type: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#071430] text-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-6 md:px-10">
        <span className="text-2xl font-extrabold text-white">
          Kit<span className="text-brand-500">Huddle</span>
          <span className="ml-3 rounded-full bg-brand-500/20 px-3 py-1 align-middle text-xs font-semibold text-brand-300">Admin</span>
        </span>
        <Link to="/" className="text-sm text-brand-300 hover:text-white">← Back to the shop</Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-[#1e3566] bg-[#0f2148] p-8 shadow-2xl md:p-10">
          <div className="space-y-3 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-white">Admin portal</h1>
            <p className="text-sm text-slate-400">Sign in with your staff account to manage the shop.</p>
          </div>

          {!setupDone && (
            <p className="rounded-xl bg-amber-400/15 p-3 text-sm text-amber-200">
              No owner account yet.{' '}
              <Link to="/admin/setup" className="font-semibold underline">Set up the owner account</Link>
            </p>
          )}

          {alert && (
            <p role="alert" className={`rounded-xl p-3 text-sm ${alert.type === 'error' ? 'bg-red-500/15 text-red-200' : 'bg-green-500/15 text-green-200'}`}>
              {alert.text}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-slate-800">
            <div>
              <label htmlFor="staff-email" className="mb-1.5 block text-sm font-semibold text-slate-300">Staff email</label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kithuddle.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="staff-password" className="mb-1.5 block text-sm font-semibold text-slate-300">Password</label>
              <PasswordInput id="staff-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button disabled={busy} className="w-full rounded-xl bg-brand-500 py-3.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {busy ? 'Signing in...' : 'Sign in to admin'}
            </button>
            <button type="button" onClick={handleForgot} className="block w-full text-center text-sm text-brand-300 hover:text-white">
              Forgot password?
            </button>
          </form>
        </div>
      </main>

      <footer className="p-5 text-center text-xs text-slate-500">
        Only accounts given admin access by the shop owner can sign in here.
      </footer>
    </div>
  )
}
```

**11.3** Create `src/pages/admin/AdminSetup.jsx`, the one-time owner setup. Once it has run, it only shows "Setup is already complete":

```jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordInput, fieldClass } from '../../components/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { authErrorMessage, isSetupDone, setupOwner } from '../../services/authService'

export default function AdminSetup() {
  const [done, setDone] = useState(null) // null = still checking
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    isSetupDone().then(setDone).catch(() => setDone(true))
  }, [])

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) return setError('Please fill in every field.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await setupOwner({ ...form, fullName: form.fullName.trim() })
      await refreshProfile()
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071430] p-6">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 md:p-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">KitHuddle Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-brand-900">Set up the owner account</h1>
        </div>

        {done === null && <p className="text-center text-slate-500">Checking...</p>}

        {done === true && (
          <div className="space-y-4 text-center">
            <p className="rounded-xl bg-green-50 p-4 text-green-800">
              Setup is already complete. New admins are added by the owner from the Admin portal.
            </p>
            <Link to="/admin/login" className="inline-block rounded-xl bg-brand-900 px-6 py-3 font-semibold text-white">
              Go to the Admin portal
            </Link>
          </div>
        )}

        {done === false && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <p className="text-sm text-slate-600">
              This runs once. The account you create here becomes the shop owner, who can add and remove admins.
            </p>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <input name="fullName" value={form.fullName} onChange={update} placeholder="Full name" aria-label="Full name" className={fieldClass(false)} />
            <input name="email" type="email" value={form.email} onChange={update} placeholder="Owner email" aria-label="Owner email" className={fieldClass(false)} />
            <input name="phone" value={form.phone} onChange={update} placeholder="Phone (01XXXXXXXXX)" aria-label="Phone" className={fieldClass(false)} />
            <PasswordInput id="owner-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (6+ characters)" />
            <PasswordInput id="owner-confirm" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Confirm password" />
            <button disabled={busy} className="w-full rounded-xl bg-brand-900 py-3.5 font-semibold text-white disabled:opacity-60">
              {busy ? 'Creating...' : 'Create owner account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

**11.4** Create `src/pages/admin/AdminLayout.jsx`, the sidebar and top bar around every admin page:

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../services/authService'

const LINKS = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/orders', 'Orders'],
  ['/admin/admins', 'Admins'],
  ['/admin/seed', 'Sample data'],
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
```

**11.5** Create `src/pages/admin/AdminDashboard.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardCounts } from '../../services/adminService'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardCounts().then(setCounts).catch(() => setError('Could not load the numbers.'))
  }, [])

  const cards = [
    ['Products', counts?.products, counts ? `${counts.outOfStock} out of stock` : ''],
    ['Categories', counts?.categories, 'Football, Cricket, Running'],
    ['Customers', counts?.customers, 'Registered accounts'],
    ['Orders', 0, 'Checkout arrives in Sprint 3'],
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
          <Link to="/admin/seed" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-brand-900">Reset sample products</Link>
          <Link to="/admin/products" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-brand-900">Products</Link>
        </div>
      </div>
    </div>
  )
}
```

**11.6** Create `src/pages/admin/ManageAdmins.jsx`. The owner makes a registered user an admin by email, or removes admin access. Other admins can see the list but not change it:

```jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { findUserByEmail, getStaff, setUserRole } from '../../services/adminService'
import { authErrorMessage } from '../../services/authService'

export default function ManageAdmins() {
  const { user, isOwner } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  function load() {
    return getStaff()
      .then((list) => setStaff(list.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0))))
      .catch(() => setMessage({ type: 'error', text: 'Could not load the admin list.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function makeAdmin(e) {
    e.preventDefault()
    setMessage(null)
    if (!email.trim()) return setMessage({ type: 'error', text: 'Enter an email address.' })
    setBusy(true)
    try {
      const found = await findUserByEmail(email)
      if (!found) {
        setMessage({ type: 'error', text: 'No registered account uses that email. Ask the person to create an account first.' })
      } else if (found.role !== 'customer') {
        setMessage({ type: 'error', text: `${found.fullName} already has staff access.` })
      } else {
        await setUserRole(found.id, 'admin')
        setMessage({ type: 'success', text: `${found.fullName} is now an admin.` })
        setEmail('')
        await load()
      }
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function removeAdmin(person) {
    if (!window.confirm(`Remove admin access from ${person.fullName}?`)) return
    setMessage(null)
    try {
      await setUserRole(person.id, 'customer')
      setMessage({ type: 'success', text: `${person.fullName} is no longer an admin.` })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Manage admins</h1>
        <p className="text-sm text-slate-600">Only the owner can add or remove admins.</p>
      </div>

      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}

      {isOwner && (
        <form onSubmit={makeAdmin} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="min-w-64 flex-1 text-sm font-semibold text-slate-700">
            Registered user's email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal"
            />
          </label>
          <button disabled={busy} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Checking...' : 'Make admin'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="4" className="px-5 py-4 text-slate-500">Loading...</td></tr>
            )}
            {staff.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 font-semibold">{p.fullName}</td>
                <td className="px-5 py-3 text-slate-600">{p.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.role === 'owner' ? 'bg-amber-100 text-amber-900' : 'bg-brand-50 text-brand-700'}`}>
                    {p.role === 'owner' ? 'Owner' : 'Admin'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {p.id === user?.uid ? (
                    <span className="text-slate-500">You</span>
                  ) : isOwner && p.role === 'admin' ? (
                    <button onClick={() => removeAdmin(p)} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50">
                      Remove admin
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

If ESLint underlines `load()` inside `useEffect` with a warning, you can ignore it: it's a style rule, and the page works.

**Push:** `git commit -m "Add Admin portal: owner setup, admin login, dashboard and manage admins"`.

## Step 12: Routes, clean-up, final test

**12.1** Replace everything in `src/App.jsx`. Shop pages sit inside the shop layout; login, register and the whole Admin portal sit outside it, so they have their own look:

```jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Collection from './pages/Collection'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ComingSoon from './pages/ComingSoon'
import AdminLogin from './pages/admin/AdminLogin'
import AdminSetup from './pages/admin/AdminSetup'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageAdmins from './pages/admin/ManageAdmins'
import AdminSeed from './pages/admin/AdminSeed'

export default function App() {
  return (
    <Routes>
      {/* Shop: header and footer on every page */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Collection />} />
        <Route path="/category/:categoryId" element={<Collection />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route
          path="/cart"
          element={<ProtectedRoute><ComingSoon title="Your cart" text="The cart and cash-on-delivery checkout arrive in Sprint 3." /></ProtectedRoute>}
        />
        <Route path="/squad-orders" element={<ComingSoon title="Squad orders" text="Order matching kits for your whole team with one join code. Coming in Sprint 4." />} />
        <Route path="/size-guide" element={<ComingSoon title="Size guide" text="Find your size from your height and weight. Coming in Sprint 4." />} />
        <Route path="*" element={<ComingSoon title="Page not found" text="We couldn't find that page." />} />
      </Route>

      {/* Customer sign-in pages: split-screen design, no shop header */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin portal */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/setup" element={<AdminSetup />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="admins" element={<ManageAdmins />} />
        <Route path="seed" element={<AdminSeed />} />
        <Route path="products" element={<ComingSoon title="Products" text="Adding and editing products comes next in Module 3." back="/admin" />} />
        <Route path="categories" element={<ComingSoon title="Categories" text="Managing categories comes next in Module 3." back="/admin" />} />
        <Route path="orders" element={<ComingSoon title="Orders" text="Orders appear here once checkout is built in Sprint 3." back="/admin" />} />
      </Route>
    </Routes>
  )
}
```

**12.2** Delete the old pages the new ones replace. Right-click each in VS Code → **Delete**:

- `src/pages/Products.jsx` (replaced by `Collection.jsx`)
- `src/pages/Admin.jsx` (replaced by `admin/AdminDashboard.jsx`)

**12.3** Remove the admin you made by hand, and create the owner the new way. Your teacher said admin roles must not be set in the database, so this is the last time you touch roles in Firebase:

1. In Firebase → **Authentication → Users**, find the account you made admin by hand (for example `mahmud@gmail.com`). Click **⋮ → Delete account**.
2. In **Firestore → users**, delete that account's document too.
3. On your site, open `localhost:5173/admin/setup`. Create the **owner**: for example name `Shop Owner`, email `owner@kithuddle.com`, a phone and a password. You land on the Admin dashboard.
4. Open `localhost:5173/admin/setup` again: it now says **Setup is already complete**.
5. To add staff: log out of the admin portal, register a normal account on the shop (for example `staff@kithuddle.com`), log back in as the owner, open **Admins**, type that email and click **Make admin**.

**12.4** Final test, on a laptop and at phone width:

| # | Test | Expect |
| --- | --- | --- |
| 1 | Open `/` | Header with logo, categories and Filter; two offer banners; three sport rows |
| 2 | Click **Football**, then **Jerseys** | 3 jerseys at sale prices with −20% |
| 3 | **Filter**: Cricket, max 1000 | Cricket Jersey only |
| 4 | Search “bat” | English Willow Bat and Batting Gloves |
| 5 | Account icon while logged out | Split-screen login page |
| 6 | **Sign in** with empty fields | Red errors under both fields |
| 7 | Log in as a customer | Back on the shop, your initial in the account icon |
| 8 | Log in at `/login` as the owner | "This is a staff account. Please sign in through the Admin portal." |
| 9 | Log in at `/admin/login` as a customer | "This account does not have admin access..." |
| 10 | Log in at `/admin/login` as the owner | Dashboard with counts and the Owner badge |
| 11 | **Admins** → Make admin by email | Person appears in the table as Admin |
| 12 | Log in as that new admin | Dashboard opens; Admins page has no Make admin form |
| 13 | **Continue as a guest** | Home page, browsing works without an account |
| 14 | Customer types `/admin` | Sent to the Admin portal login |

**12.5** Push the finished redesign and tag it:

```powershell
git add .
git commit -m "Wire up new routes, separate admin portal and remove old pages"
git push
```

**What to tell your teacher:** customers and staff now use separate portals, each checking the role after sign-in; the owner account is created once through a locked setup page; admins are added and removed by the owner on the website; and Firestore security rules enforce every role change on Google's servers, so nobody can make themselves an admin.

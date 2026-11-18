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

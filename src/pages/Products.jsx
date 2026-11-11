import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { getCategories, getProducts } from '../services/productService'

const input = 'w-full rounded border bg-white px-3 py-2'
const EMPTY_FILTERS = { search: '', category: 'all', minPrice: '', maxPrice: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
      })
      .catch(() => setError('Could not load products. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [])

  const update = (e) => setFilters({ ...filters, [e.target.name]: e.target.value })
  const categoryName = (id) => categories.find((c) => c.id === id)?.name || ''

  // Keep only the products that match every filter
  const search = filters.search.trim().toLowerCase()
  const min = filters.minPrice === '' ? 0 : Number(filters.minPrice)
  const max = filters.maxPrice === '' ? Infinity : Number(filters.maxPrice)

  const shown = products.filter(
    (p) =>
      (search === '' || p.name.toLowerCase().includes(search)) &&
      (filters.category === 'all' || p.categoryId === filters.category) &&
      p.price >= min &&
      p.price <= max,
  )

  const isFiltered =
    filters.search !== '' || filters.category !== 'all' || filters.minPrice !== '' || filters.maxPrice !== ''

  if (loading) return <p className="text-gray-500">Loading products...</p>
  if (error) return <p className="rounded bg-red-50 p-4 text-red-700">{error}</p>

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Shop</h1>

      <div className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          name="search"
          placeholder="Search products..."
          value={filters.search}
          onChange={update}
          className={input}
        />
        <select name="category" value={filters.category} onChange={update} className={input}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          name="minPrice"
          type="number"
          min="0"
          placeholder="Min price (৳)"
          value={filters.minPrice}
          onChange={update}
          className={input}
        />
        <input
          name="maxPrice"
          type="number"
          min="0"
          placeholder="Max price (৳)"
          value={filters.maxPrice}
          onChange={update}
          className={input}
        />
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <span>{shown.length} of {products.length} products</span>
        {isFiltered && (
          <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-blue-600 underline">
            Clear filters
          </button>
        )}
      </div>

      {min > max && (
        <p className="mb-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
          The minimum price is higher than the maximum price.
        </p>
      )}

      {shown.length === 0 ? (
        <p className="rounded bg-white p-6 text-center text-gray-500 shadow-sm">
          No products match your search. Try other words or clear the filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} categoryName={categoryName(p.categoryId)} />
          ))}
        </div>
      )}
    </div>
  )
}

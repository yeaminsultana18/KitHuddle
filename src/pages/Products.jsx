import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { getCategories, getProducts } from '../services/productService'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load products and categories at the same time
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
      })
      .catch(() => setError('Could not load products. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [])

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || ''

  if (loading) return <p className="text-gray-500">Loading products...</p>
  if (error) return <p className="rounded bg-red-50 p-4 text-red-700">{error}</p>

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Shop</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} categoryName={categoryName(p.categoryId)} />
          ))}
        </div>
      )}
    </div>
  )
}
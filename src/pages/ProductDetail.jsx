import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatPrice, getCategories, getProduct } from '../services/productService'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [size, setSize] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    Promise.all([getProduct(id), getCategories()])
      .then(([p, cats]) => {
        setProduct(p)
        if (p) setCategoryName(cats.find((c) => c.id === p.categoryId)?.name || '')
      })
      .catch(() => setError('Could not load this product. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-gray-500">Loading product...</p>
  if (error) return <p className="rounded bg-red-50 p-4 text-red-700">{error}</p>

  if (!product) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h1 className="mb-2 text-xl font-semibold">Product not found</h1>
        <Link to="/products" className="text-blue-600 underline">Back to the shop</Link>
      </div>
    )
  }

  const outOfStock = product.stock <= 0

  function handleAddToCart() {
    if (!user) {
      // Not logged in: go to login, then come back to this product
      return navigate('/login', { state: { from: location.pathname } })
    }
    if (!size) return setNote('Please choose a size first.')
    setNote(`You chose size ${size}. The cart is added in Module 4.`)
  }

  return (
    <div>
      <Link to="/products" className="mb-4 inline-block text-sm text-blue-600 underline">
        ← Back to the shop
      </Link>

      <div className="grid gap-6 rounded-lg bg-white p-4 shadow md:grid-cols-2 md:p-6">
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img src={product.imageUrls?.[0]} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            {categoryName} · {product.brand}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-bold text-blue-700">{formatPrice(product.price)}</p>

          <p className={`mt-2 text-sm font-medium ${outOfStock ? 'text-red-600' : 'text-green-700'}`}>
            {outOfStock ? 'Out of stock' : `In stock: ${product.stock} left`}
          </p>

          <p className="mt-4 text-gray-700">{product.description}</p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Choose a size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => {
                    setSize(s)
                    setNote('')
                  }}
                  className={`rounded border px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                    size === s ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white hover:border-blue-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="mt-6 w-full rounded bg-blue-600 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {outOfStock ? 'Out of stock' : user ? 'Add to cart' : 'Log in to add to cart'}
          </button>

          {note && <p className="mt-3 text-sm text-gray-700">{note}</p>}
        </div>
      </div>
    </div>
  )
}
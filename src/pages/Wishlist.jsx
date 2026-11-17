import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import { getWishlist, removeFromWishlist } from '../services/wishlistService'

export default function Wishlist() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getWishlist(user.uid)
      .then(setProducts)
      .catch(() => setError('Could not load your wishlist. Refresh the page.'))
      .finally(() => setLoading(false))
  }, [user.uid])

  async function handleRemove(product) {
    try {
      await removeFromWishlist(user.uid, product.id)
      setProducts(products.filter((p) => p.id !== product.id))
    } catch {
      setError('Could not remove it. Try again.')
    }
  }

  return (
    <div>
      <h1 className="font-display text-5xl tracking-wide text-brand-900">My wishlist</h1>
      <p className="mb-6 text-slate-600">
        {products.length} saved {products.length === 1 ? 'item' : 'items'}. Tap the heart on any product to save it.
      </p>

      {loading && <p className="text-slate-500">Loading...</p>}
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!loading && products.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="text-slate-600">Nothing saved yet.</p>
          <Link to="/products" className="mt-3 inline-block font-semibold text-brand-600 underline">Browse products</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            <ProductCard product={p} />
            <button
              type="button"
              onClick={() => handleRemove(p)}
              className="rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:border-red-300 hover:text-red-700"
            >
              Remove from wishlist
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

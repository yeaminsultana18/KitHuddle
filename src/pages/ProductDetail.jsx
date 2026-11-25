import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatPrice, getCategories, getProduct, isOnSale, salePrice, stockOfSize } from '../services/productService'
import { addToWishlist, isInWishlist, removeFromWishlist } from '../services/wishlistService'
import { chartFor } from '../services/sizeService'
import SizeAdvisor from '../components/SizeAdvisor'
import TryOnModal from '../components/TryOnModal'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [size, setSize] = useState('')
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)
  const [saved, setSaved] = useState(false) // in the wishlist?
  const [showAdvisor, setShowAdvisor] = useState(false)
  const [showTryOn, setShowTryOn] = useState(false) // Module 7: the try-on window is open
  // useCallback keeps the same function between renders, so the window doesn't re-run its setup
  const closeTryOn = useCallback(() => setShowTryOn(false), [])

  useEffect(() => {
    Promise.all([getProduct(id), getCategories()])
      .then(([p, cats]) => {
        setProduct(p)
        if (p) setCategoryName(cats.find((c) => c.id === p.categoryId)?.name || '')
      })
      .catch(() => setError('Could not load this product. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user) isInWishlist(user.uid, id).then(setSaved).catch(() => {})
  }, [user, id])

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
  const soldOut = (s) => stockOfSize(product, s) <= 0
  const leftInSize = size ? stockOfSize(product, size) : null

  function pickSize(s) {
    setNote('')
    setAdded(false)
    if (soldOut(s)) {
      setSize('')
      return setNote(`Size ${s} is sold out.`)
    }
    setSize(s)
  }

  async function toggleWishlist() {
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    try {
      if (saved) await removeFromWishlist(user.uid, product.id)
      else await addToWishlist(user.uid, product.id)
      setSaved(!saved)
    } catch {
      setNote('Could not update your wishlist. Try again.')
    }
  }

  function handleAddToCart() {
    if (!user) {
      // Not logged in: go to login, then come back to this product
      return navigate('/login', { state: { from: location.pathname } })
    }
    if (!size) {
      setAdded(false)
      return setNote('Please choose a size first.')
    }
    if (soldOut(size)) {
      setAdded(false)
      return setNote(`Size ${size} is sold out.`)
    }
    const result = addToCart(product, size, salePrice(product))
    setAdded(result.ok)
    setNote(result.message)
  }

  return (
    <div>
      <Link to="/products" className="mb-4 inline-block text-sm text-blue-600 underline">
        ← Back to the shop
      </Link>

      <div className="grid gap-6 rounded-lg bg-white p-4 shadow md:grid-cols-2 md:p-6">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img src={product.imageUrls?.[0]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {/* Module 7: only products with a try-on picture get the button (hasTryOn is set by the admin page) */}
          {product.hasTryOn && (
            <button
              type="button"
              onClick={() => setShowTryOn(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-brand-600 py-3 font-semibold text-brand-700 hover:bg-brand-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Try it on
            </button>
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            {categoryName} · {product.brand}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <button
              type="button"
              onClick={toggleWishlist}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-pressed={saved}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 hover:border-brand-600"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="text-brand-600" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-600">{formatPrice(salePrice(product))}</span>
            {isOnSale(product) && (
              <>
                <span className="text-lg text-slate-500 line-through">{formatPrice(product.price)}</span>
                <span className="rounded bg-gold px-2 py-0.5 text-sm font-bold text-amber-950">−{product.salePercent}%</span>
              </>
            )}
          </p>

          <p className={`mt-2 text-sm font-medium ${outOfStock ? 'text-red-600' : 'text-green-700'}`}>
            {outOfStock ? 'Out of stock' : `In stock: ${product.stock} left`}
          </p>

          <p className="mt-4 text-gray-700">{product.description}</p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Choose a size</p>
              {chartFor(product) && (
                <button type="button" onClick={() => setShowAdvisor(!showAdvisor)} aria-expanded={showAdvisor} className="text-sm font-medium text-brand-600 underline">
                  {showAdvisor ? 'Hide size advisor' : 'Find my size'}
                </button>
              )}
            </div>
            {showAdvisor && (
              <div className="mb-4 rounded-xl border border-slate-200 p-4">
                <SizeAdvisor
                  product={product}
                  onPick={(s) => {
                    pickSize(s)
                    setShowAdvisor(false)
                  }}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={outOfStock || soldOut(s)}
                  onClick={() => pickSize(s)}
                  aria-label={soldOut(s) ? `${s}, sold out` : s}
                  title={soldOut(s) ? 'Sold out' : undefined}
                  className={`rounded border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:line-through ${
                    size === s ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white hover:border-blue-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {leftInSize > 0 && (
              <p className={`mt-2 text-sm font-medium ${leftInSize <= 3 ? 'text-amber-700' : 'text-green-700'}`}>
                Only {leftInSize} left in {size}
              </p>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="mt-6 w-full rounded bg-blue-600 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {outOfStock ? 'Out of stock' : user ? 'Add to cart' : 'Log in to add to cart'}
          </button>

          {note && (
            <p role="status" className={`mt-3 text-sm ${added ? 'text-green-700' : 'text-gray-700'}`}>
              {note}{' '}
              {added && <Link to="/cart" className="font-semibold text-brand-600 underline">View cart</Link>}
            </p>
          )}
        </div>
      </div>

      {showTryOn && <TryOnModal product={product} onClose={closeTryOn} />}
    </div>
  )
}
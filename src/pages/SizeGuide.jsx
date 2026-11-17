import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SizeAdvisor from '../components/SizeAdvisor'
import { getProducts } from '../services/productService'
import { chartFor } from '../services/sizeService'

export default function SizeGuide() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getProducts()
      .then((list) => {
        const withCharts = list.filter((p) => chartFor(p))
        setProducts(withCharts)
        if (withCharts[0]) setProductId(withCharts[0].id)
      })
      .catch(() => setError('Could not load the products. Refresh the page.'))
  }, [])

  const product = products.find((p) => p.id === productId)

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-5xl tracking-wide text-brand-900">Size guide</h1>
      <p className="mb-6 text-slate-600">Enter your height and weight and we'll suggest a size. Each product has its own chart.</p>

      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <label className="block max-w-sm text-sm font-semibold text-slate-700">
          Product
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal">
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        {/* key: start fresh when the product changes */}
        {product && <SizeAdvisor key={product.id} product={product} />}
        {product && (
          <Link to={`/products/${product.id}`} className="inline-block font-semibold text-brand-600 underline">
            Go to {product.name}
          </Link>
        )}
      </div>
    </div>
  )
}

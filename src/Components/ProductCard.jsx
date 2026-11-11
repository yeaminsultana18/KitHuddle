import { Link } from 'react-router-dom'
import { formatPrice } from '../services/productService'

export default function ProductCard({ product, categoryName }) {
  const outOfStock = product.stock <= 0

  return (
    <Link
      to={`/products/${product.id}`}
      className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.imageUrls?.[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          {categoryName} · {product.brand}
        </p>
        <h2 className="mt-1 font-semibold group-hover:text-blue-700">{product.name}</h2>
        <p className="mt-1 text-lg font-bold text-blue-700">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
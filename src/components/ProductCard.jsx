import { Link } from 'react-router-dom'
import { formatPrice, isOnSale, salePrice } from '../services/productService'

export default function ProductCard({ product }) {
  const outOfStock = product.stock <= 0
  const onSale = isOnSale(product)

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

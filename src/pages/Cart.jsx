import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../services/productService'

export default function Cart() {
  const { items, count, total, changeQuantity, canIncrease, removeFromCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-brand-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-600">Find a kit you like and add it here.</p>
        <Link to="/products" className="mt-6 inline-block rounded-xl bg-brand-900 px-6 py-3 font-semibold text-white">
          Start shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-5xl tracking-wide text-brand-900">Your cart</h1>
      <p className="mb-6 text-slate-600">{count} {count === 1 ? 'item' : 'items'}</p>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Cart lines */}
        <ul className="flex flex-1 flex-col gap-3">
          {items.map((item) => (
            <li key={item.key} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Link to={`/products/${item.productId}`} className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
              </Link>

              <div className="min-w-0 flex-1">
                <Link to={`/products/${item.productId}`} className="font-semibold hover:text-brand-600">{item.name}</Link>
                <p className="text-sm text-slate-600">Size {item.size} · {formatPrice(item.unitPrice)} each</p>
                {!canIncrease(item.key) && (
                  <p className="text-xs font-medium text-amber-700">
                    {item.perSize ? `Only ${item.stock} left in size ${item.size}` : `Only ${item.stock} in stock`}
                  </p>
                )}
                <button type="button" onClick={() => removeFromCart(item.key)} className="mt-2 text-sm text-red-700 hover:underline">
                  Remove
                </button>
              </div>

              <div className="flex items-center rounded-full border border-slate-300">
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${item.name}`}
                  onClick={() => changeQuantity(item.key, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-11 w-11 text-xl text-brand-900 disabled:opacity-30"
                >
                  −
                </button>
                <span className="min-w-7 text-center font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${item.name}`}
                  onClick={() => changeQuantity(item.key, item.quantity + 1)}
                  disabled={!canIncrease(item.key)}
                  className="h-11 w-11 text-xl text-brand-900 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <p className="min-w-24 text-right text-lg font-bold text-brand-900">{formatPrice(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 lg:w-80">
          <h2 className="mb-4 text-lg font-semibold text-brand-900">Order summary</h2>
          <div className="mb-2 flex justify-between text-slate-600">
            <span>Subtotal ({count} items)</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mb-4 flex justify-between text-slate-600">
            <span>Payment</span>
            <span>Cash on delivery</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-bold text-brand-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link to="/checkout" className="mt-5 block rounded-xl bg-brand-900 py-3.5 text-center font-semibold text-white hover:bg-brand-700">
            Go to checkout
          </Link>
          <Link to="/products" className="mt-3 block text-center text-sm text-brand-600 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}

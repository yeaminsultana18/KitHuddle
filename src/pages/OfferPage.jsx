import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OfferBanner from '../components/OfferBanner'
import ProductCard from '../components/ProductCard'
import { formatDates } from '../components/offerLooks'
import { getOffer, todayString } from '../services/offerService'
import { getProduct } from '../services/productService'

// /offers/:offerId: the page the Home banner opens. Shows the offer's banner and its products.
export default function OfferPage() {
  const { offerId } = useParams()
  const [offer, setOffer] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOffer(offerId)
      .then(async (o) => {
        setOffer(o)
        if (!o) return
        // Read only this offer's products (not the whole catalog).
        // getProduct gives null for a product that was deleted later, so those are left out.
        const found = await Promise.all((o.productIds || []).map(getProduct))
        setProducts(found.filter(Boolean))
      })
      .catch(() => setError('Could not load this offer. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [offerId])

  if (loading) return <p className="text-slate-500">Loading offer...</p>
  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>

  if (!offer) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h1 className="mb-2 text-xl font-semibold">Offer not found</h1>
        <Link to="/products" className="text-brand-600 underline">Back to the shop</Link>
      </div>
    )
  }

  // The products' prices already follow the sale (see isOnSale), this note just explains why
  const today = todayString()
  let note = null
  if (!offer.active || today > offer.endDate) note = 'This offer has ended, so these products are at their normal price.'
  else if (today < offer.startDate) note = `This offer starts soon: ${formatDates(offer.startDate, offer.endDate)}.`

  return (
    <div className="space-y-8">
      <OfferBanner offer={offer} wide preview showButton={false} />

      <div>
        <h1 className="font-display text-5xl tracking-wide text-brand-900">{offer.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {products.length} {products.length === 1 ? 'product' : 'products'}
          {offer.discount > 0 && ` · ${offer.discount}% off`}
          {' · '}
          {formatDates(offer.startDate, offer.endDate)}
        </p>
        {note && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{note}</p>}
      </div>

      {products.length === 0 ? (
        <p className="text-slate-500">
          No products in this offer yet. <Link to="/products" className="text-brand-600 underline">See all products</Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

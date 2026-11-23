import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  OFFER_COLORS,
  getOffers,
  imageSizeKB,
  removeOffer,
  saveOffer,
  setOfferActive,
  shrinkImage,
  todayString,
} from '../../services/offerService'
import { authErrorMessage } from '../../services/authService'
import { formatPrice, getProducts } from '../../services/productService'
import useCategories from '../../hooks/useCategories'
import OfferBanner from '../../components/OfferBanner'
import { COLOR_LOOKS } from '../../components/offerLooks'

// What the form shows when nothing is being edited
const EMPTY_FORM = {
  title: '',
  subtitle: '',
  discount: '', // Sale % given to every chosen product
  productIds: [], // the chosen products
  startDate: '',
  endDate: '',
  active: true,
  image: '', // the banner photo as a data URL, or '' for no photo
  color: 'blue', // used when there is no photo
}

// Shown in the Status column
function offerStatus(offer) {
  const today = todayString()
  if (!offer.active) return ['Off', 'bg-slate-100 text-slate-600']
  if (today < offer.startDate) return ['Starts later', 'bg-amber-100 text-amber-900']
  if (today > offer.endDate) return ['Ended', 'bg-slate-100 text-slate-600']
  return ['Showing now', 'bg-green-50 text-green-800']
}

// The products already in a switched-on offer, as { productId: 'Offer title' }.
// A product can be in only one switched-on offer, otherwise two offers would fight over its Sale %.
// `exceptId` = the offer being edited (its own products are not "taken").
function takenProducts(offers, exceptId) {
  const taken = {}
  offers
    .filter((o) => o.active && o.id !== exceptId)
    .forEach((o) => (o.productIds || []).forEach((id) => (taken[id] = o.title)))
  return taken
}

export default function AdminOffers() {
  const categories = useCategories()
  const [offers, setOffers] = useState([])
  const [products, setProducts] = useState(null) // null = still loading
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null) // null = adding a new offer
  const [busy, setBusy] = useState(false)
  const [shrinking, setShrinking] = useState(false) // true while a photo is being made smaller
  const [message, setMessage] = useState(null)

  function load() {
    return getOffers()
      .then(setOffers)
      .catch(() => setMessage({ type: 'error', text: 'Could not load the offers.' }))
      .finally(() => setLoading(false))
  }

  function loadProducts() {
    return getProducts()
      .then(setProducts)
      .catch(() => setMessage({ type: 'error', text: 'Could not load the products. Refresh the page before changing offers.' }))
  }

  useEffect(() => {
    load()
    loadProducts()
  }, [])

  // Our own messages have no code; Firebase errors do
  const errorText = (err) => (err.code ? authErrorMessage(err) : err.message)

  // An offer may still list a product that was deleted later. Saving a sale on a missing product
  // would make the whole batch fail, so we only ever use ids of products that still exist.
  const existing = (ids = []) => ids.filter((id) => products.some((p) => p.id === id))
  const productName = (id) => products?.find((p) => p.id === id)?.name || 'A product'

  // If any of these products is in another switched-on offer, returns the error text; otherwise null
  function clashText(productIds, offerId) {
    const taken = takenProducts(offers, offerId)
    const clash = productIds.find((id) => taken[id])
    return clash ? `${productName(clash)} is already in the offer "${taken[clash]}". Untick it or turn that offer off first.` : null
  }

  // One change handler for every box in the form
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  function startEdit(offer) {
    setEditingId(offer.id)
    setForm({
      title: offer.title,
      subtitle: offer.subtitle,
      // Offers made before this change have no discount or products
      discount: offer.discount ? String(offer.discount) : '',
      productIds: offer.productIds || [],
      startDate: offer.startDate,
      endDate: offer.endDate,
      active: offer.active,
      // Offers made before photos and colours existed have neither field
      image: offer.image || '',
      color: offer.color || 'blue',
    })
    setMessage(null)
  }

  // The admin picked a photo: shrink it, then keep it in the form (it is saved with the offer)
  async function handlePhoto(e) {
    const file = e.target.files[0]
    e.target.value = '' // so choosing the same file again still works
    if (!file) return
    setMessage(null)
    setShrinking(true)
    try {
      const image = await shrinkImage(file)
      setForm((f) => ({ ...f, image }))
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setShrinking(false)
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    if (!products) return // products not loaded yet

    // Same rule as Sale % on the Products page, but 0 makes no sense for an offer
    const discount = Number(form.discount)
    if (!Number.isInteger(discount) || discount < 1 || discount > 90) {
      setMessage({ type: 'error', text: 'Discount % must be a whole number from 1 to 90.' })
      return
    }
    const productIds = existing(form.productIds)
    if (productIds.length === 0) {
      setMessage({ type: 'error', text: 'Choose at least one product for this offer.' })
      return
    }
    if (form.endDate < form.startDate) {
      setMessage({ type: 'error', text: 'The end date cannot be before the start date.' })
      return
    }
    const clash = form.active && clashText(productIds, editingId)
    if (clash) {
      setMessage({ type: 'error', text: clash })
      return
    }

    const data = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      discount,
      productIds,
      startDate: form.startDate,
      endDate: form.endDate,
      active: form.active,
      image: form.image,
      color: form.color,
    }
    // The products the offer had before, so the unticked ones lose the sale
    const oldIds = editingId ? existing(offers.find((o) => o.id === editingId)?.productIds) : []

    setBusy(true)
    try {
      await saveOffer(editingId, data, oldIds)
      setMessage({ type: 'success', text: `${data.title} ${editingId ? 'saved' : 'added'}.` })
      cancelEdit()
      await Promise.all([load(), loadProducts()])
    } catch (err) {
      setMessage({ type: 'error', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(offer) {
    setMessage(null)
    if (!products) return
    const ids = existing(offer.productIds)
    const clash = !offer.active && clashText(ids, offer.id)
    if (clash) {
      setMessage({ type: 'error', text: clash })
      return
    }
    try {
      await setOfferActive(offer, !offer.active, ids)
      await Promise.all([load(), loadProducts()])
    } catch (err) {
      setMessage({ type: 'error', text: errorText(err) })
    }
  }

  async function handleDelete(offer) {
    if (!window.confirm(`Delete the offer "${offer.title}"? Its products go back to their normal price.`)) return
    setMessage(null)
    if (!products) return
    try {
      await removeOffer(offer, existing(offer.productIds))
      if (editingId === offer.id) cancelEdit()
      setMessage({ type: 'success', text: `${offer.title} deleted.` })
      await Promise.all([load(), loadProducts()])
    } catch (err) {
      setMessage({ type: 'error', text: errorText(err) })
    }
  }

  const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal'
  const labelClass = 'text-sm font-semibold text-slate-700'

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Offers</h1>
      </div>

      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-brand-900 sm:col-span-2">{editingId ? 'Edit offer' : 'New offer'}</h2>

        <label className={labelClass}>
          Title
          <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Basketball Week" className={inputClass} />
        </label>
        <label className={labelClass}>
          Subtitle
          <input name="subtitle" value={form.subtitle} onChange={handleChange} required placeholder="e.g. Up to 25% off" className={inputClass} />
        </label>
        <label className={labelClass}>
          Discount %
          <input
            type="number"
            name="discount"
            min="1"
            max="90"
            step="1"
            value={form.discount}
            onChange={handleChange}
            required
            placeholder="e.g. 25"
            className={inputClass}
          />
        </label>
        <div className="hidden sm:block" />{/* keeps the dates on their own row */}

        {/* Which products get the discount */}
        <div className="sm:col-span-2">
          <p className={labelClass}>Products</p>
          {products === null ? (
            <p className="mt-1.5 text-sm text-slate-500">Loading products...</p>
          ) : (
            <ProductPicker
              products={products}
              categories={categories}
              selected={form.productIds}
              taken={takenProducts(offers, editingId)}
              onChange={(productIds) => setForm((f) => ({ ...f, productIds }))}
            />
          )}
        </div>

        <label className={labelClass}>
          Start date
          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required className={inputClass} />
        </label>
        <label className={labelClass}>
          End date
          <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required min={form.startDate} className={inputClass} />
        </label>
        {/* Banner photo: chosen from the admin's computer, shrunk, then saved inside the offer */}
        <div className="text-sm sm:col-span-2">
          <p className="font-semibold text-slate-700">Banner photo (optional)</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 hover:border-brand-600">
              {shrinking ? 'Making it smaller...' : form.image ? 'Choose a different photo' : 'Choose a photo'}
              <input type="file" accept="image/*" onChange={handlePhoto} disabled={shrinking} className="sr-only" />
            </label>
            {form.image && (
              <>
                <span className="text-slate-500">{imageSizeKB(form.image)} KB</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: '' })}
                  className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                >
                  Remove photo
                </button>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP. It is made smaller (at most 1200px wide, under 300 KB) before saving.</p>
        </div>

        {/* Colour: used when there is no photo */}
        <fieldset className="text-sm sm:col-span-2">
          <legend className="font-semibold text-slate-700">
            Colour {form.image && <span className="font-normal text-slate-500">(used only if the photo is removed)</span>}
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {OFFER_COLORS.map((c) => (
              <label
                key={c}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${
                  form.color === c ? 'border-brand-600 ring-2 ring-brand-600/30' : 'border-slate-300'
                }`}
              >
                <input type="radio" name="color" value={c} checked={form.color === c} onChange={handleChange} className="sr-only" />
                <span className="h-5 w-5 rounded-full" style={{ backgroundImage: COLOR_LOOKS[c].background }} aria-hidden="true" />
                {COLOR_LOOKS[c].label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Preview: exactly how the banner will look on the Home page */}
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-semibold text-slate-700">Preview</p>
          <OfferBanner offer={form} wide preview />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
          <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="h-4 w-4 accent-brand-600" />
          Offer is on
        </label>

        <div className="flex gap-3 sm:col-span-2">
          <button disabled={busy || shrinking || products === null} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Saving...' : editingId ? 'Save changes' : 'Add offer'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-lg border border-slate-300 px-5 py-2.5 hover:border-brand-600">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Offer</th>
              <th className="px-5 py-3 font-semibold">Products</th>
              <th className="px-5 py-3 font-semibold">Dates</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="5" className="px-5 py-4 text-slate-500">Loading...</td></tr>
            )}
            {!loading && offers.length === 0 && (
              <tr><td colSpan="5" className="px-5 py-4 text-slate-500">No offers yet.</td></tr>
            )}
            {offers.map((o) => {
              const [statusText, statusClass] = offerStatus(o)
              const count = (o.productIds || []).length
              return (
                <tr key={o.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* A small photo, or a dot of the chosen colour */}
                      {o.image ? (
                        <img src={o.image} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                      ) : (
                        <span
                          className="h-10 w-14 shrink-0 rounded"
                          style={{ backgroundImage: (COLOR_LOOKS[o.color] || COLOR_LOOKS.blue).background }}
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <Link to={`/offers/${o.id}`} className="font-semibold hover:text-brand-600 hover:underline">{o.title}</Link>
                        <p className="text-slate-500">{o.subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {count} product{count === 1 ? '' : 's'}
                    {o.discount > 0 && <span className="ml-1 font-semibold text-amber-700">−{o.discount}%</span>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{o.startDate} to {o.endDate}</td>
                  <td className="px-5 py-3">
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{statusText}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <button onClick={() => handleToggle(o)} disabled={products === null} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:border-brand-600 disabled:opacity-60">
                      {o.active ? 'Turn off' : 'Turn on'}
                    </button>
                    <button onClick={() => startEdit(o)} className="ml-2 rounded-lg border border-slate-300 px-3 py-1.5 hover:border-brand-600">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(o)} disabled={products === null} className="ml-2 rounded-lg border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-60">
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// A dropdown of every product, grouped by category, with a search box and checkboxes.
// The chosen products are shown under it as tags with an × to remove them.
//   selected = array of chosen product ids, onChange(newArray) is called when it changes
//   taken    = { productId: 'Offer title' } for products in another switched-on offer (they can't be chosen)
function ProductPicker({ products, categories, selected, taken, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const boxRef = useRef(null)

  // Close the dropdown when the admin clicks anywhere outside it, or presses Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  // Search by name, brand or type (capital letters don't matter)
  const words = search.trim().toLowerCase()
  const matches = products.filter((p) =>
    [p.name, p.brand, p.type].some((text) => (text || '').toLowerCase().includes(words)),
  )

  // One group per category, then "Other" for products whose category no longer exists
  const groups = categories.map((c) => ({ name: c.name, items: matches.filter((p) => p.categoryId === c.id) }))
  groups.push({ name: 'Other', items: matches.filter((p) => !categories.some((c) => c.id === p.categoryId)) })

  const chosen = products.filter((p) => selected.includes(p.id))

  return (
    <div ref={boxRef} className="relative mt-1.5 text-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-left hover:border-brand-600"
      >
        <span>{chosen.length === 0 ? 'Choose products' : `${chosen.length} product${chosen.length === 1 ? '' : 's'} chosen`}</span>
        <span aria-hidden="true" className="text-slate-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              autoFocus
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {matches.length === 0 && <p className="px-3 py-2 text-slate-500">No products match.</p>}
            {groups
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div key={g.name}>
                  <p className="bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.name}</p>
                  {g.items.map((p) => {
                    const isChosen = selected.includes(p.id)
                    // A product in another switched-on offer can't be ticked (but can still be unticked)
                    const blocked = Boolean(taken[p.id]) && !isChosen
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 px-3 py-2 ${blocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-brand-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChosen}
                          disabled={blocked}
                          onChange={() => toggle(p.id)}
                          className="h-4 w-4 accent-brand-600"
                        />
                        <span className="flex-1">
                          {p.name}
                          <span className="ml-1 text-xs text-slate-500">{p.type ? `${p.type} · ` : ''}{formatPrice(p.price)}</span>
                        </span>
                        {taken[p.id] && <span className="text-xs font-semibold text-amber-700">in {taken[p.id]}</span>}
                      </label>
                    )
                  })}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* The chosen products as tags */}
      {chosen.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {chosen.map((p) => (
            <span key={p.id} className="flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-brand-900">
              {p.name}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                aria-label={`Remove ${p.name}`}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-brand-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

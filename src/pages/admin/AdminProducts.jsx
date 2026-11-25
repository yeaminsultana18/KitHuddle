import { useEffect, useRef, useState } from 'react'
import {
  addProduct,
  deleteProduct,
  formatPrice,
  getCategories,
  getProducts,
  isOnSale,
  placeholderImage,
  updateProduct,
} from '../../services/productService'
import { authErrorMessage } from '../../services/authService'
import { chartToText, textToChart } from '../../services/sizeService'
import {
  deleteTryOnImage,
  getTryOn,
  removeTryOnImage,
  saveTryOnImage,
  shrinkTryOnImage,
  tryOnSizeKB,
} from '../../services/tryOnService'
import { cleanFit, DEFAULT_FIT } from '../../components/tryOnFit'
import TryOnPreview from '../../components/TryOnPreview'

const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-normal'

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  type: '',
  brand: '',
  price: '',
  salePercent: '0',
  sizeStock: {}, // size -> count, as text while typing, e.g. { S: '5', M: '3' }
  sizes: 'S, M, L, XL',
  imageUrl: '',
  description: '',
  sizeChart: '',
}

// Turns a product from the database into form values (all text)
const productToForm = (p) => ({
  name: p.name || '',
  categoryId: p.categoryId || '',
  type: p.type || '',
  brand: p.brand || '',
  price: String(p.price ?? ''),
  salePercent: String(p.salePercent ?? 0),
  // Old products have no sizeStock: the boxes start empty and the admin splits the old total
  sizeStock: Object.fromEntries(Object.entries(p.sizeStock || {}).map(([size, count]) => [size, String(count)])),
  sizes: (p.sizes || []).join(', '),
  imageUrl: p.imageUrls?.[0] || '',
  description: p.description || '',
  sizeChart: chartToText(p.sizeChart),
})

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null) // { type: 'error' or 'success', text }

  const [editingId, setEditingId] = useState(null) // null = adding a new product
  const [form, setForm] = useState(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Module 7: the try-on picture is kept apart from `form`, because it lives in its own collection.
  // image: data URL or '' (none) · fit: the size and up/down settings saved with it
  // changed: the admin picked, removed or adjusted it, so it must be saved
  // loading: fetching the saved picture · shrinking: making a new picture smaller
  const NO_TRY_ON = { image: '', fit: DEFAULT_FIT, changed: false, loading: false, shrinking: false }
  const [tryOn, setTryOn] = useState(NO_TRY_ON)
  const editingRef = useRef(null) // which product the form shows, so a slow download can't land on the wrong one

  // The sizes typed in the Sizes field; there is one stock box for each
  const formSizes = form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
  function load() {
    return Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load the products.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || id
  const outOfStock = products.filter((p) => p.stock <= 0).length

  function startAdding() {
    setEditingId(null)
    editingRef.current = null
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' })
    setTryOn(NO_TRY_ON)
    setFormOpen(true)
    setMessage(null)
  }

  function startEditing(product) {
    setEditingId(product.id)
    editingRef.current = product.id
    setForm(productToForm(product))
    setFormOpen(true)
    setMessage(null)

    // Download the saved try-on picture only when the product has one
    setTryOn({ ...NO_TRY_ON, loading: !!product.hasTryOn })
    if (product.hasTryOn) {
      getTryOn(product.id)
        .then((saved) => {
          if (editingRef.current !== product.id) return // the admin has opened another product meanwhile
          setTryOn((t) => (t.changed ? t : { ...t, image: saved?.image || '', fit: cleanFit(saved?.fit), loading: false }))
        })
        .catch(() => setTryOn((t) => ({ ...t, loading: false })))
    }
  }

  // The admin picked a try-on PNG: shrink it and keep it until Save is clicked
  async function handleTryOnFile(e) {
    const file = e.target.files[0]
    e.target.value = '' // so choosing the same file again still works
    if (!file) return
    setMessage(null)
    setTryOn((t) => ({ ...t, shrinking: true }))
    try {
      const image = await shrinkTryOnImage(file)
      setTryOn((t) => ({ ...t, image, changed: true, loading: false, shrinking: false })) // keeps the fit settings
    } catch (err) {
      setTryOn((t) => ({ ...t, shrinking: false }))
      setMessage({ type: 'error', text: err.message })
    }
  }

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const updateSizeStock = (size, value) => setForm({ ...form, sizeStock: { ...form.sizeStock, [size]: value } })
  // A try-on fit slider moved: size (80–130%) or offsetY (−20 to 20%)
  const updateFit = (key, value) => setTryOn((t) => ({ ...t, fit: { ...t.fit, [key]: Number(value) }, changed: true }))

  async function handleSave(e) {
    e.preventDefault()
    setMessage(null)

    // Check the form
    const price = Number(form.price)
    const salePercent = Number(form.salePercent || 0)
    const sizes = formSizes
    if (!form.name.trim()) return setMessage({ type: 'error', text: 'Enter the product name.' })
    if (!form.categoryId) return setMessage({ type: 'error', text: 'Choose a category.' })
    if (!(price > 0)) return setMessage({ type: 'error', text: 'Price must be more than 0.' })
    if (!Number.isInteger(salePercent) || salePercent < 0 || salePercent > 90) {
      return setMessage({ type: 'error', text: 'Sale % must be a whole number from 0 to 90.' })
    }
    if (sizes.length === 0) return setMessage({ type: 'error', text: 'Enter at least one size.' })
    // The Firestore rules check at most 12 sizes when a customer orders, so a product can have no more
    if (sizes.length > 12) return setMessage({ type: 'error', text: 'A product can have at most 12 sizes.' })
    if (new Set(sizes).size !== sizes.length) return setMessage({ type: 'error', text: 'Each size must appear only once.' })

    // One stock count per size (only the sizes in the Sizes field are saved)
    const sizeStock = {}
    for (const size of sizes) {
      const text = String(form.sizeStock[size] ?? '').trim()
      const count = Number(text)
      if (text === '' || !Number.isInteger(count) || count < 0) {
        return setMessage({ type: 'error', text: `Stock for size ${size} must be a whole number, 0 or more.` })
      }
      sizeStock[size] = count
    }
    // The total is kept too, so badges and the dashboard still work
    const stock = Object.values(sizeStock).reduce((sum, n) => sum + n, 0)
    const parsed = textToChart(form.sizeChart)
    if (parsed.error) return setMessage({ type: 'error', text: parsed.error })

    const data = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      type: form.type.trim(),
      brand: form.brand.trim(),
      price: Math.round(price),
      salePercent,
      stock,
      sizeStock,
      sizes,
      imageUrls: [form.imageUrl.trim() || placeholderImage(form.name.trim())],
      description: form.description.trim(),
      sizeChart: parsed.chart, // empty = S/M/L/XL products use the default chart
    }

    setBusy(true)
    try {
      let id = editingId
      if (editingId) {
        await updateProduct(editingId, data)
        setMessage({ type: 'success', text: `${data.name} saved.` })
      } else {
        id = await addProduct(data)
        setMessage({ type: 'success', text: `${data.name} added to the shop.` })
      }

      // Then the try-on picture, only if the admin picked or removed one
      const hadTryOn = !!products.find((p) => p.id === id)?.hasTryOn
      if (tryOn.changed && (tryOn.image || hadTryOn)) {
        try {
          if (tryOn.image) await saveTryOnImage(id, tryOn.image, cleanFit(tryOn.fit))
          else await removeTryOnImage(id)
        } catch (err) {
          setMessage({ type: 'error', text: `${data.name} was saved, but the try-on image was not: ${authErrorMessage(err)}` })
        }
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete ${product.name}? Customers will no longer see it.`)) return
    setMessage(null)
    try {
      if (product.hasTryOn) await deleteTryOnImage(product.id) // first, so it never stays behind on its own
      await deleteProduct(product.id)
      if (editingId === product.id) setFormOpen(false)
      setMessage({ type: 'success', text: `${product.name} deleted.` })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Products</h1>
          <p className="text-sm text-slate-600">
            {products.length} products · {outOfStock} out of stock
          </p>
        </div>
        <button onClick={startAdding} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white">
          + Add product
        </button>
      </div>

      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        {/* Product table */}
        <div className="min-w-0 flex-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="5" className="px-4 py-4 text-slate-500">Loading...</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.brand}{p.type ? ` · ${p.type}` : ''}</p>
                    {p.hasTryOn && <p className="text-xs font-semibold text-brand-700">Try-on ready</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{categoryName(p.categoryId)}</td>
                  <td className="px-4 py-3">
                    {formatPrice(p.price)}
                    {isOnSale(p) && <span className="ml-1 text-xs font-semibold text-amber-700">−{p.salePercent}%</span>}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${p.stock <= 0 ? 'text-red-700' : 'text-green-800'}`}>
                    {p.stock <= 0 ? 'Out of stock' : p.stock}
                    {p.sizeStock && (
                      <p className="text-xs font-normal text-slate-500">
                        {(p.sizes || []).map((s) => `${s} ${p.sizeStock[s] ?? 0}`).join(' · ')}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => startEditing(p)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:border-brand-600">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} className="ml-2 rounded-lg border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add / edit form */}
        {formOpen && (
          <form onSubmit={handleSave} noValidate className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 xl:w-96">
            <h2 className="font-semibold text-brand-900">{editingId ? `Edit: ${form.name}` : 'Add a product'}</h2>
            <label className="block text-sm font-semibold text-slate-700">
              Name
              <input name="name" value={form.name} onChange={update} className={input} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">
                Category
                <select name="categoryId" value={form.categoryId} onChange={update} className={input}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Type
                <input name="type" value={form.type} onChange={update} placeholder="Jerseys" className={input} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Price (৳)
                <input name="price" type="number" min="1" value={form.price} onChange={update} className={input} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Sale %
                <input name="salePercent" type="number" min="0" max="90" value={form.salePercent} onChange={update} className={input} />
              </label>
              <label className="col-span-2 block text-sm font-semibold text-slate-700">
                Brand
                <input name="brand" value={form.brand} onChange={update} className={input} />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Sizes (comma separated)
              <input name="sizes" value={form.sizes} onChange={update} className={input} />
            </label>
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">Stock per size</legend>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {formSizes.map((size) => (
                  <label key={size} className="block text-xs font-semibold text-slate-600">
                    {size}
                    <input
                      type="number"
                      min="0"
                      value={form.sizeStock[size] ?? ''}
                      onChange={(e) => updateSizeStock(size, e.target.value)}
                      className={input}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Total: {formSizes.reduce((sum, s) => sum + (Number(form.sizeStock[s]) || 0), 0)}
              </p>
            </fieldset>
            <label className="block text-sm font-semibold text-slate-700">
              Image link (optional)
              <input name="imageUrl" value={form.imageUrl} onChange={update} placeholder="https://..." className={input} />
            </label>
            {/* Module 7: the see-through jersey picture for the virtual try-on */}
            <div className="text-sm">
              <p className="font-semibold text-slate-700">Try-on image (optional)</p>
              {tryOn.loading ? (
                <p className="mt-1 text-slate-500">Loading...</p>
              ) : (
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  {tryOn.image && (
                    // Live preview on a dummy body, with the same fitting as the real try-on, plus the fit settings
                    <div className="flex w-full items-start gap-3">
                      <TryOnPreview image={tryOn.image} fit={tryOn.fit} />
                      <div className="min-w-0 flex-1 space-y-3">
                        <label className="block text-xs font-semibold text-slate-600">
                          Size: {tryOn.fit.size}%
                          <input
                            type="range"
                            min="80"
                            max="130"
                            step="1"
                            value={tryOn.fit.size}
                            onChange={(e) => updateFit('size', e.target.value)}
                            className="mt-1 w-full accent-brand-600"
                          />
                        </label>
                        <label className="block text-xs font-semibold text-slate-600">
                          Move: {tryOn.fit.offsetY === 0 ? 'centred' : `${Math.abs(tryOn.fit.offsetY)}% ${tryOn.fit.offsetY < 0 ? 'up' : 'down'}`}
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            step="1"
                            value={tryOn.fit.offsetY}
                            onChange={(e) => updateFit('offsetY', e.target.value)}
                            className="mt-1 w-full accent-brand-600"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setTryOn((t) => ({ ...t, fit: DEFAULT_FIT, changed: true }))}
                          className="text-xs font-semibold text-brand-600 underline"
                        >
                          Reset fit
                        </button>
                      </div>
                    </div>
                  )}
                  <label className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 hover:border-brand-600">
                    {tryOn.shrinking ? 'Making it smaller...' : tryOn.image ? 'Choose a different PNG' : 'Choose a PNG'}
                    <input type="file" accept="image/png,image/webp" onChange={handleTryOnFile} disabled={tryOn.shrinking} className="sr-only" />
                  </label>
                  {tryOn.image && (
                    <>
                      <span className="text-slate-500">{tryOnSizeKB(tryOn.image)} KB</span>
                      <button
                        type="button"
                        onClick={() => setTryOn({ ...NO_TRY_ON, changed: true })}
                        className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-500">
                A front view of the jersey on a transparent background, It is made smaller (at most 600px wide); empty see-through edges are ignored when fitting. Adjust the size and position until the shoulders match the dummy, then click Save.
              </p>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Description
              <textarea name="description" rows="2" value={form.description} onChange={update} className={input} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Size chart (optional)
              <span className="block text-xs font-normal text-slate-500">
                One line per size: size, min height, max height (cm), min weight, max weight (kg). Leave empty to use the default S–XL chart.
              </span>
              <textarea name="sizeChart" rows="4" value={form.sizeChart} onChange={update} placeholder={'S, 150, 165, 40, 58\nM, 165, 175, 58, 70'} className={`${input} font-mono`} />
            </label>
            <div className="flex gap-3">
              <button disabled={busy || tryOn.loading || tryOn.shrinking} className="flex-1 rounded-lg bg-brand-600 py-2.5 font-semibold text-white disabled:opacity-60">
                {busy ? 'Saving...' : editingId ? 'Save changes' : 'Add product'}
              </button>
              <button type="button" onClick={() => setFormOpen(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

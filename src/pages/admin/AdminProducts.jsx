import { useEffect, useState } from 'react'
import {
  addProduct,
  deleteProduct,
  formatPrice,
  getCategories,
  getProducts,
  placeholderImage,
  updateProduct,
} from '../../services/productService'
import { authErrorMessage } from '../../services/authService'
import { chartToText, textToChart } from '../../services/sizeService'

const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-normal'

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  type: '',
  brand: '',
  price: '',
  salePercent: '0',
  stock: '',
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
  stock: String(p.stock ?? ''),
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
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' })
    setFormOpen(true)
    setMessage(null)
  }

  function startEditing(product) {
    setEditingId(product.id)
    setForm(productToForm(product))
    setFormOpen(true)
    setMessage(null)
  }

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSave(e) {
    e.preventDefault()
    setMessage(null)

    // Check the form
    const price = Number(form.price)
    const salePercent = Number(form.salePercent || 0)
    const stock = Number(form.stock)
    const sizes = form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    if (!form.name.trim()) return setMessage({ type: 'error', text: 'Enter the product name.' })
    if (!form.categoryId) return setMessage({ type: 'error', text: 'Choose a category.' })
    if (!(price > 0)) return setMessage({ type: 'error', text: 'Price must be more than 0.' })
    if (!Number.isInteger(salePercent) || salePercent < 0 || salePercent > 90) {
      return setMessage({ type: 'error', text: 'Sale % must be a whole number from 0 to 90.' })
    }
    if (!Number.isInteger(stock) || stock < 0) return setMessage({ type: 'error', text: 'Stock must be a whole number, 0 or more.' })
    if (sizes.length === 0) return setMessage({ type: 'error', text: 'Enter at least one size.' })
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
      sizes,
      imageUrls: [form.imageUrl.trim() || placeholderImage(form.name.trim())],
      description: form.description.trim(),
      sizeChart: parsed.chart, // empty = S/M/L/XL products use the default chart
    }

    setBusy(true)
    try {
      if (editingId) {
        await updateProduct(editingId, data)
        setMessage({ type: 'success', text: `${data.name} saved.` })
      } else {
        await addProduct(data)
        setMessage({ type: 'success', text: `${data.name} added to the shop.` })
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
                  </td>
                  <td className="px-4 py-3 text-slate-700">{categoryName(p.categoryId)}</td>
                  <td className="px-4 py-3">
                    {formatPrice(p.price)}
                    {p.salePercent > 0 && <span className="ml-1 text-xs font-semibold text-amber-700">−{p.salePercent}%</span>}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${p.stock <= 0 ? 'text-red-700' : 'text-green-800'}`}>
                    {p.stock <= 0 ? 'Out of stock' : p.stock}
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
              <label className="block text-sm font-semibold text-slate-700">
                Stock
                <input name="stock" type="number" min="0" value={form.stock} onChange={update} className={input} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Brand
                <input name="brand" value={form.brand} onChange={update} className={input} />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Sizes (comma separated)
              <input name="sizes" value={form.sizes} onChange={update} className={input} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Image link (optional)
              <input name="imageUrl" value={form.imageUrl} onChange={update} placeholder="https://..." className={input} />
            </label>
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
              <button disabled={busy} className="flex-1 rounded-lg bg-brand-600 py-2.5 font-semibold text-white disabled:opacity-60">
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

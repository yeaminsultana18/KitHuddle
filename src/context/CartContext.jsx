import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

// The cart is kept in the browser (localStorage), one cart per account,
// so it is still there after a refresh. The stock is checked again at checkout.

const CartContext = createContext(null)

const storageKey = (uid) => `kithuddle-cart-${uid || 'guest'}`

function readSavedCart(uid) {
  try {
    const saved = localStorage.getItem(storageKey(uid))
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid || null
  // A new key gives every account its own fresh cart when someone logs in or out
  return (
    <CartStore key={uid || 'guest'} uid={uid}>
      {children}
    </CartStore>
  )
}

function CartStore({ uid, children }) {
  const [items, setItems] = useState(() => readSavedCart(uid))

  // Save the cart every time it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(uid), JSON.stringify(items))
    } catch {
      // Private browsing can block storage; the cart still works until the page closes
    }
  }, [uid, items])

  // How many of one product are already in the cart, all sizes together
  function quantityOfProduct(productId) {
    return items.filter((i) => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0)
  }

  // Returns a message to show the customer
  function addToCart(product, size, unitPrice) {
    if (quantityOfProduct(product.id) + 1 > product.stock) {
      return { ok: false, message: `Only ${product.stock} in stock, and they are all in your cart.` }
    }
    const key = `${product.id}|${size}`
    const existing = items.find((i) => i.key === key)
    if (existing) {
      setItems(items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1, stock: product.stock } : i)))
    } else {
      setItems([
        ...items,
        {
          key,
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrls?.[0] || '',
          size,
          unitPrice,
          quantity: 1,
          stock: product.stock,
        },
      ])
    }
    return { ok: true, message: `Added ${product.name} (size ${size}) to your cart.` }
  }

  function changeQuantity(key, quantity) {
    const item = items.find((i) => i.key === key)
    if (!item || quantity < 1) return
    const otherSizes = quantityOfProduct(item.productId) - item.quantity
    if (otherSizes + quantity > item.stock) return // cannot go above the stock
    setItems(items.map((i) => (i.key === key ? { ...i, quantity } : i)))
  }

  const removeFromCart = (key) => setItems(items.filter((i) => i.key !== key))

  const clearCart = () => setItems([])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const value = { items, count, total, addToCart, changeQuantity, removeFromCart, clearCart }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext)

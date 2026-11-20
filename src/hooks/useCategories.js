import { useEffect, useState } from 'react'
import { getCategories } from '../services/productService'
 
// Loads the categories from Firestore, so a category an admin adds
// shows up everywhere (navbar, filter, footer, home page) without code changes.
export default function useCategories() {
  const [categories, setCategories] = useState([])
 
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {}) // the page still works without them
  }, [])
 
  return categories
}
 

import { doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

// Change to true once you've put real photos in public/products/ (p01.jpg ... p12.jpg)
const USE_LOCAL_IMAGES = false

const APPAREL = ['S', 'M', 'L', 'XL']
const SHOES = ['40', '41', '42', '43', '44']

const picture = (id, name) =>
  USE_LOCAL_IMAGES
    ? [`/products/${id}.jpg`]
    : [`https://placehold.co/600x800?text=${encodeURIComponent(name)}`]

export const categories = [
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
]

// salePercent: 0 = full price, 20 = 20% off
const product = (id, name, categoryId, type, brand, price, salePercent, stock, sizes, description) => ({
  id,
  name,
  categoryId,
  type,
  brand,
  price, // in BDT, before any sale
  salePercent,
  stock,
  sizes,
  description,
  imageUrls: picture(id, name),
  tryOnImageUrl: '', // used in Module 7
  tryOnPrompt: '',
})

export const products = [
  product('p01', 'Home Jersey 2026', 'football', 'Jerseys', 'Apex', 850, 20, 40, APPAREL, 'Lightweight match jersey with breathable mesh panels.'),
  product('p02', 'Away Jersey 2026', 'football', 'Jerseys', 'Apex', 850, 20, 40, APPAREL, 'Away colours in the same quick-dry fabric as the home kit.'),
  product('p03', 'Training Jersey', 'football', 'Jerseys', 'Nova', 650, 20, 30, APPAREL, 'Everyday training top for hard sessions.'),
  product('p04', 'Football Shorts', 'football', 'Shorts', 'Nova', 450, 0, 35, APPAREL, 'Elastic waist shorts with a drawcord.'),
  product('p05', 'Firm Ground Boots', 'football', 'Boots', 'Stride', 3200, 0, 15, SHOES, 'Studded boots for grass pitches.'),
  product('p06', 'Match Football', 'football', 'Balls', 'Apex', 1200, 0, 20, ['Size 5'], 'Size 5 ball, machine stitched.'),
  product('p07', 'Cricket Jersey', 'cricket', 'Jerseys', 'Nova', 800, 0, 25, APPAREL, 'Short-sleeve cricket top in team colours.'),
  product('p08', 'English Willow Bat', 'cricket', 'Bats', 'Apex', 4500, 0, 10, ['Short handle', 'Long handle'], 'Grade 2 willow bat for club players.'),
  product('p09', 'Batting Gloves', 'cricket', 'Gloves', 'Stride', 1100, 0, 0, ['M', 'L'], 'Padded gloves with a breathable palm.'),
]

// Saves everything in one go. Fixed IDs mean running it twice overwrites instead of duplicating.
export async function seedDatabase() {
  const batch = writeBatch(db)
  categories.forEach(({ id, ...data }) => batch.set(doc(db, 'categories', id), data))
  products.forEach(({ id, ...data }) => batch.set(doc(db, 'products', id), data))
  // Running was removed from the shop: delete its old category and products if they exist
  batch.delete(doc(db, 'categories', 'running'))
  ;['p10', 'p11', 'p12'].forEach((id) => batch.delete(doc(db, 'products', id)))
  await batch.commit()
  return { categories: categories.length, products: products.length }
}

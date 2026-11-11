import { doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

// Change to true once you've put real photos in public/products/ (p01.jpg ... p12.jpg)
const USE_LOCAL_IMAGES = false

const APPAREL = ['S', 'M', 'L', 'XL']
const SHOES = ['40', '41', '42', '43', '44']

const picture = (id, name) =>
  USE_LOCAL_IMAGES
    ? [`/products/${id}.jpg`]
    : [`https://placehold.co/600x600?text=${encodeURIComponent(name)}`]

export const categories = [
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'running', name: 'Running' },
]

const product = (id, name, categoryId, brand, price, stock, sizes, description) => ({
  id,
  name,
  categoryId,
  brand,
  price, // in BDT
  stock,
  sizes,
  description,
  imageUrls: picture(id, name),
  tryOnImageUrl: '', // used in Module 7
  tryOnPrompt: '',
})

export const products = [
  product('p01', 'Home Jersey 2026', 'football', 'Apex', 850, 40, APPAREL, 'Lightweight match jersey with breathable mesh panels.'),
  product('p02', 'Away Jersey 2026', 'football', 'Apex', 850, 40, APPAREL, 'Away colours in the same quick-dry fabric as the home kit.'),
  product('p03', 'Training Jersey', 'football', 'Nova', 650, 30, APPAREL, 'Everyday training top for hard sessions.'),
  product('p04', 'Football Shorts', 'football', 'Nova', 450, 35, APPAREL, 'Elastic waist shorts with a drawcord.'),
  product('p05', 'Firm Ground Boots', 'football', 'Stride', 3200, 15, SHOES, 'Studded boots for grass pitches.'),
  product('p06', 'Match Football', 'football', 'Apex', 1200, 20, ['Size 5'], 'Size 5 ball, machine stitched.'),
  product('p07', 'Cricket Jersey', 'cricket', 'Nova', 800, 25, APPAREL, 'Short-sleeve cricket top in team colours.'),
  product('p08', 'English Willow Bat', 'cricket', 'Apex', 4500, 10, ['Short handle', 'Long handle'], 'Grade 2 willow bat for club players.'),
  product('p09', 'Batting Gloves', 'cricket', 'Stride', 1100, 0, ['M', 'L'], 'Padded gloves with a breathable palm.'),
  product('p10', 'Road Running Shoes', 'running', 'Stride', 3800, 12, SHOES, 'Cushioned shoes for daily road runs.'),
  product('p11', 'Running T-shirt', 'running', 'Nova', 550, 30, APPAREL, 'Light, sweat-wicking tee.'),
  product('p12', 'Sports Socks (3 pairs)', 'running', 'Nova', 250, 50, ['Free size'], 'Cushioned ankle socks.'),
]

// Saves everything in one go. Fixed IDs mean running it twice overwrites instead of duplicating.
export async function seedDatabase() {
  const batch = writeBatch(db)
  categories.forEach(({ id, ...data }) => batch.set(doc(db, 'categories', id), data))
  products.forEach(({ id, ...data }) => batch.set(doc(db, 'products', id), data))
  await batch.commit()
  return { categories: categories.length, products: products.length }
}
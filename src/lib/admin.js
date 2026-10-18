export const BUCKET = 'product-images'
export const MAX_IMAGE_MB = 3 // keep in sync with the bucket limit in 004_storage.sql
export const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
// Mirrors the database trigger in 005_order_status_transitions.sql
export const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function validateImage(file) {
  if (!IMAGE_TYPES[file.type]) return 'Only JPEG, PNG or WebP images are allowed.'
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.`
  return null
}

// `sizes` = { 30: { on, price, compare, stock }, 50: {...}, ... } (see SizeEditor)
export function validateProduct(f, sizes) {
  const e = {}
  if (!f.name.trim()) e.name = 'Name is required.'
  const on = Object.entries(sizes).filter(([, s]) => s.on)
  if (on.length === 0) e.sizes = 'Tick at least one size.'
  for (const [ml, s] of on) {
    const price = Number(s.price)
    if (s.price === '' || Number.isNaN(price) || price <= 0) e[`size-${ml}`] = 'Enter the price.'
    else if (s.compare !== '' && (Number.isNaN(Number(s.compare)) || Number(s.compare) <= price)) e[`size-${ml}`] = 'The old price must be higher than the price.'
    else if (s.stock === '' || !Number.isInteger(Number(s.stock)) || Number(s.stock) < 0) e[`size-${ml}`] = 'Stock must be a whole number (0 or more).'
  }
  return e
}

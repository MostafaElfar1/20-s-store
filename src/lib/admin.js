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

export function validateProduct(f) {
  const e = {}
  const price = Number(f.price)
  if (!f.name.trim()) e.name = 'Name is required.'
  if (f.price === '' || Number.isNaN(price) || price < 0) e.price = 'Enter a valid price (0 or more).'
  if (f.compare_at_price !== '') {
    const c = Number(f.compare_at_price)
    if (Number.isNaN(c) || c <= price) e.compare_at_price = 'Comparison price must be higher than the price.'
  }
  if (f.stock_quantity === '' || !Number.isInteger(Number(f.stock_quantity)) || Number(f.stock_quantity) < 0)
    e.stock_quantity = 'Stock must be a whole number (0 or more).'
  if (f.volume_ml !== '' && (!Number.isInteger(Number(f.volume_ml)) || Number(f.volume_ml) <= 0))
    e.volume_ml = 'Volume must be a positive whole number.'
  return e
}

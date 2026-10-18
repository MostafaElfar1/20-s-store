// Store categories: the ONE place to add, rename or reorder them.
// - `en` is the value saved in products.category in the database (so do not rename it once products use it;
//   if you do, run an UPDATE on the products table too). It is also what the /shop?category=... link uses.
// - `ar` is only the label shown when the store is in Arabic. It is linked to `en`: no Arabic category is typed per product.
// - The order here is the order in the footer, the shop filter, the home page and the admin dropdown.
export const CATEGORIES = [
  { key: 'men', en: 'Men Perfumes', ar: 'عطور رجالي' },
  { key: 'women', en: 'Women Perfumes', ar: 'عطور نسائية' },
  { key: 'oud', en: 'Oud Perfumes', ar: 'عود' },
  { key: 'unisex', en: 'Unisex Perfumes', ar: 'عطور للجنسين' },
]

const norm = (v) => String(v ?? '').trim().toLowerCase()
const BY_VALUE = new Map(CATEGORIES.flatMap((c) => [[norm(c.en), c], [norm(c.key), c]]))

// The category object for a saved value ('Men Perfumes' or 'men'), or undefined for an unknown / old value.
export const findCategory = (value) => BY_VALUE.get(norm(value))

// Label in the visitor's language. Unknown (old) categories fall back to category_ar (if any), then to the saved text.
export function categoryLabel(value, lang, legacyAr) {
  if (!value) return ''
  const c = findCategory(value)
  if (c) return lang === 'ar' ? c.ar : c.en
  return (lang === 'ar' && legacyAr) || value
}

// The value to save for a category picked in the admin (always the official English name).
export const categoryValue = (value) => findCategory(value)?.en ?? (String(value ?? '').trim() || null)
export const categoryArValue = (value) => findCategory(value)?.ar ?? null

// Link to the shop filtered by a category
export const categoryLink = (c) => `/shop?category=${encodeURIComponent(c.en)}`

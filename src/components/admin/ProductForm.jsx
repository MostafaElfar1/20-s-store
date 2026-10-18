import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { productImageUrl } from '../../lib/products'
import { BUCKET, IMAGE_TYPES, validateImage, validateProduct } from '../../lib/admin'
import { NOTE_SUGGESTIONS, OCCASIONS, SIZE_OPTIONS } from '../../lib/catalogOptions'
import { CATEGORIES, categoryArValue, categoryValue, findCategory } from '../../lib/categories'
import ImageUpload from './ImageUpload'
import NoteInput from './NoteInput'
import SizeEditor from './SizeEditor'

const isStoragePath = (p) => p && !/^https?:\/\//.test(p)

// Module level on purpose: defining this inside ProductForm remounts inputs on every keystroke (focus loss).
const Row = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-widest text-muted">{label}</label>
    {children}
    {error && <p className="mt-1 text-sm text-danger" role="alert">{error}</p>}
  </div>
)

const Section = ({ title, children }) => (
  <fieldset className="space-y-4 rounded-xl border border-line p-4">
    <legend className="px-2 text-xs uppercase tracking-widest text-muted">{title}</legend>
    {children}
  </fieldset>
)

// Existing sizes -> the editor state. Sizes outside the standard list (old data) are kept too.
const sizeState = (variants, sizeList) => Object.fromEntries(sizeList.map((ml) => {
  const v = variants.find((x) => x.size_ml === ml)
  return [ml, { on: Boolean(v), price: v?.price ?? '', compare: v?.compare_at_price ?? '', stock: v?.stock_quantity ?? '' }]
}))

export default function ProductForm({ product, onSaved, onCancel }) {
  const variants = product?.product_variants ?? []
  const sizeList = useMemo(() => [...new Set([...SIZE_OPTIONS, ...variants.map((v) => v.size_ml)])].sort((a, b) => a - b), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState({
    name: product?.name ?? '', description: product?.description ?? '',
    category: findCategory(product?.category)?.en ?? product?.category ?? '',
    description_ar: product?.description_ar ?? '',
    usage: product?.usage ?? '', usage_ar: product?.usage_ar ?? '',
    notes_top: product?.notes_top ?? [], notes_heart: product?.notes_heart ?? [], notes_base: product?.notes_base ?? [],
    occasions: product?.occasions ?? [],
    featured: product?.featured ?? false, is_active: product?.is_active ?? true,
  })
  const [sizes, setSizes] = useState(() => sizeState(variants, sizeList))
  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const createdId = useRef(null)   // a new product that was saved but whose sizes failed: retrying must not create a second one
  const uploaded = useRef(null)    // image already uploaded in this form session (do not upload twice on a retry)

  const objectUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])
  useEffect(() => () => objectUrl && URL.revokeObjectURL(objectUrl), [objectUrl])
  const previewUrl = objectUrl || (removeImage ? null : productImageUrl(product?.image_path))

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setList = (k) => (list) => setF((s) => ({ ...s, [k]: list }))
  const toggleOccasion = (key) => setF((s) => ({ ...s, occasions: s.occasions.includes(key) ? s.occasions.filter((o) => o !== key) : [...s.occasions, key] }))

  const pickImage = (file) => {
    const err = validateImage(file)
    setImageError(err)
    if (!err) { setImageFile(file); setRemoveImage(false); uploaded.current = null }
  }

  const save = async (e) => {
    e.preventDefault()
    if (saving) return
    const v = validateProduct(f, sizes)
    setErrors(v)
    if (Object.keys(v).length) return
    setSaving(true); setSaveError(null)
    let rowSaved = false
    try {
      let image_path = product?.image_path ?? null
      if (imageFile) {
        if (!uploaded.current) {
          const path = `products/${crypto.randomUUID()}.${IMAGE_TYPES[imageFile.type]}`
          const { error } = await supabase.storage.from(BUCKET).upload(path, imageFile, { contentType: imageFile.type, cacheControl: '31536000' })
          if (error) throw new Error('Image upload failed: ' + error.message)
          uploaded.current = path
        }
        image_path = uploaded.current
      } else if (removeImage) image_path = null

      const rows = Object.entries(sizes).filter(([, s]) => s.on).map(([ml, s]) => ({
        size_ml: Number(ml), price: Number(s.price),
        compare_at_price: s.compare === '' ? null : Number(s.compare), stock_quantity: Number(s.stock),
      }))
      // products.price is required; the database keeps it equal to the cheapest size afterwards.
      const payload = {
        name: f.name.trim(), description: f.description.trim() || null,
        category: categoryValue(f.category), category_ar: categoryArValue(f.category), // the Arabic name comes from lib/categories.js
        price: Math.min(...rows.map((r) => r.price)),
        compare_at_price: null, // the database sets it again from the cheapest size (avoids a clash with the old value)
        description_ar: f.description_ar.trim() || null,
        usage: f.usage.trim() || null, usage_ar: f.usage_ar.trim() || null,
        notes_top: f.notes_top, notes_heart: f.notes_heart, notes_base: f.notes_base, occasions: f.occasions,
        featured: f.featured, is_active: f.is_active, image_path,
      }

      let id = product?.id ?? createdId.current
      if (id) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw new Error('Could not save product: ' + error.message)
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single()
        if (error) throw new Error('Could not save product: ' + error.message)
        id = data.id; createdId.current = id
      }
      rowSaved = true

      // All sizes in one atomic call (adds, updates, and removes the unticked ones)
      const { error: sizeErr } = await supabase.rpc('admin_set_variants', { p_product_id: id, p_variants: rows })
      if (sizeErr) throw new Error('The product was saved but its sizes were not: ' + sizeErr.message + ' Press Save again.')

      // Everything saved: now it is safe to delete the old image file
      if (isStoragePath(product?.image_path) && product.image_path !== image_path) {
        const { error: rmErr } = await supabase.storage.from(BUCKET).remove([product.image_path])
        if (rmErr) console.warn('Old image could not be deleted:', rmErr.message)
      }
      onSaved()
    } catch (err) {
      // Do not leave an orphan file behind if the product row itself failed to save
      if (uploaded.current && !rowSaved) { await supabase.storage.from(BUCKET).remove([uploaded.current]); uploaded.current = null }
      setSaveError(err.message)
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={save} noValidate className="space-y-4">
      <ImageUpload previewUrl={previewUrl} alt={`${f.name || 'Product'} preview`} error={imageError}
        onPick={pickImage} onRemove={() => { setImageFile(null); setRemoveImage(true); setImageError(null); uploaded.current = null }} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Row id="p-name" label="Name *" error={errors.name}><input id="p-name" className="field" value={f.name} onChange={set('name')} /></Row>
        <Row id="p-cat" label="Category">
          <select id="p-cat" className="field" value={f.category} onChange={set('category')}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.en}>{c.en}</option>)}
            {/* an old category that is not in lib/categories.js stays selectable so it is not lost on save */}
            {f.category && !findCategory(f.category) && <option value={f.category}>{f.category} (old)</option>}
          </select>
        </Row>
      </div>

      <SizeEditor sizeList={sizeList} value={sizes} onChange={setSizes} errors={errors} />

      <Section title="Notes">
        <NoteInput label="Top notes" value={f.notes_top} onChange={setList('notes_top')} suggestions={NOTE_SUGGESTIONS.top} />
        <NoteInput label="Heart notes" value={f.notes_heart} onChange={setList('notes_heart')} suggestions={NOTE_SUGGESTIONS.heart} />
        <NoteInput label="Base notes" value={f.notes_base} onChange={setList('notes_base')} suggestions={NOTE_SUGGESTIONS.base} />
      </Section>

      <Section title="When & where to use">
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const on = f.occasions.includes(o.key)
            return (
              <label key={o.key} className={`inline-flex cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-forest/30 ${on ? 'border-forest bg-forest text-cream' : 'border-line bg-paper hover:border-forest/50'}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleOccasion(o.key)} />{o.en}
              </label>
            )
          })}
        </div>
        <Row id="p-usage" label="Extra tip (optional)"><textarea id="p-usage" rows={2} className="field" placeholder="e.g. Best on warm evenings" value={f.usage} onChange={set('usage')} /></Row>
      </Section>

      <Row id="p-desc" label="Description"><textarea id="p-desc" rows={4} className="field" value={f.description} onChange={set('description')} /></Row>

      <Section title="Arabic version (optional)">
        <Row id="p-desc-ar" label="Description (Arabic)"><textarea id="p-desc-ar" dir="rtl" rows={3} className="field" value={f.description_ar} onChange={set('description_ar')} /></Row>
        <Row id="p-usage-ar" label="Extra tip (Arabic)"><textarea id="p-usage-ar" dir="rtl" rows={2} className="field" value={f.usage_ar} onChange={set('usage_ar')} /></Row>
        <p className="text-xs text-muted">If left empty, the English text is shown in the Arabic version of the store. The name and category are shown automatically (the category in Arabic comes from the category list).</p>
      </Section>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[#103C21]" checked={f.is_active} onChange={set('is_active')} /> Active (visible in store)</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[#103C21]" checked={f.featured} onChange={set('featured')} /> Featured</label>
      </div>
      {saveError && <p className="rounded-xl border border-danger/40 p-3 text-sm text-danger" role="alert">{saveError}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : product ? 'Save changes' : 'Create product'}</button>
      </div>
    </form>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { productImageUrl } from '../../lib/products'
import { BUCKET, IMAGE_TYPES, validateImage, validateProduct } from '../../lib/admin'
import ImageUpload from './ImageUpload'

const isStoragePath = (p) => p && !/^https?:\/\//.test(p)

// Module level on purpose: defining this inside ProductForm remounts inputs on every keystroke (focus loss).
const Row = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-widest text-muted">{label}</label>
    {children}
    {error && <p className="mt-1 text-sm text-red-400" role="alert">{error}</p>}
  </div>
)

export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const [f, setF] = useState({
    name: product?.name ?? '', brand: product?.brand ?? '', description: product?.description ?? '',
    price: product?.price ?? '', compare_at_price: product?.compare_at_price ?? '',
    stock_quantity: product?.stock_quantity ?? 0, volume_ml: product?.volume_ml ?? '',
    category: product?.category ?? '', featured: product?.featured ?? false, is_active: product?.is_active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const objectUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])
  useEffect(() => () => objectUrl && URL.revokeObjectURL(objectUrl), [objectUrl])
  const previewUrl = objectUrl || (removeImage ? null : productImageUrl(product?.image_path))

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const pickImage = (file) => {
    const err = validateImage(file)
    setImageError(err)
    if (!err) { setImageFile(file); setRemoveImage(false) }
  }

  const save = async (e) => {
    e.preventDefault()
    if (saving) return
    const v = validateProduct(f)
    setErrors(v)
    if (Object.keys(v).length) return
    setSaving(true); setSaveError(null)
    let uploadedPath = null
    try {
      let image_path = product?.image_path ?? null
      if (imageFile) {
        const path = `products/${crypto.randomUUID()}.${IMAGE_TYPES[imageFile.type]}`
        const { error } = await supabase.storage.from(BUCKET).upload(path, imageFile, { contentType: imageFile.type, cacheControl: '31536000' })
        if (error) throw new Error('Image upload failed: ' + error.message)
        uploadedPath = path
        image_path = path
      } else if (removeImage) image_path = null

      const payload = {
        name: f.name.trim(), brand: f.brand.trim() || null, description: f.description.trim() || null,
        price: Number(f.price), compare_at_price: f.compare_at_price === '' ? null : Number(f.compare_at_price),
        stock_quantity: Number(f.stock_quantity), volume_ml: f.volume_ml === '' ? null : Number(f.volume_ml),
        category: f.category.trim() || null, featured: f.featured, is_active: f.is_active, image_path,
      }
      const { error } = product
        ? await supabase.from('products').update(payload).eq('id', product.id)
        : await supabase.from('products').insert(payload)
      if (error) throw new Error('Could not save product: ' + error.message)

      // Product saved: now it is safe to delete the old image file
      if (isStoragePath(product?.image_path) && product.image_path !== image_path) {
        const { error: rmErr } = await supabase.storage.from(BUCKET).remove([product.image_path])
        if (rmErr) console.warn('Old image could not be deleted:', rmErr.message)
      }
      onSaved()
    } catch (err) {
      // Do not leave an orphan file behind if the product row failed to save
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])
      setSaveError(err.message)
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={save} noValidate className="space-y-4">
      <ImageUpload previewUrl={previewUrl} alt={`${f.name || 'Product'} preview`} error={imageError}
        onPick={pickImage} onRemove={() => { setImageFile(null); setRemoveImage(true); setImageError(null) }} />
      <Row id="p-name" label="Name *" error={errors.name}><input id="p-name" className="field" value={f.name} onChange={set('name')} /></Row>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row id="p-brand" label="Brand"><input id="p-brand" className="field" value={f.brand} onChange={set('brand')} /></Row>
        <Row id="p-cat" label="Category">
          <input id="p-cat" className="field" list="cat-list" value={f.category} onChange={set('category')} />
          <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Row>
        <Row id="p-price" label="Price (EGP) *" error={errors.price}><input id="p-price" type="number" min="0" step="0.01" className="field" value={f.price} onChange={set('price')} /></Row>
        <Row id="p-cmp" label="Comparison price (EGP)" error={errors.compare_at_price}><input id="p-cmp" type="number" min="0" step="0.01" className="field" value={f.compare_at_price} onChange={set('compare_at_price')} /></Row>
        <Row id="p-stock" label="Stock quantity *" error={errors.stock_quantity}><input id="p-stock" type="number" min="0" step="1" className="field" value={f.stock_quantity} onChange={set('stock_quantity')} /></Row>
        <Row id="p-vol" label="Volume (ml)" error={errors.volume_ml}><input id="p-vol" type="number" min="1" step="1" className="field" value={f.volume_ml} onChange={set('volume_ml')} /></Row>
      </div>
      <Row id="p-desc" label="Description"><textarea id="p-desc" rows={4} className="field" value={f.description} onChange={set('description')} /></Row>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-sage" checked={f.is_active} onChange={set('is_active')} /> Active (visible in store)</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-sage" checked={f.featured} onChange={set('featured')} /> Featured</label>
      </div>
      {saveError && <p className="border border-red-400/40 p-3 text-sm text-red-300" role="alert">{saveError}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : product ? 'Save changes' : 'Create product'}</button>
      </div>
    </form>
  )
}

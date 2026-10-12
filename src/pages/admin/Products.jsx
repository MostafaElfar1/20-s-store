import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BUCKET } from '../../lib/admin'
import { formatEGP } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import ProductImage from '../../components/shop/ProductImage'
import ProductForm from '../../components/admin/ProductForm'

export default function Products() {
  const toast = useToast()
  const [state, setState] = useState({ products: [], loading: true, error: null })
  const [editing, setEditing] = useState(null)   // null | 'new' | product
  const [deleting, setDeleting] = useState(null) // product
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) setState({ products: [], loading: false, error: 'Could not load products.' })
    else setState({ products: data, loading: false, error: null })
  }, [])
  useEffect(() => { load() }, [load])

  const categories = [...new Set(state.products.map((p) => p.category).filter(Boolean))]

  const toggleActive = async (p) => {
    const { error } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    if (error) return toast('Could not update the product: ' + error.message, 'error')
    toast(p.is_active ? 'Product hidden from the store.' : 'Product is now visible in the store.')
    load()
  }

  const confirmDelete = async () => {
    setBusy(true)
    const p = deleting
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) { setBusy(false); return toast('Could not delete: ' + error.message, 'error') }
    if (p.image_path && !/^https?:\/\//.test(p.image_path)) await supabase.storage.from(BUCKET).remove([p.image_path])
    setBusy(false); setDeleting(null)
    toast('Product deleted. Past orders keep their saved names and prices.')
    load()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">Products</h1>
        <button className="btn-gold" onClick={() => setEditing('new')}><Plus size={14} /> Add product</button>
      </div>

      {state.loading && <Spinner />}
      {state.error && <div className="mt-6"><ErrorState message={state.error} onRetry={load} /></div>}
      {!state.loading && !state.error && state.products.length === 0 && (
        <p className="mt-8 border border-line bg-charcoal p-8 text-center text-muted">No products yet. Add your first one.</p>
      )}

      {state.products.length > 0 && (
        <div className="mt-8 overflow-x-auto border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-charcoal text-xs uppercase tracking-widest text-muted">
              <tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {state.products.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 shrink-0"><ProductImage product={p} /></div>
                      <div><p>{p.name}</p><p className="text-xs text-muted">{[p.brand, p.category].filter(Boolean).join(' / ')}</p></div>
                    </div>
                  </td>
                  <td className="p-3">{formatEGP(p.price)}</td>
                  <td className={`p-3 ${p.stock_quantity === 0 ? 'text-red-400' : p.stock_quantity <= 5 ? 'text-yellow-300' : ''}`}>{p.stock_quantity}</td>
                  <td className="p-3 text-xs">
                    <span className={p.is_active ? 'text-emerald-300' : 'text-muted'}>{p.is_active ? 'Active' : 'Hidden'}</span>
                    {p.featured && <span className="ml-2 text-gold">Featured</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button className="p-2 hover:text-gold" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil size={16} /></button>
                      <button className="p-2 hover:text-gold" aria-label={p.is_active ? `Hide ${p.name}` : `Show ${p.name}`} onClick={() => toggleActive(p)}><Power size={16} /></button>
                      <button className="p-2 hover:text-red-400" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add product' : 'Edit product'} wide onClose={() => setEditing(null)}>
          <ProductForm product={editing === 'new' ? null : editing} categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); toast('Product saved.'); load() }} />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete product?" onClose={() => !busy && setDeleting(null)}>
          <p className="text-sm text-muted">"{deleting.name}" will be removed from the store for good. Past orders keep their saved names and prices. If you only want to hide it, use the power button instead.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn-gold" disabled={busy} onClick={confirmDelete}>{busy ? 'Deleting...' : 'Delete'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

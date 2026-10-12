import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { NEXT_STATUSES } from '../../lib/admin'
import { formatDate, formatEGP } from '../../lib/format'
import { toInternationalEG } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/admin/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'

export default function OrderDetails() {
  const { id } = useParams()
  const toast = useToast()
  const [state, setState] = useState({ order: null, loading: true, error: null })
  const [updating, setUpdating] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle()
    if (error) setState({ order: null, loading: false, error: 'Could not load this order.' })
    else setState({ order: data, loading: false, error: null })
  }, [id])
  useEffect(() => { load() }, [load])

  const { order, loading, error } = state
  if (loading && !order) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!order) return <p className="text-muted">Order not found. <Link to="/admin/orders" className="text-sage">Back to orders</Link></p>

  const changeStatus = async (next) => {
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', order.id)
    setUpdating(false)
    if (error) return toast('Could not change status: ' + error.message, 'error')
    toast(next === 'cancelled' ? 'Order cancelled and its items were returned to stock.' : `Status changed to ${next}.`)
    load()
  }

  const copyPhone = async () => {
    try { await navigator.clipboard.writeText(order.customer_phone); toast('Phone number copied.') }
    catch { toast('Could not copy. Select the number and copy it manually.', 'error') }
  }

  const next = NEXT_STATUSES[order.status] || []
  const waUrl = `https://wa.me/${toInternationalEG(order.customer_phone)}?text=${encodeURIComponent(`Hello ${order.customer_name}, this is about your order ${order.order_number}.`)}`
  const items = [...(order.order_items || [])].sort((a, b) => a.product_name.localeCompare(b.product_name))

  return (
    <div>
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted hover:text-sage"><ArrowLeft size={14} /> Orders</Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-4xl">{order.order_number}</h1><StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">Placed {formatDate(order.created_at)} / Last updated {formatDate(order.updated_at)}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-moss p-6">
          <h2 className="text-2xl">Customer</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-muted">Name</dt><dd>{order.customer_name}</dd></div>
            <div><dt className="text-muted">Phone</dt><dd>{order.customer_phone}</dd></div>
            {order.customer_email && <div><dt className="text-muted">Email</dt><dd>{order.customer_email}</dd></div>}
            <div><dt className="text-muted">Delivery</dt><dd>{order.governorate}, {order.delivery_address}</dd></div>
            {order.notes && <div><dt className="text-muted">Notes</dt><dd className="whitespace-pre-line">{order.notes}</dd></div>}
            <div><dt className="text-muted">Payment</dt><dd>Cash on delivery</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-outline px-4 py-2" onClick={copyPhone}><Copy size={14} /> Copy phone</button>
            <a className="btn-outline px-4 py-2" href={waUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp customer</a>
          </div>
        </section>

        <section className="border border-line bg-moss p-6">
          <h2 className="text-2xl">Status</h2>
          {next.length === 0
            ? <p className="mt-4 text-sm text-muted">This order is {order.status}. No further changes are possible.</p>
            : (
              <div className="mt-4 flex flex-wrap gap-3">
                {next.map((s) => (
                  <button key={s} disabled={updating} onClick={() => (s === 'cancelled' ? setConfirmCancel(true) : changeStatus(s))}
                    className={`${s === 'cancelled' ? 'btn-outline' : 'btn-primary'} capitalize`}>Mark {s}</button>
                ))}
              </div>)}
          <p className="mt-5 text-xs text-muted">
            {order.status === 'cancelled'
              ? (order.stock_restored
                  ? 'The items of this order were returned to stock automatically.'
                  : 'This order was cancelled before automatic restocking existed, so its items were not returned to stock. Adjust stock in Products if needed.')
              : 'Cancelling an order returns its items to stock automatically, once.'}
          </p>
        </section>
      </div>

      <section className="mt-6 border border-line bg-moss p-6">
        <h2 className="text-2xl">Items</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted"><tr><th className="py-2">Product</th><th>Qty</th><th>Unit price</th><th className="text-right">Total</th></tr></thead>
            <tbody>{items.map((i) => (
              <tr key={i.id} className="border-t border-line"><td className="py-3">{i.product_name}</td><td>{i.quantity}</td><td>{formatEGP(i.unit_price)}</td><td className="text-right">{formatEGP(i.line_total)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4"><span>Subtotal</span><span className="text-xl text-sage">{formatEGP(order.subtotal)}</span></div>
      </section>
      {confirmCancel && (
        <Modal title="Cancel this order?" onClose={() => setConfirmCancel(false)}>
          <p className="text-sm text-muted">The items will be returned to stock and the order cannot be changed afterwards.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-outline" onClick={() => setConfirmCancel(false)}>Keep order</button>
            <button className="btn-primary" disabled={updating} onClick={async () => { await changeStatus('cancelled'); setConfirmCancel(false) }}>Cancel order</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

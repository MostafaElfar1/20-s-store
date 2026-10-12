import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { STATUSES } from '../../lib/admin'
import { formatDate, formatEGP } from '../../lib/format'
import StatusBadge from '../../components/admin/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'

const PAGE = 50

export default function Orders() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [state, setState] = useState({ orders: [], loading: true, error: null })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    let query = supabase.from('orders')
      .select('id, order_number, customer_name, customer_phone, subtotal, status, created_at')
      .order('created_at', { ascending: false }).limit(limit + 1)
    if (status) query = query.eq('status', status)
    // strip characters that have special meaning in PostgREST filters
    const term = q.trim().replace(/[,()%*\\]/g, '')
    if (term) query = query.or(`order_number.ilike.%${term}%,customer_phone.ilike.%${term}%`)
    const { data, error } = await query
    if (error) setState({ orders: [], loading: false, error: 'Could not load orders.' })
    else setState({ orders: data, loading: false, error: null })
  }, [q, status, limit])

  // small debounce so we do not query on every keystroke
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const shown = state.orders.slice(0, limit)
  const hasMore = state.orders.length > limit

  return (
    <div>
      <h1 className="text-4xl">Orders</h1>
      <div className="mt-8 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <span className="sr-only">Search by order reference or phone</span>
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input className="field pl-11" placeholder="Order reference or phone" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }} />
        </label>
        <select aria-label="Filter by status" className="field" value={status} onChange={(e) => { setStatus(e.target.value); setLimit(PAGE) }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="mt-6">
        {state.loading && shown.length === 0 && <Spinner />}
        {state.error && <ErrorState message={state.error} onRetry={load} />}
        {!state.loading && !state.error && shown.length === 0 && <p className="border border-line bg-charcoal p-8 text-center text-muted">No orders found.</p>}
        {shown.length > 0 && (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-charcoal text-xs uppercase tracking-widest text-muted"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Placed</th></tr></thead>
              <tbody>{shown.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="p-3"><Link className="text-gold hover:underline" to={`/admin/orders/${o.id}`}>{o.order_number}</Link></td>
                  <td className="p-3">{o.customer_name}</td><td className="p-3">{o.customer_phone}</td>
                  <td className="p-3">{formatEGP(o.subtotal)}</td><td className="p-3"><StatusBadge status={o.status} /></td>
                  <td className="p-3 text-muted">{formatDate(o.created_at)}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
        {hasMore && <div className="mt-6 text-center"><button className="btn-outline" onClick={() => setLimit((l) => l + PAGE)}>Load more</button></div>}
      </div>
    </div>
  )
}

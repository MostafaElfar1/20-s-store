import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatDate, formatEGP } from '../../lib/format'
import StatusBadge from '../../components/admin/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'

const count = (q) => q.select('*', { count: 'exact', head: true })

export default function Dashboard() {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = useCallback(async () => {
    setState({ loading: true, error: null, data: null })
    const p = () => supabase.from('products')
    const o = () => supabase.from('orders')
    const res = await Promise.all([
      count(p()), count(p()).eq('is_active', true), count(p()).eq('is_active', true).eq('stock_quantity', 0),
      count(o()), count(o()).eq('status', 'pending'),
      o().select('id, order_number, customer_name, subtotal, status, created_at').order('created_at', { ascending: false }).limit(5),
    ])
    const failed = res.find((r) => r.error)
    if (failed) return setState({ loading: false, error: 'Could not load statistics. Please try again.', data: null })
    const [total, active, out, orders, pending, recent] = res
    setState({ loading: false, error: null, data: { total: total.count, active: active.count, out: out.count, orders: orders.count, pending: pending.count, recent: recent.data } })
  }, [])
  useEffect(() => { load() }, [load])

  if (state.loading) return <Spinner />
  if (state.error) return <ErrorState message={state.error} onRetry={load} />
  const d = state.data
  const cards = [
    ['Total products', d.total], ['Active products', d.active], ['Out of stock (active)', d.out],
    ['Total orders', d.orders], ['Pending orders', d.pending],
  ]
  return (
    <div>
      <h1 className="text-4xl">Overview</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(([label, n]) => (
          <div key={label} className="border border-line bg-paper p-5">
            <p className="text-3xl text-forest">{n}</p><p className="mt-1 text-xs uppercase tracking-widest text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex items-end justify-between"><h2 className="text-2xl">Recent orders</h2><Link to="/admin/orders" className="text-xs uppercase tracking-widest text-forest">View all</Link></div>
      {d.recent.length === 0
        ? <p className="mt-4 border border-line bg-paper p-6 text-muted">No orders yet.</p>
        : (
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs uppercase tracking-widest text-muted"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
              <tbody>{d.recent.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="p-3"><Link className="text-forest hover:underline" to={`/admin/orders/${r.id}`}>{r.order_number}</Link></td>
                  <td className="p-3">{r.customer_name}</td><td className="p-3">{formatEGP(r.subtotal)}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td><td className="p-3 text-muted">{formatDate(r.created_at)}</td>
                </tr>))}</tbody>
            </table>
          </div>)}
    </div>
  )
}

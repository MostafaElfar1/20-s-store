import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'

const RANGES = [7, 30, 90]
const n = (v) => Number(v || 0).toLocaleString()

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = useCallback(async () => {
    setState({ loading: true, error: null, data: null })
    const { data, error } = await supabase.rpc('analytics_summary', { p_days: days })
    if (error) setState({ loading: false, error: 'Could not load analytics. Make sure migration 007_analytics.sql has been run in Supabase.', data: null })
    else setState({ loading: false, error: null, data })
  }, [days])
  useEffect(() => { load() }, [load])

  const range = (
    <div className="flex gap-2">
      {RANGES.map((r) => (
        <button key={r} onClick={() => setDays(r)}
          className={`border px-3 py-2 text-xs uppercase tracking-widest ${days === r ? 'border-forest text-forest' : 'border-line text-muted hover:text-forest'}`}>
          {r} days
        </button>
      ))}
    </div>
  )

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-4xl">Analytics</h1>
      {range}
    </div>
  )

  if (state.loading) return <div>{header}<Spinner /></div>
  if (state.error) return <div>{header}<div className="mt-8"><ErrorState message={state.error} onRetry={load} /></div></div>

  const d = state.data
  const cards = [
    ['Page views', d.page_views], ['Unique visitors', d.visitors],
    ['Product clicks', d.product_clicks], ['Added to cart', d.add_to_cart],
  ]
  const max = Math.max(1, ...d.daily.map((x) => x.views))
  const today = d.daily[d.daily.length - 1]

  return (
    <div>
      {header}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, v]) => (
          <div key={label} className="border border-line bg-paper p-5">
            <p className="text-3xl text-forest">{n(v)}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl">Visits per day</h2>
      <p className="mt-1 text-sm text-muted">Today: {n(today?.views)} views from {n(today?.visitors)} visitors</p>
      <div className="mt-4 border border-line bg-paper p-4">
        <div className="flex h-40 items-end gap-px">
          {d.daily.map((x) => (
            <div key={x.day} className="flex h-full flex-1 items-end" title={`${x.day}: ${x.views} views, ${x.visitors} visitors`}>
              <div className="w-full bg-forest" style={{ height: `${(x.views / max) * 100}%`, minHeight: x.views ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted"><span>{d.daily[0]?.day}</span><span>{today?.day}</span></div>
      </div>

      <h2 className="mt-12 text-2xl">Most popular products</h2>
      {d.top_products.length === 0
        ? <p className="mt-4 border border-line bg-paper p-6 text-muted">No product activity yet.</p>
        : (
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs uppercase tracking-widest text-muted">
                <tr><th className="p-3">Product</th><th className="p-3">Clicks</th><th className="p-3">Page views</th><th className="p-3">Added to cart</th></tr>
              </thead>
              <tbody>
                {d.top_products.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="p-3">{p.name}</td>
                    <td className="p-3 text-forest">{n(p.clicks)}</td>
                    <td className="p-3">{n(p.views)}</td>
                    <td className="p-3">{n(p.carts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

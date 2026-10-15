import { Fragment, useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, MapPin, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { isTrackingOff, setTrackingOff } from '../../lib/analytics'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'

const RANGES = [[1, 'Today'], [7, '7 days'], [30, '30 days']]
const LIVE_MS = 5 * 60 * 1000

// ---- helpers -------------------------------------------------------------------------------
let regionNames = null
try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }) } catch { /* old browser */ }
const countryName = (c) => { if (!c || c === '??') return null; try { return regionNames?.of(c) || c } catch { return c } }

// ISO 3166-2:EG codes (what Vercel sends as the region)
const EG = {
  ALX: 'Alexandria', ASN: 'Aswan', AST: 'Asyut', BA: 'Red Sea', BH: 'Beheira', BNS: 'Beni Suef', C: 'Cairo',
  DK: 'Dakahlia', DT: 'Damietta', FYM: 'Faiyum', GH: 'Gharbia', GZ: 'Giza', IS: 'Ismailia', JS: 'South Sinai',
  KB: 'Qalyubia', KFS: 'Kafr El Sheikh', KN: 'Qena', LX: 'Luxor', MN: 'Minya', MNF: 'Monufia', MT: 'Matrouh',
  PTS: 'Port Said', SHG: 'Sohag', SHR: 'Sharqia', SIN: 'North Sinai', SUZ: 'Suez', WAD: 'New Valley',
}
const regionName = (region, country) => (!region ? null : country === 'EG' ? (EG[region] || region) : region)

const place = (v) => {
  const parts = [v.city, regionName(v.region, v.country), countryName(v.country)].filter(Boolean)
  return [...new Set(parts)].join(', ') || 'Unknown'
}

const ago = (iso) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
const clock = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const pageLabel = (p) => {
  if (!p) return '-'
  if (p === '/') return 'Home'
  if (p.startsWith('/product/')) return 'Product page'
  return p
}

// Only show a map link when the saved text really is "lat,lng" (the data comes from the public browser).
const COORDS = /^-?\d{1,3}\.\d+,-?\d{1,3}\.\d+$/

const DeviceIcon = ({ device }) => (device === 'mobile' ? <Smartphone size={15} /> : device === 'tablet' ? <Tablet size={15} /> : <Monitor size={15} />)

const EVENT_TEXT = {
  page_view: (e) => `Viewed ${pageLabel(e.path)}`,
  product_view: (e) => `Opened ${e.product || 'a product'}`,
  product_click: (e) => `Clicked ${e.product || 'a product'}`,
  add_to_cart: (e) => `Added ${e.product || 'a product'} to the cart`,
  order_placed: (e) => `Placed order ${e.meta || ''}`,
  location_shared: (e) => `Shared their location (about 100 m): ${e.meta || ''}`,
}

// ---- small components ----------------------------------------------------------------------
const Card = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
    <p className="text-3xl text-forest">{value}</p>
    <p className="mt-1 text-xs uppercase tracking-widest text-muted">{label}</p>
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
)

function Breakdown({ title, rows, labelOf = (r) => r.label }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
      <h3 className="text-lg text-forest">{title}</h3>
      {rows.length === 0
        ? <p className="mt-3 text-sm text-muted">No data yet.</p>
        : (
          <ul className="mt-3 space-y-3">
            {rows.map((r, i) => (
              <li key={i}>
                <div className="flex justify-between gap-3 text-sm"><span className="truncate">{labelOf(r)}</span><span className="text-muted">{r.n}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-sage-soft"><div className="h-full rounded-full bg-forest" style={{ width: `${(r.n / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}

function Timeline({ visitId }) {
  const [state, setState] = useState({ loading: true, error: false, rows: [] })
  useEffect(() => {
    let cancelled = false
    supabase.rpc('supervisor_visit_timeline', { p_visit_id: visitId }).then(({ data, error }) => {
      if (!cancelled) setState({ loading: false, error: Boolean(error), rows: data || [] })
    })
    return () => { cancelled = true }
  }, [visitId])
  if (state.loading) return <p className="text-sm text-muted">Loading...</p>
  if (state.error) return <p className="text-sm text-danger">Could not load this visit.</p>
  if (state.rows.length === 0) return <p className="text-sm text-muted">No activity recorded for this visit.</p>
  return (
    <ol className="space-y-1.5 text-sm">
      {state.rows.map((e, i) => (
        <li key={i} className="flex gap-3"><span className="w-20 shrink-0 text-muted">{clock(e.created_at)}</span><span>{(EVENT_TEXT[e.event_type] || (() => e.event_type))(e)}</span></li>
      ))}
    </ol>
  )
}

// ---- page ----------------------------------------------------------------------------------
export default function Supervisor() {
  const [days, setDays] = useState(7)
  const [live, setLive] = useState(true)
  const [off, setOff] = useState(isTrackingOff())
  const [open, setOpen] = useState(null)
  const [state, setState] = useState({ loading: true, error: null, overview: null, visits: [], at: null })

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }))
    const [o, v] = await Promise.all([
      supabase.rpc('supervisor_overview', { p_days: days }),
      supabase.rpc('supervisor_recent_visits', { p_limit: 100 }),
    ])
    if (o.error || v.error) {
      setState((s) => ({ ...s, loading: false, error: 'Could not load visitor data. Make sure migration 009_visits.sql has been run in Supabase.' }))
      return
    }
    setState({ loading: false, error: null, overview: o.data, visits: v.data || [], at: new Date() })
  }, [days])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!live) return undefined
    const id = setInterval(() => load(true), 30000)
    return () => clearInterval(id)
  }, [live, load])

  const toggleOff = () => { setTrackingOff(!off); setOff(!off) }

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      {RANGES.map(([d, label]) => (
        <button key={d} onClick={() => setDays(d)}
          className={`rounded-full border px-3.5 py-1.5 text-sm ${days === d ? 'border-forest bg-forest text-cream' : 'border-line bg-paper text-ink hover:border-forest/50'}`}>{label}</button>
      ))}
      <button onClick={() => load()} aria-label="Refresh" className="rounded-full border border-line bg-paper p-2 text-forest hover:border-forest"><RefreshCw size={15} /></button>
      <label className="ml-2 inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input type="checkbox" className="h-4 w-4 accent-[#103C21]" checked={live} onChange={(e) => setLive(e.target.checked)} /> Auto-refresh
      </label>
    </div>
  )

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl text-forest">Visitors</h1>
        <p className="mt-1 text-sm text-muted">Approximate area, device and source of everyone who opens the store. No IP addresses are stored.</p>
      </div>
      {controls}
    </div>
  )

  if (state.loading && !state.overview) return <div>{header}<Spinner /></div>
  if (state.error) return <div>{header}<div className="mt-8"><ErrorState message={state.error} onRetry={() => load()} /></div></div>

  const o = state.overview
  const f = o.funnel
  const pct = (n) => (f.visits ? `${Math.round((n / f.visits) * 100)}%` : '-')
  const max = Math.max(1, ...o.daily.map((x) => x.visits))
  const funnel = [['Visits', f.visits], ['Looked at a product', f.viewed], ['Added to cart', f.carted], ['Placed an order', f.ordered]]

  return (
    <div>
      {header}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Online now" value={o.online} hint="active in the last 5 minutes" />
        <Card label="Visits" value={o.visits} />
        <Card label="Unique visitors" value={o.visitors} />
        <Card label="Returning visits" value={o.returning} />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
          <h3 className="text-lg text-forest">Visits per day</h3>
          <div className="mt-4 flex h-32 items-end gap-px">
            {o.daily.map((x) => (
              <div key={x.day} className="flex h-full flex-1 items-end" title={`${x.day}: ${x.visits} visits, ${x.visitors} visitors`}>
                <div className="w-full rounded-t bg-forest" style={{ height: `${(x.visits / max) * 100}%`, minHeight: x.visits ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted"><span>{o.daily[0]?.day}</span><span>{o.daily[o.daily.length - 1]?.day}</span></div>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
          <h3 className="text-lg text-forest">From visit to order</h3>
          <ul className="mt-4 space-y-3">
            {funnel.map(([label, n]) => (
              <li key={label}>
                <div className="flex justify-between text-sm"><span>{label}</span><span className="text-muted">{n} <span className="text-xs">({pct(n)})</span></span></div>
                <div className="mt-1 h-1.5 rounded-full bg-sage-soft"><div className="h-full rounded-full bg-forest" style={{ width: f.visits ? `${(n / f.visits) * 100}%` : '0%' }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Breakdown title="Countries" rows={o.countries} labelOf={(r) => countryName(r.label) || 'Unknown'} />
        <Breakdown title="Governorates / regions" rows={o.regions} labelOf={(r) => [regionName(r.region, r.country), countryName(r.country)].filter(Boolean).join(', ')} />
        <Breakdown title="Cities" rows={o.cities} />
        <Breakdown title="Where they came from" rows={o.sources} />
        <Breakdown title="Devices" rows={o.devices} labelOf={(r) => r.label[0].toUpperCase() + r.label.slice(1)} />
        <Breakdown title="Browsers" rows={o.browsers} />
        <Breakdown title="Operating systems" rows={o.os} />
        <Breakdown title="Browser language" rows={o.languages} labelOf={(r) => r.label.toUpperCase()} />
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl text-forest">Latest visits</h2>
        <p className="text-xs text-muted">{state.at ? `Updated ${clock(state.at.toISOString())}` : ''}</p>
      </div>
      {state.visits.length === 0
        ? <p className="mt-4 rounded-2xl border border-line bg-paper p-6 text-muted">No visits yet. Open the store in another tab and refresh this page.</p>
        : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-sage-soft text-xs uppercase tracking-widest text-muted">
                <tr><th className="p-3" /><th className="p-3">When</th><th className="p-3">Area (approx.)</th><th className="p-3">Device</th><th className="p-3">Came from</th><th className="p-3">Landed on</th><th className="p-3">Did</th></tr>
              </thead>
              <tbody>
                {state.visits.map((v) => {
                  const isLive = Date.now() - new Date(v.last_seen).getTime() < LIVE_MS
                  const isOpen = open === v.id
                  return (
                    <Fragment key={v.id}>
                      <tr className="cursor-pointer border-t border-line hover:bg-sage-soft/50" onClick={() => setOpen(isOpen ? null : v.id)}>
                        <td className="p-3 text-muted">{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                        <td className="whitespace-nowrap p-3">
                          <span className="inline-flex items-center gap-2">{isLive && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online now" />}{ago(v.started_at)}</span>
                          {v.returning && <span className="ml-2 rounded-full bg-sage-soft px-2 py-0.5 text-[11px] text-forest">returning</span>}
                        </td>
                        <td className="p-3">
                          {place(v)}
                          {v.location && COORDS.test(v.location) && (
                            <a href={`https://www.google.com/maps?q=${encodeURIComponent(v.location)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                              className="mt-1 flex items-center gap-1 text-xs font-medium text-forest underline underline-offset-2"><MapPin size={12} /> Shared location (about 100 m)</a>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-3"><span className="inline-flex items-center gap-2"><DeviceIcon device={v.device} />{v.os} · {v.browser}</span><span className="block text-xs text-muted">{(v.language || '').toUpperCase()}</span></td>
                        <td className="p-3">{v.source || 'Direct'}{v.referrer_host && v.referrer_host !== v.source && <span className="block text-xs text-muted">{v.referrer_host}</span>}</td>
                        <td className="p-3">{pageLabel(v.landing_path)}</td>
                        <td className="p-3 text-xs text-muted">
                          {v.pages} pages{v.product_views > 0 && `, ${v.product_views} products`}{v.add_to_cart > 0 && `, ${v.add_to_cart} to cart`}
                          {v.orders?.length > 0 && <span className="mt-1 block font-medium text-forest">Ordered {v.orders.join(', ')}</span>}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t border-line bg-cream"><td className="p-3" /><td colSpan={6} className="p-3"><Timeline visitId={v.id} /></td></tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      <div className="mt-8 space-y-3 rounded-2xl border border-line bg-paper p-5 text-sm text-muted shadow-card">
        <p>The area comes from the visitor's connection and is only approximate: usually the right country, often the right governorate, and sometimes the wrong city (mobile networks are the least precise). The IP address itself is never stored. A closer location appears only when a customer taps "Share my location" at checkout and allows it in their browser; it is saved rounded to about 100 m.</p>
        <label className="inline-flex cursor-pointer items-center gap-2 text-ink">
          <input type="checkbox" className="h-4 w-4 accent-[#103C21]" checked={off} onChange={toggleOff} /> Don't track visits from this browser (use it so your own visits don't show up)
        </label>
      </div>
    </div>
  )
}

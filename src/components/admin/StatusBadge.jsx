const STYLES = {
  pending: 'border-amber-600/40 bg-amber-50 text-amber-800',
  confirmed: 'border-sky-600/40 bg-sky-50 text-sky-800',
  processing: 'border-indigo-500/40 bg-indigo-50 text-indigo-800',
  shipped: 'border-forest/40 bg-sage-soft text-forest',
  delivered: 'border-emerald-600/40 bg-emerald-50 text-emerald-800',
  cancelled: 'border-danger/40 bg-red-50 text-danger',
}
export default function StatusBadge({ status }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs capitalize ${STYLES[status] || 'border-line text-muted'}`}>{status}</span>
}

const STYLES = {
  pending: 'border-yellow-500/50 text-yellow-300',
  confirmed: 'border-sky-500/50 text-sky-300',
  processing: 'border-indigo-400/50 text-indigo-300',
  shipped: 'border-gold/60 text-gold',
  delivered: 'border-emerald-500/50 text-emerald-300',
  cancelled: 'border-red-500/50 text-red-300',
}
export default function StatusBadge({ status }) {
  return <span className={`inline-block border px-2 py-0.5 text-xs capitalize ${STYLES[status] || 'border-line text-muted'}`}>{status}</span>
}

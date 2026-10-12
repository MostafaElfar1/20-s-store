import { Loader2 } from 'lucide-react'
export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-muted" role="status">
      <Loader2 className="animate-spin text-sage" size={20} /> <span>{label}</span>
    </div>
  )
}

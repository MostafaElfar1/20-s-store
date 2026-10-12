import { Minus, Plus } from 'lucide-react'
export default function QuantitySelector({ value, max, onChange }) {
  return (
    <div className="inline-flex items-center border border-line">
      <button type="button" aria-label="Decrease quantity" className="p-3 hover:text-gold disabled:opacity-30"
        disabled={value <= 1} onClick={() => onChange(value - 1)}><Minus size={14} /></button>
      <span className="min-w-10 text-center text-sm" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" className="p-3 hover:text-gold disabled:opacity-30"
        disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={14} /></button>
    </div>
  )
}

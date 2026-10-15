import { Minus, Plus } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'

export default function QuantitySelector({ value, max, onChange }) {
  const { t } = useLang()
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-paper" dir="ltr">
      <button type="button" aria-label={t('qty.dec')} className="p-3 text-forest hover:text-forest-hover disabled:opacity-30"
        disabled={value <= 1} onClick={() => onChange(value - 1)}><Minus size={14} /></button>
      <span className="min-w-10 text-center text-sm font-medium" aria-live="polite">{value}</span>
      <button type="button" aria-label={t('qty.inc')} className="p-3 text-forest hover:text-forest-hover disabled:opacity-30"
        disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={14} /></button>
    </div>
  )
}

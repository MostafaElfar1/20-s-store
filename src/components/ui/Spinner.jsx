import { Loader2 } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'

export default function Spinner({ label }) {
  const { t } = useLang()
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-muted" role="status">
      <Loader2 className="animate-spin text-forest" size={20} /> <span>{label ?? t('common.loading')}</span>
    </div>
  )
}

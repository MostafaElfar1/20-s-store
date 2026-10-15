import { AlertCircle } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'

export default function ErrorState({ message, onRetry }) {
  const { t } = useLang()
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-danger/30 bg-paper px-6 py-12 text-center" role="alert">
      <AlertCircle className="text-danger" />
      <p>{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline">{t('common.tryAgain')}</button>}
    </div>
  )
}

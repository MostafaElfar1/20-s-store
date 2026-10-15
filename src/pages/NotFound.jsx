import EmptyState from '../components/ui/EmptyState'
import { useLang } from '../i18n/LanguageContext'

export default function NotFound() {
  const { t } = useLang()
  return <div className="container-x py-16"><EmptyState title={t('nf.title')} text={t('nf.text')} action={t('nf.home')} to="/" /></div>
}

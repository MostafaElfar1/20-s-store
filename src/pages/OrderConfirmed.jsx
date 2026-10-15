import { Link } from 'react-router-dom'
import { CheckCircle2, MessageCircle, AlertTriangle } from 'lucide-react'
import { config } from '../lib/config'
import { useLang } from '../i18n/LanguageContext'
import { buildOrderMessage, buildWhatsAppUrl } from '../lib/whatsapp'
import { GOVERNORATES_AR } from '../lib/validators'
import { LAST_ORDER_KEY } from './Checkout'
import EmptyState from '../components/ui/EmptyState'

function readLastOrder() {
  try { return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY)) } catch { return null }
}

export default function OrderConfirmed() {
  const { t, lang, money } = useLang()
  const saved = readLastOrder()
  if (!saved?.order) {
    return <div className="container-x py-16"><EmptyState title={t('oc.none.title')} text={t('oc.none.text')} action={t('oc.back')} to="/shop" /></div>
  }
  const { order, customer } = saved
  const message = buildOrderMessage({ storeName: config.storeName, order, customer, lang })
  const waUrl = buildWhatsAppUrl(config.whatsappNumber, message)
  const gov = lang === 'ar' ? (GOVERNORATES_AR[customer.governorate] || customer.governorate) : customer.governorate

  return (
    <div className="container-x max-w-2xl py-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-forest" size={44} />
        <h1 className="mt-4 text-4xl text-forest">{t('oc.title')}</h1>
        <p className="mt-2 text-muted">{t('oc.sub')}</p>
        <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted">{t('oc.ref')}</p>
        <p dir="ltr" className="font-display text-3xl text-forest">{order.order_number}</p>
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-paper p-6 shadow-card">
        <ul className="space-y-3 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span>{i.name} <span className="text-muted">x{i.quantity} @ {money(i.unit_price)}</span></span>
              <span>{money(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-line pt-4"><span>{t('oc.subtotal')}</span><span className="font-semibold text-forest">{money(order.subtotal)}</span></div>
        <p className="mt-4 text-sm text-muted">{t('oc.deliver')}: {customer.name}, <span dir="ltr">{customer.phone}</span><br />{gov}, {customer.address}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-forest/30 bg-sage-soft p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-forest" />
          <div className="text-sm">
            <p className="font-medium text-forest">{t('oc.step.title')}</p>
            <p className="mt-1 leading-relaxed text-ink/75">{t('oc.step.text')}</p>
          </div>
        </div>
        {waUrl
          ? <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full"><MessageCircle size={16} /> {t('oc.send')}</a>
          : <>
              <button disabled className="btn-primary mt-5 w-full"><MessageCircle size={16} /> {t('oc.send')}</button>
              <p className="mt-2 text-xs text-danger">{t('oc.noWa')}</p>
            </>}
      </div>

      <div className="mt-8 text-center"><Link to="/shop" className="btn-outline">{t('oc.continue')}</Link></div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { CheckCircle2, MessageCircle, AlertTriangle } from 'lucide-react'
import { config } from '../lib/config'
import { formatEGP } from '../lib/format'
import { buildOrderMessage, buildWhatsAppUrl } from '../lib/whatsapp'
import { LAST_ORDER_KEY } from './Checkout'
import EmptyState from '../components/ui/EmptyState'

function readLastOrder() {
  try { return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY)) } catch { return null }
}

export default function OrderConfirmed() {
  const saved = readLastOrder()
  if (!saved?.order) {
    return <div className="container-x py-16"><EmptyState title="No recent order" text="We could not find an order to show on this device." action="Back to shop" to="/shop" /></div>
  }
  const { order, customer } = saved
  const message = buildOrderMessage({ storeName: config.storeName, order, customer })
  const waUrl = buildWhatsAppUrl(config.whatsappNumber, message)

  return (
    <div className="container-x max-w-2xl py-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-sage" size={44} />
        <h1 className="mt-4 text-4xl">Order saved</h1>
        <p className="mt-2 text-muted">Your order was recorded in our system.</p>
        <p className="mt-5 text-xs uppercase tracking-widest text-muted">Order reference</p>
        <p className="font-display text-3xl text-sage">{order.order_number}</p>
      </div>

      <div className="mt-10 border border-line bg-moss p-6">
        <ul className="space-y-3 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span>{i.name} <span className="text-muted">x{i.quantity} @ {formatEGP(i.unit_price)}</span></span>
              <span>{formatEGP(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-line pt-4"><span>Subtotal (cash on delivery)</span><span className="text-sage">{formatEGP(order.subtotal)}</span></div>
        <p className="mt-4 text-sm text-muted">Deliver to: {customer.name}, {customer.phone}<br />{customer.governorate}, {customer.address}</p>
      </div>

      <div className="mt-6 border border-sage/40 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-sage" />
          <div className="text-sm">
            <p className="font-medium">One more step: send the details on WhatsApp</p>
            <p className="mt-1 text-muted">
              Your order is saved, but no WhatsApp message has been sent yet. Tap the button, then press send inside WhatsApp.
              Opening WhatsApp does not by itself confirm the message was delivered.
            </p>
          </div>
        </div>
        {waUrl
          ? <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full"><MessageCircle size={16} /> Send order on WhatsApp</a>
          : <>
              <button disabled className="btn-primary mt-5 w-full"><MessageCircle size={16} /> Send order on WhatsApp</button>
              <p className="mt-2 text-xs text-red-400">WhatsApp number is not configured. Set VITE_WHATSAPP_NUMBER (see README).</p>
            </>}
      </div>

      <div className="mt-8 text-center"><Link to="/shop" className="btn-outline">Continue shopping</Link></div>
    </div>
  )
}

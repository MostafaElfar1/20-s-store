import { formatEGP } from './format'

// The message is written in the language the customer is using.
const TEXT = {
  en: { newOrder: 'New order', order: 'Order', name: 'Name', phone: 'Phone', address: 'Address', items: 'Items', subtotal: 'Subtotal', payment: 'Payment: Cash on delivery' },
  ar: { newOrder: 'طلب جديد', order: 'رقم الطلب', name: 'الاسم', phone: 'الهاتف', address: 'العنوان', items: 'المنتجات', subtotal: 'المجموع', payment: 'الدفع: عند الاستلام' },
}

// Pure functions (no env access) so they are easy to test.
export function buildOrderMessage({ storeName, order, customer, lang = 'en' }) {
  const x = TEXT[lang] || TEXT.en
  const f = (n) => formatEGP(n, lang)
  const lines = order.items.map(
    (i) => `- ${i.name} x${i.quantity} @ ${f(i.unit_price)} = ${f(i.line_total)}`
  )
  return [
    `${storeName} - ${x.newOrder}`,
    `${x.order}: ${order.order_number}`,
    '',
    `${x.name}: ${customer.name}`,
    `${x.phone}: ${customer.phone}`,
    `${x.address}: ${customer.governorate}, ${customer.address}`,
    '',
    `${x.items}:`,
    ...lines,
    '',
    `${x.subtotal}: ${f(order.subtotal)}`,
    x.payment,
  ].join('\n')
}

export function buildWhatsAppUrl(number, message) {
  const digits = (number || '').replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// Egyptian mobile (01012345678, +201012345678, 00201012345678) -> 201012345678
export function toInternationalEG(phone) {
  let d = (phone || '').replace(/\D/g, '')
  if (d.startsWith('0020')) d = d.slice(2)
  else if (d.startsWith('0')) d = '20' + d.slice(1)
  else if (d.length === 10 && d.startsWith('1')) d = '20' + d
  return d
}

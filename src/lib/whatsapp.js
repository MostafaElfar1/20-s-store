import { formatEGP } from './format'

// Pure functions (no env access) so they are easy to test.
export function buildOrderMessage({ storeName, order, customer }) {
  const lines = order.items.map(
    (i) => `- ${i.name} x${i.quantity} @ ${formatEGP(i.unit_price)} = ${formatEGP(i.line_total)}`
  )
  return [
    `${storeName} - New order`,
    `Order: ${order.order_number}`,
    '',
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.governorate}, ${customer.address}`,
    '',
    'Items:',
    ...lines,
    '',
    `Subtotal: ${formatEGP(order.subtotal)}`,
    'Payment: Cash on delivery',
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

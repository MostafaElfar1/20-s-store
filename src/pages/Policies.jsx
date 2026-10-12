import { config } from '../lib/config'

// Edit this file to change the store policies. Only states how the system works today.
export default function Policies() {
  return (
    <div className="container-x max-w-2xl py-14">
      <p className="eyebrow">{config.storeName}</p>
      <h1 className="mt-2 text-4xl">Store policies</h1>
      <div className="mt-8 space-y-8 leading-relaxed text-mist/90">
        <section><h2 className="text-2xl text-sage">Payment</h2><p className="mt-2">Cash on delivery is the only payment method. You pay when your order arrives.</p></section>
        <section><h2 className="text-2xl text-sage">Orders</h2><p className="mt-2">Prices and availability are confirmed when you place the order. Orders can only be placed for products that are in stock.</p></section>
        <section><h2 className="text-2xl text-sage">Contact</h2><p className="mt-2">For anything about your order, contact the store on WhatsApp and mention your order reference.</p></section>
      </div>
    </div>
  )
}

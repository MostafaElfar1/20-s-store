// Vercel Function: tells the browser the visitor's APPROXIMATE area (country / region / city).
// The values come from headers Vercel adds to every request. The IP address is never read,
// returned or stored. Nothing is saved here; the browser stores the result with the visit.
const decode = (v) => {
  try { return v ? decodeURIComponent(v) : null } catch { return v || null }
}

export default function handler(req, res) {
  const h = req.headers
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(200).json({
    country: h['x-vercel-ip-country'] || null,
    region: h['x-vercel-ip-country-region'] || null,
    city: decode(h['x-vercel-ip-city']),
    timezone: h['x-vercel-ip-timezone'] || null,
  })
}

export const formatEGP = (n) =>
  `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} EGP`

export const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

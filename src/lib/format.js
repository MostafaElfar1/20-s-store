// lang defaults to 'en' so the English-only admin keeps working unchanged.
// Latin digits are used in Arabic too (clearer next to phone numbers and order numbers).
export const formatEGP = (n, lang = 'en') =>
  `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${lang === 'ar' ? 'ج.م' : 'EGP'}`

export const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

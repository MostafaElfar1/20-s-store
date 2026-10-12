// Same pattern as the database function create_order(): Egyptian mobile numbers.
// Accepts 01XXXXXXXXX, +201XXXXXXXXX, 00201XXXXXXXXX (010/011/012/015).
const EG_MOBILE = /^(\+20|0020|0)?1[0125][0-9]{8}$/

export const cleanPhone = (v) => (v || '').replace(/[\s-]/g, '')
export const isValidEgyptPhone = (v) => EG_MOBILE.test(cleanPhone(v))
export const isValidEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Dakahlia', 'Sharqia', 'Gharbia', 'Monufia',
  'Beheira', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia', 'Suez', 'North Sinai',
  'South Sinai', 'Faiyum', 'Beni Suef', 'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan',
  'Red Sea', 'Matrouh', 'New Valley',
]

export function validateCheckout(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your full name.'
  if (!isValidEgyptPhone(f.phone)) e.phone = 'Enter a valid Egyptian mobile number, e.g. 01012345678.'
  if (!f.governorate) e.governorate = 'Please choose your governorate.'
  if (f.address.trim().length < 8) e.address = 'Please enter a detailed delivery address.'
  if (!isValidEmail(f.email.trim())) e.email = 'Please enter a valid email or leave it empty.'
  return e
}

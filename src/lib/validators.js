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

// ISO 3166-2:EG region codes (what the geo lookup returns) -> the governorate names above
const EG_REGION = {
  ALX: 'Alexandria', ASN: 'Aswan', AST: 'Asyut', BA: 'Red Sea', BH: 'Beheira', BNS: 'Beni Suef', C: 'Cairo',
  DK: 'Dakahlia', DT: 'Damietta', FYM: 'Faiyum', GH: 'Gharbia', GZ: 'Giza', IS: 'Ismailia', JS: 'South Sinai',
  KB: 'Qalyubia', KFS: 'Kafr El Sheikh', KN: 'Qena', LX: 'Luxor', MN: 'Minya', MNF: 'Monufia', MT: 'Matrouh',
  PTS: 'Port Said', SHG: 'Sohag', SHR: 'Sharqia', SIN: 'North Sinai', SUZ: 'Suez', WAD: 'New Valley',
}

// Best guess of the governorate from the approximate geo data, or '' when we are not sure.
export function governorateFromGeo(geo) {
  if (!geo || geo.country !== 'EG') return ''
  if (geo.region && EG_REGION[geo.region]) return EG_REGION[geo.region]
  return GOVERNORATES.find((g) => g.toLowerCase() === (geo.city || '').toLowerCase()) || ''
}

export const GOVERNORATES_AR = {
  'Cairo': 'القاهرة', 'Giza': 'الجيزة', 'Alexandria': 'الإسكندرية', 'Qalyubia': 'القليوبية',
  'Dakahlia': 'الدقهلية', 'Sharqia': 'الشرقية', 'Gharbia': 'الغربية', 'Monufia': 'المنوفية',
  'Beheira': 'البحيرة', 'Kafr El Sheikh': 'كفر الشيخ', 'Damietta': 'دمياط', 'Port Said': 'بورسعيد',
  'Ismailia': 'الإسماعيلية', 'Suez': 'السويس', 'North Sinai': 'شمال سيناء', 'South Sinai': 'جنوب سيناء',
  'Faiyum': 'الفيوم', 'Beni Suef': 'بني سويف', 'Minya': 'المنيا', 'Asyut': 'أسيوط', 'Sohag': 'سوهاج',
  'Qena': 'قنا', 'Luxor': 'الأقصر', 'Aswan': 'أسوان', 'Red Sea': 'البحر الأحمر', 'Matrouh': 'مطروح',
  'New Valley': 'الوادي الجديد',
}

// Returns error CODES (translated by the page), so the messages follow the selected language.
export function validateCheckout(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'name'
  if (!isValidEgyptPhone(f.phone)) e.phone = 'phone'
  if (!f.governorate) e.governorate = 'governorate'
  if (f.address.trim().length < 8) e.address = 'address'
  if (!isValidEmail(f.email.trim())) e.email = 'email'
  return e
}

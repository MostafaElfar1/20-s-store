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

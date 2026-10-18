// The choices offered in the admin (checkboxes / quick-pick chips) and used by the storefront filters.
// To add a size or an occasion later, add one line here. Nothing else needs to change.

// Bottle sizes in ml (checkboxes in the product form).
export const SIZE_OPTIONS = [30, 50, 70, 100]
// "When & where to use" tags. `key` is what is saved in the database, so do not rename keys later.
export const OCCASIONS = [
  { key: 'daily', en: 'Everyday', ar: 'الاستخدام اليومي' },
  { key: 'work', en: 'Work & office', ar: 'العمل والمكتب' },
  { key: 'casual', en: 'Casual outings', ar: 'الخروج والنزهات' },
  { key: 'evening', en: 'Evenings & nights out', ar: 'السهرات' },
  { key: 'date', en: 'Date night', ar: 'المواعيد' },
  { key: 'events', en: 'Weddings & events', ar: 'الأفراح والمناسبات' },
  { key: 'summer', en: 'Summer', ar: 'الصيف' },
  { key: 'winter', en: 'Winter', ar: 'الشتاء' },
  { key: 'spring', en: 'Spring & autumn', ar: 'الربيع والخريف' },
]

// Quick-pick notes for the admin. The saved value is the English name; the shop shows the Arabic one in Arabic.
// Anything not in these lists can still be typed by hand (it is then shown exactly as typed).
export const NOTE_SUGGESTIONS = {
  top: [
    { en: 'Bergamot', ar: 'برغموت' }, { en: 'Lemon', ar: 'ليمون' }, { en: 'Orange', ar: 'برتقال' },
    { en: 'Mandarin', ar: 'يوسفي' }, { en: 'Grapefruit', ar: 'جريب فروت' }, { en: 'Lime', ar: 'ليمون أخضر' },
    { en: 'Mint', ar: 'نعناع' }, { en: 'Lavender', ar: 'لافندر' }, { en: 'Pink pepper', ar: 'فلفل وردي' },
    { en: 'Cardamom', ar: 'هيل' }, { en: 'Apple', ar: 'تفاح' }, { en: 'Pear', ar: 'كمثرى' },
    { en: 'Peach', ar: 'خوخ' }, { en: 'Pineapple', ar: 'أناناس' }, { en: 'Blackcurrant', ar: 'كشمش أسود' },
  ],
  heart: [
    { en: 'Rose', ar: 'ورد' }, { en: 'Jasmine', ar: 'ياسمين' }, { en: 'Orange blossom', ar: 'زهر البرتقال' },
    { en: 'Violet', ar: 'بنفسج' }, { en: 'Iris', ar: 'سوسن' }, { en: 'Peony', ar: 'فاوانيا' },
    { en: 'Ylang-ylang', ar: 'يلانغ يلانغ' }, { en: 'Geranium', ar: 'غرنوقي' }, { en: 'Cinnamon', ar: 'قرفة' },
    { en: 'Saffron', ar: 'زعفران' }, { en: 'Nutmeg', ar: 'جوزة الطيب' }, { en: 'Coffee', ar: 'قهوة' },
    { en: 'Tea', ar: 'شاي' }, { en: 'Tuberose', ar: 'مسك الروم' },
  ],
  base: [
    { en: 'Vanilla', ar: 'فانيليا' }, { en: 'Musk', ar: 'مسك' }, { en: 'White musk', ar: 'مسك أبيض' },
    { en: 'Amber', ar: 'عنبر' }, { en: 'Oud', ar: 'عود' }, { en: 'Sandalwood', ar: 'خشب الصندل' },
    { en: 'Cedarwood', ar: 'خشب الأرز' }, { en: 'Patchouli', ar: 'باتشولي' }, { en: 'Vetiver', ar: 'فيتيفر' },
    { en: 'Tonka bean', ar: 'حبوب التونكا' }, { en: 'Leather', ar: 'جلد' }, { en: 'Incense', ar: 'بخور' },
    { en: 'Caramel', ar: 'كراميل' }, { en: 'Honey', ar: 'عسل' }, { en: 'Oakmoss', ar: 'طحلب البلوط' },
  ],
}

const NOTE_AR = new Map(
  Object.values(NOTE_SUGGESTIONS).flat().map((n) => [n.en.toLowerCase(), n.ar])
)
const OCCASION_BY_KEY = new Map(OCCASIONS.map((o) => [o.key, o]))

// Name of a note in the visitor's language (custom notes are shown as typed).
export const noteLabel = (value, lang) => (lang === 'ar' && NOTE_AR.get(String(value).toLowerCase())) || value
export const occasionLabel = (key, lang) => {
  const o = OCCASION_BY_KEY.get(key)
  return o ? o[lang === 'ar' ? 'ar' : 'en'] : key
}

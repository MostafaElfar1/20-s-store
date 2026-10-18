// Public, browser-safe configuration. Everything here ends up in the JS bundle.
export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  storeName: import.meta.env.VITE_STORE_NAME || "20's",
  slogan: import.meta.env.VITE_STORE_SLOGAN || 'Smell Like Your Twenties',
  sloganAr: import.meta.env.VITE_STORE_SLOGAN_AR || 'تعطّر كأنك في العشرينات',
  // wa.me needs digits only: strip anything that is not a digit
  whatsappNumber: (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
  instagramUrl: import.meta.env.VITE_INSTAGRAM_URL || '',
  facebookUrl: import.meta.env.VITE_FACEBOOK_URL || '',
  tiktokUrl: import.meta.env.VITE_TIKTOK_URL || '',
}
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseKey)

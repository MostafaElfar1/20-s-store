import { config } from '../lib/config'
import { useLang } from '../i18n/LanguageContext'

// Edit src/i18n/en.js and ar.js (keys starting with "pol.") to change the policies.
export default function Policies() {
  const { t } = useLang()
  const sections = ['payment', 'orders', 'contact' ]
  return (
    <div className="container-x max-w-2xl py-14">
      {/* <p className="eyebrow">{config.storeName}</p> */}
      <h1 className="mt-2 text-4xl text-forest sm:text-5xl">{t('pol.title')}</h1>
      <div className="mt-8 space-y-4">
        {sections.map((k) => (
          <section key={k} className="rounded-2xl border border-line bg-paper p-6 shadow-card">
            <h2 className="text-2xl text-forest">{t(`pol.${k}.h`)}</h2>
            <p className="mt-2 leading-relaxed text-ink/85">{t(`pol.${k}.p`)}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

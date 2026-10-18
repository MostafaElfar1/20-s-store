import { useLang } from '../../i18n/LanguageContext'
import { noteLabel } from '../../lib/catalogOptions'

const TIERS = [['notes_top', 'notes.top'], ['notes_heart', 'notes.heart'], ['notes_base', 'notes.base']]

export const hasNotes = (p) => TIERS.some(([k]) => p?.[k]?.length > 0)

// Top / Heart / Base, each as a row of small tags
export default function NotesList({ product }) {
  const { t, lang } = useLang()
  return (
    <dl className="divide-y divide-forest/15">
      {TIERS.filter(([k]) => product[k]?.length > 0).map(([k, label]) => (
        <div key={k} className="flex gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="w-16 shrink-0 pt-1 text-sm font-medium text-forest">{t(label)}</dt>
          <dd className="flex flex-wrap gap-2">
            {product[k].map((n) => <span key={n} className="rounded-full bg-sage-soft px-3 py-1 text-sm text-ink">{noteLabel(n, lang)}</span>)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

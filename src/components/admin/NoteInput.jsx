import { useState } from 'react'
import { X } from 'lucide-react'

const MAX = 12

// Notes as tags: click a suggestion to add it, or type your own and press Enter (or comma).
// Module level on purpose (see ProductForm): no remounting while typing.
export default function NoteInput({ label, value, onChange, suggestions }) {
  const [text, setText] = useState('')
  const has = (n) => value.some((v) => v.toLowerCase() === n.toLowerCase())

  const add = (raw) => {
    const n = raw.trim().replace(/\s+/g, ' ')
    if (!n || has(n) || value.length >= MAX) return
    onChange([...value, n])
  }
  const commitText = () => {
    if (text.trim()) add(text.charAt(0).toUpperCase() + text.slice(1))
    setText('')
  }
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitText() } // Enter must not submit the whole form
    else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
  }

  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-widest text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper p-2 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/15">
        {value.map((n) => (
          <span key={n} className="inline-flex items-center gap-1 rounded-full bg-forest py-1 pe-1.5 ps-3 text-sm text-cream">
            {n}
            <button type="button" aria-label={`Remove ${n}`} onClick={() => onChange(value.filter((v) => v !== n))} className="rounded-full p-0.5 hover:bg-cream/20"><X size={12} /></button>
          </span>
        ))}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} onBlur={commitText}
          aria-label={`Add a ${label.toLowerCase()}`} placeholder={value.length ? '' : 'Type a note and press Enter'}
          className="min-w-[10rem] flex-1 bg-transparent px-2 py-1 text-sm focus:outline-none" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.filter((s) => !has(s.en)).map((s) => (
          <button key={s.en} type="button" onClick={() => add(s.en)} disabled={value.length >= MAX}
            className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink transition-colors hover:border-forest hover:bg-sage-soft disabled:opacity-40">+ {s.en}</button>
        ))}
      </div>
    </div>
  )
}

import { ChevronDown } from 'lucide-react'

// Closed by default; the arrow opens the section. Uses the browser's <details>, so it is keyboard and screen-reader friendly.
export default function Accordion({ title, children }) {
  return (
    <details className="group border-b border-forest/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl text-forest [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={20} className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  )
}

import { Link } from 'react-router-dom'
export default function EmptyState({ title, text, action, to, onAction }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-6 py-14 text-center shadow-card">
      <h3 className="text-2xl text-forest">{title}</h3>
      {text && <p className="mx-auto mt-3 max-w-md text-muted">{text}</p>}
      {action && to && <Link to={to} className="btn-outline mt-6">{action}</Link>}
      {action && onAction && <button onClick={onAction} className="btn-outline mt-6">{action}</button>}
    </div>
  )
}

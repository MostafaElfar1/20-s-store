import { AlertCircle } from 'lucide-react'
export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-red-400/30 bg-charcoal px-6 py-12 text-center" role="alert">
      <AlertCircle className="text-red-400" />
      <p>{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline">Try again</button>}
    </div>
  )
}

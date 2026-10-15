import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { IMAGE_TYPES, MAX_IMAGE_MB } from '../../lib/admin'

export default function ImageUpload({ previewUrl, alt, error, onPick, onRemove }) {
  const input = useRef(null)
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex aspect-[4/5] w-28 shrink-0 items-center justify-center overflow-hidden border border-line bg-paper">
          {previewUrl ? <img src={previewUrl} alt={alt} className="h-full w-full object-cover" /> : <ImagePlus className="text-muted" />}
        </div>
        <div className="space-y-2 text-sm">
          <input ref={input} type="file" accept={Object.keys(IMAGE_TYPES).join(',')} className="sr-only" id="product-image"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }} />
          <button type="button" className="btn-outline px-4 py-2" onClick={() => input.current?.click()}>{previewUrl ? 'Replace image' : 'Choose image'}</button>
          {previewUrl && (
            <button type="button" className="ml-2 inline-flex items-center gap-1 text-muted hover:text-danger" onClick={onRemove}><Trash2 size={14} /> Remove</button>
          )}
          <p className="text-xs text-muted">JPEG, PNG or WebP, up to {MAX_IMAGE_MB} MB.</p>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
    </div>
  )
}

// Tick the sizes you sell; each ticked size shows its own price, old price and stock.
// Module level on purpose (see ProductForm): no remounting while typing.
const Num = ({ id, label, value, onChange, step = '1', placeholder }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-xs text-muted">{label}</label>
    <input id={id} type="number" min="0" step={step} inputMode="decimal" className="field py-2" placeholder={placeholder} value={value} onChange={onChange} />
  </div>
)

export default function SizeEditor({ sizeList, value, onChange, errors }) {
  const update = (ml, patch) => onChange({ ...value, [ml]: { ...value[ml], ...patch } })
  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="px-2 text-xs uppercase tracking-widest text-muted">Sizes, prices and stock *</legend>
      {/* <p className="text-xs text-muted">Tick the sizes you sell, then fill the price and stock of each one.</p> */}
      <div className="mt-3 space-y-3">
        {sizeList.map((ml) => {
          const s = value[ml]
          return (
            <div key={ml} className={`rounded-xl border p-3 transition-colors ${s.on ? 'border-forest/40 bg-sage-soft/50' : 'border-line'}`}>
              <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
                <input type="checkbox" className="h-4 w-4 accent-[#103C21]" checked={s.on} onChange={(e) => update(ml, { on: e.target.checked })} /> {ml} ml
              </label>
              {s.on && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Num id={`size-${ml}-price`} label="Price (EGP) *" step="0.01" value={s.price} onChange={(e) => update(ml, { price: e.target.value })} />
                  <Num id={`size-${ml}-old`} label="Old price (optional)" step="0.01" value={s.compare} onChange={(e) => update(ml, { compare: e.target.value })} />
                  <Num id={`size-${ml}-stock`} label="In stock *" value={s.stock} placeholder="0" onChange={(e) => update(ml, { stock: e.target.value })} />
                </div>
              )}
              {errors[`size-${ml}`] && <p className="mt-2 text-sm text-danger" role="alert">{errors[`size-${ml}`]}</p>}
            </div>
          )
        })}
      </div>
      {errors.sizes && <p className="mt-2 text-sm text-danger" role="alert">{errors.sizes}</p>}
    </fieldset>
  )
}

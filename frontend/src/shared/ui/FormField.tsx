type FormFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  hint?: string
}

export const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  hint,
}: FormFieldProps) => (
  <label className="block space-y-2 text-sm text-slate-200">
    <span className="font-medium text-slate-100">{label}</span>
    <input
      value={value}
      type={type}
      autoComplete={autoComplete}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required
      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
    />
    {hint ? <span className="block text-xs leading-5 text-slate-400">{hint}</span> : null}
  </label>
)

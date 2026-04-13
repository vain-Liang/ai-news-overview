import type { StatusState } from '../model'

export const StatusBanner = ({ status }: { status: StatusState }) => {
  if (status.kind === 'idle') {
    return null
  }

  return (
    <div
      className={[
        'rounded-2xl border px-4 py-3 text-sm shadow-lg',
        status.kind === 'success'
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
          : 'border-rose-400/30 bg-rose-500/10 text-rose-100',
      ].join(' ')}
    >
      {status.message}
    </div>
  )
}

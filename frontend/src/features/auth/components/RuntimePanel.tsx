import type { BackendState } from '../model'

type RuntimePanelProps = {
  backendState: BackendState
  isAuthenticated: boolean
  sessionLabel: string
  token: string
}

export const RuntimePanel = ({ backendState, isAuthenticated, sessionLabel, token }: RuntimePanelProps) => (
  <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Runtime status</h2>
    <dl className="mt-4 space-y-4 text-sm text-slate-200">
      <StatusRow label="Backend" value={backendState.message} tone={backendState.kind} />
      <StatusRow label="Session" value={sessionLabel} tone={isAuthenticated ? 'online' : 'checking'} />
      <StatusRow
        label="Auth token"
        value={token ? `${token.slice(0, 18)}…` : 'No token stored yet'}
        tone={token ? 'online' : 'checking'}
      />
    </dl>
  </section>
)

type StatusRowProps = {
  label: string
  value: string
  tone: 'checking' | 'online' | 'offline'
}

const StatusRow = ({ label, value, tone }: StatusRowProps) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
    <dt className="text-slate-400">{label}</dt>
    <dd className="flex items-center gap-2 text-right text-slate-100">
      <span
        className={[
          'inline-flex h-2.5 w-2.5 rounded-full',
          tone === 'online' ? 'bg-emerald-400' : tone === 'offline' ? 'bg-rose-400' : 'bg-amber-300',
        ].join(' ')}
      />
      <span className="max-w-[14rem] text-sm leading-5">{value}</span>
    </dd>
  </div>
)

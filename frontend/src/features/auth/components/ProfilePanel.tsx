import type { AuthUser } from '../model'

type ProfilePanelProps = {
  isAuthenticated: boolean
  isRefreshingUser: boolean
  onRefreshProfile: () => void
  onSignOut: () => void
  token: string
  user: AuthUser | null
}

export const ProfilePanel = ({
  isAuthenticated,
  isRefreshingUser,
  onRefreshProfile,
  onSignOut,
  token,
  user,
}: ProfilePanelProps) => (
  <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Authenticated account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Once signed in, the UI stores the JWT locally and loads{' '}
          <code className="rounded bg-white/10 px-1 py-0.5 text-cyan-100">/users/me</code>.
        </p>
      </div>
      <span
        className={[
          'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
          isAuthenticated ? 'bg-emerald-400/15 text-emerald-200' : 'bg-slate-800 text-slate-300',
        ].join(' ')}
      >
        {isAuthenticated ? 'Active' : 'Idle'}
      </span>
    </div>

    <div className="mt-6 space-y-4">
      <UserDetail label="Email" value={user?.email ?? '—'} />
      <UserDetail label="Username" value={user?.username ?? '—'} />
      <UserDetail label="Nickname" value={user?.nickname ?? '—'} />
      <UserDetail label="User ID" value={user?.id ?? '—'} />
      <UserDetail label="Active" value={user ? String(user.is_active) : '—'} />
      <UserDetail label="Verified" value={user ? String(user.is_verified) : '—'} />
    </div>

    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onRefreshProfile}
        disabled={!token || isRefreshingUser}
        className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshingUser ? 'Refreshing…' : 'Refresh profile'}
      </button>
      <button
        type="button"
        onClick={onSignOut}
        disabled={!token}
        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  </section>
)

type UserDetailProps = {
  label: string
  value: string
}

const UserDetail = ({ label, value }: UserDetailProps) => (
  <div className="rounded-2xl border border-white/5 bg-slate-950/70 px-4 py-3">
    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
    <div className="mt-2 break-all text-sm text-slate-100">{value}</div>
  </div>
)

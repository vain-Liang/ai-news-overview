import type { FormEvent, ReactNode } from 'react'

type AuthFormCardProps = {
  title: string
  description: string
  actionLabel: string
  disabled: boolean
  children: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export const AuthFormCard = ({ title, description, actionLabel, disabled, children, onSubmit }: AuthFormCardProps) => (
  <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20">
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm leading-6 text-slate-300">{description}</p>
    </div>
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {children}
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-900 disabled:text-slate-300"
      >
        {actionLabel}
      </button>
    </form>
  </section>
)

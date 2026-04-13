import type { FormEvent } from 'react'

import { FormField } from '../../../shared/ui/FormField'
import { useAuth } from '../hooks/useAuth'
import { AuthFormCard } from './AuthFormCard'
import { ProfilePanel } from './ProfilePanel'
import { RuntimePanel } from './RuntimePanel'
import { StatusBanner } from './StatusBanner'

export const AuthPage = () => {
  const {
    backendState,
    isAuthenticated,
    isLoggingIn,
    isRefreshingUser,
    isRegistering,
    loginForm,
    refreshProfile,
    register,
    registerForm,
    sessionLabel,
    signIn,
    signOut,
    status,
    token,
    updateLoginForm,
    updateRegisterForm,
    user,
  } = useAuth()

  const handleSubmit = (action: () => Promise<void>) => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await action()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.8fr] lg:px-10">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                AI News Review · Authentication
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Secure sign-in and registration for the news review dashboard
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                  This Vite + React interface connects to the FastAPI authentication endpoints for account creation,
                  login, session recovery, and current-user inspection.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                {['React', 'Vite', 'pnpm', 'Tailwind CSS', 'FastAPI Users JWT'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-slate-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <RuntimePanel
              backendState={backendState}
              isAuthenticated={isAuthenticated}
              sessionLabel={sessionLabel}
              token={token}
            />
          </div>
        </header>

        <StatusBanner status={status} />

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
          <AuthFormCard
            title="Sign in"
            description="Use your existing account to receive a JWT access token from /auth/jwt/login."
            onSubmit={handleSubmit(signIn)}
            actionLabel={isLoggingIn ? 'Signing in…' : 'Sign in'}
            disabled={isLoggingIn || isRefreshingUser}
          >
            <FormField
              label="Email"
              value={loginForm.email}
              type="email"
              autoComplete="email"
              onChange={(value) => updateLoginForm('email', value)}
              placeholder="you@example.com"
            />
            <FormField
              label="Password"
              value={loginForm.password}
              type="password"
              autoComplete="current-password"
              onChange={(value) => updateLoginForm('password', value)}
              placeholder="Enter your password"
            />
          </AuthFormCard>

          <AuthFormCard
            title="Create account"
            description="Register against /auth/register, then sign in automatically using the same credentials."
            onSubmit={handleSubmit(register)}
            actionLabel={isRegistering ? 'Creating account…' : 'Register & sign in'}
            disabled={isRegistering || isRefreshingUser}
          >
            <FormField
              label="Email"
              value={registerForm.email}
              type="email"
              autoComplete="email"
              onChange={(value) => updateRegisterForm('email', value)}
              placeholder="new-user@example.com"
            />
            <FormField
              label="Username"
              value={registerForm.username}
              autoComplete="username"
              onChange={(value) => updateRegisterForm('username', value)}
              placeholder="news-reader"
            />
            <FormField
              label="Nickname"
              value={registerForm.nickname}
              autoComplete="nickname"
              onChange={(value) => updateRegisterForm('nickname', value)}
              placeholder="Morning Briefing"
            />
            <FormField
              label="Password"
              value={registerForm.password}
              type="password"
              autoComplete="new-password"
              onChange={(value) => updateRegisterForm('password', value)}
              placeholder="At least 8 characters"
              hint="The backend rejects passwords shorter than 8 characters or containing the email."
            />
          </AuthFormCard>

          <ProfilePanel
            isAuthenticated={isAuthenticated}
            isRefreshingUser={isRefreshingUser}
            onRefreshProfile={refreshProfile}
            onSignOut={signOut}
            token={token}
            user={user}
          />
        </section>
      </div>
    </main>
  )
}

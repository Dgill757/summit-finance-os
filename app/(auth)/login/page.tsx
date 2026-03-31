'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, Shield, TrendingUp, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.2fr,1fr]">
      <div className="relative hidden overflow-hidden border-r border-border lg:block">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute left-1/2 top-20 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.24),transparent_65%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-teal/15 bg-teal-bg px-4 py-2 text-sm text-teal">
              <TrendingUp size={16} />
              Summit Finance OS
            </div>
            <h1 className="mt-10 max-w-xl font-display text-5xl font-bold leading-tight text-primary">Finance ops for operators who need clarity, not clutter.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-secondary">A premium command center for personal wealth, cash flow, banking, and business performance.</p>
            <div className="mt-10 space-y-4">
              {[
                ['Live Bank Sync', 'Connect accounts and keep every balance current.'],
                ['AI Advisor', 'Ask precise financial questions against your actual data.'],
                ['Real-time Net Worth', 'Track assets, liabilities, and savings momentum.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur">
                  <div className="text-sm font-semibold text-primary">{title}</div>
                  <div className="mt-1 text-sm text-secondary">{body}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-border bg-surface/80 px-4 py-3 text-sm text-secondary">
            <Shield size={18} className="text-teal" />
            Bank-grade session security and encrypted data flow
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-8 shadow-elevated">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.28em] text-muted">Executive Access</div>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary">Welcome back</h2>
            <p className="mt-2 text-sm text-secondary">Sign in to Summit and pick up exactly where your finances left off.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-muted">Email</span>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 focus-within:border-teal/40 focus-within:ring-1 focus-within:ring-teal/30">
                <Mail size={16} className="text-muted" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@summit.com" className="w-full bg-transparent py-3 text-sm text-primary outline-none placeholder:text-muted" required />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-muted">Password</span>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 focus-within:border-teal/40 focus-within:ring-1 focus-within:ring-teal/30">
                <Lock size={16} className="text-muted" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent py-3 text-sm text-primary outline-none placeholder:text-muted" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-muted transition hover:text-primary">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {error && <div className="rounded-xl border border-down/20 bg-down-bg px-4 py-3 text-sm text-down">{error}</div>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 font-medium text-canvas transition hover:bg-teal/90 disabled:opacity-60">
              {loading && <Zap size={15} className="animate-pulse" />}
              {loading ? 'Signing in...' : 'Sign in to Summit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

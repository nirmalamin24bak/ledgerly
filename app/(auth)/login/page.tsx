'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Eye, EyeOff, User, Briefcase } from 'lucide-react'
import Link from 'next/link'

type AccountType = 'individual' | 'company'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); return }
        router.push('/dashboard')
        router.refresh()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, account_type: accountType } },
        })
        if (error) { setError(error.message); return }
        if (data.user) {
          await supabase.from('user_profiles').insert({
            id: data.user.id,
            name,
            email,
            role: 'owner',
            account_type: accountType,
          })
        }
        setMessage('Account created! Check your email to verify, then log in.')
        setMode('login')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-sm">

        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 shadow-sm">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-3xl font-bold text-gray-950">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-gray-400">
            {mode === 'login' ? 'Sign in to your Ledgerly account' : 'Get started — free forever for individuals'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === 'signup' && (
            <>
              {/* Account type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account type</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { type: 'individual' as AccountType, icon: User, label: 'Individual', sub: 'Personal tracking' },
                    { type: 'company' as AccountType, icon: Briefcase, label: 'Company', sub: 'Team + accountant' },
                  ] as const).map(opt => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setAccountType(opt.type)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                        accountType === opt.type
                          ? 'border-blue-950 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <opt.icon className={`w-4 h-4 shrink-0 ${accountType === opt.type ? 'text-blue-950' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-xs font-semibold ${accountType === opt.type ? 'text-blue-950' : 'text-gray-700'}`}>{opt.label}</div>
                        <div className="text-[10px] text-gray-400">{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  className="block w-full h-12 rounded-xl border border-gray-200 bg-blue-50/50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950/10 transition-colors"
                  placeholder="Rajan Mehta"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              className="block w-full h-12 rounded-xl border border-gray-200 bg-blue-50/50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950/10 transition-colors"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="block w-full h-12 rounded-xl border border-gray-200 bg-blue-50/50 px-4 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950/10 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            className="w-full h-12 flex items-center justify-center gap-2 bg-blue-950 text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }} className="font-semibold text-gray-900 hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError('') }} className="font-semibold text-gray-900 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>

        {mode === 'signup' && (
          <p className="mt-4 text-center text-[11px] text-gray-400">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>{' '}and{' '}
            <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
          </p>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

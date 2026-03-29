'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Eye, EyeOff, User, Briefcase, ArrowLeft } from 'lucide-react'
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
    <div className="min-h-screen bg-white flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[480px] shrink-0 bg-blue-950 flex-col justify-between p-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-[17px] font-semibold text-white tracking-tight">
              Ledgerly
            </span>
          </Link>

          <div>
            <h2 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-3xl font-bold text-white leading-tight mb-4">
              Know your numbers.<br />Always.
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              AI-powered bill scanning, supplier ledger, GST tracking — everything in one place.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              'Scan bills with Claude AI in seconds',
              'Track supplier balances automatically',
              'GST & TDS reports ready for filing',
              'Invite your accountant with one click',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-400 text-xs">© {new Date().getFullYear()} Ledgerly</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-[17px] font-semibold text-gray-900">Ledgerly</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {/* Back to home — subtle */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-8">
            <ArrowLeft className="w-3 h-3" /> Back to home
          </Link>

          <h1 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-2xl font-bold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {mode === 'login' ? 'Sign in to your Ledgerly account.' : 'Get started — it\'s free.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* Account type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account type</label>
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
                            : 'border-gray-200 hover:border-gray-300'
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

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full name</label>
                  <input type="text" className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950/10 transition-colors" placeholder="Rajan Mehta" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950/10 transition-colors" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              {mode === 'signup' && (
                <p className="text-[11px] text-gray-400 mb-1.5">Min. 6 characters · Mix of letters, numbers & symbols</p>
              )}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950/10 transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5">{error}</p>}
            {message && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">{message}</p>}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-950 text-white text-sm font-semibold py-3 rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {mode === 'login' ? (
              <>No account?{' '}
                <button onClick={() => { setMode('signup'); setError('') }} className="text-blue-950 font-semibold hover:underline">
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-blue-950 font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

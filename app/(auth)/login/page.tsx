'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, Eye, EyeOff, User, Briefcase } from 'lucide-react'

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
          options: { data: { name } },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-white tracking-tight">Ledgerly</h1>
          <p className="text-blue-200 mt-1 text-sm font-medium tracking-wide">Know your numbers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-heading text-lg font-semibold text-gray-900 mb-6">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* Account type selector */}
                <div>
                  <label className="label">Account type</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setAccountType('individual')}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        accountType === 'individual'
                          ? 'border-blue-900 bg-blue-50 text-blue-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">Individual</div>
                        <div className="text-xs text-gray-400 font-normal">Personal tracking</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('company')}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        accountType === 'company'
                          ? 'border-blue-900 bg-blue-50 text-blue-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">Company</div>
                        <div className="text-xs text-gray-400 font-normal">Team + accountant</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Full Name</label>
                  <input type="text" className="input" placeholder="Rajan Mehta" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </>
            )}

            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="label">Password</label>
              {mode === 'signup' && (
                <p className="text-xs text-gray-400 mb-1.5">Min. 6 characters &middot; Use a mix of letters, numbers &amp; symbols</p>
              )}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
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

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
            {message && <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">{message}</p>}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}<button onClick={() => { setMode('signup'); setError('') }} className="text-blue-900 font-medium hover:underline">Sign up</button></>
            ) : (
              <>Already have an account?{' '}<button onClick={() => { setMode('login'); setError('') }} className="text-blue-900 font-medium hover:underline">Sign in</button></>
            )}
          </div>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">AI-powered bill scanning &amp; expense tracking for businesses and individuals</p>
      </div>
    </div>
  )
}

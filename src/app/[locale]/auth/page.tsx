'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLocale } from 'next-intl'

export default function AuthPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !data.user) {
      setError(t('error'))
      setLoading(false)
      return
    }

    // Fetch role and redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const dest = profile?.role === 'admin'
      ? `/${locale}/admin/today`
      : `/${locale}/doctor/today`

    router.push(dest)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <span className="text-2xl font-bold text-white">G</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-muted mt-1">{t('subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="you@godoc.eg"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t('logging_in') : t('login')}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-8">
          Go Doc © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

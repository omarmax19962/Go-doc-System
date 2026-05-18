'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Copy, CheckCircle, Eye, EyeOff, RefreshCw, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { createDoctorAction } from '@/app/actions/doctor'

function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let p = ''
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p + 'A1!'
}

export default function NewDoctorPage() {
  const router = useRouter()
  const { locale } = useParams()
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [customPass, setCustomPass] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: generatePassword(),
    specialty: '',
    gender: 'male',
    bio: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function refreshPassword() {
    set('password', generatePassword())
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const result = await createDoctorAction({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      specialty: form.specialty,
      gender: form.gender,
      bio: form.bio,
      password: form.password,
    })

    if (result.error) {
      toast.error(result.error)
      setSaving(false)
      return
    }

    setCreatedCreds({ email: result.email!, password: result.tempPassword! })
    setSaving(false)
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white transition"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

  // ── Credentials modal ─────────────────────────────────────────
  if (createdCreds) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-border p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-bg mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Doctor Account Created</h1>
          <p className="text-sm text-muted mb-6">
            Share these credentials with <span className="font-medium text-gray-700">{form.full_name}</span>
          </p>

          <div className="bg-muted-bg rounded-xl p-4 space-y-3 text-left mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Email</p>
                <p className="text-sm font-mono font-medium text-gray-900">{createdCreds.email}</p>
              </div>
              <button
                onClick={() => copyToClipboard(createdCreds.email, 'Email')}
                className="p-2 hover:bg-border rounded-lg transition shrink-0"
              >
                <Copy className="w-4 h-4 text-muted" />
              </button>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Temporary password</p>
                <p className="text-sm font-mono font-medium text-gray-900">{createdCreds.password}</p>
              </div>
              <button
                onClick={() => copyToClipboard(createdCreds.password, 'Password')}
                className="p-2 hover:bg-border rounded-lg transition shrink-0"
              >
                <Copy className="w-4 h-4 text-muted" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted mb-5">
            Ask the doctor to change their password after first login.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const text = `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`
                copyToClipboard(text, 'Credentials')
              }}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
            >
              Copy both
            </button>
            <button
              onClick={() => router.push(`/${locale}/admin/doctors`)}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link
        href={`/${locale}/admin/doctors`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-5 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Doctors
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add New Doctor</h1>
          <p className="text-sm text-muted">A login account will be created automatically</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        {/* Personal info */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wide">Personal</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Full name *</label>
              <input
                required
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                className={inputCls}
                placeholder="Dr. Ahmed Ali"
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className={inputCls}
                placeholder="doctor@godoc.eg"
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className={inputCls}
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelCls}>Gender *</label>
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
                className={inputCls}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Specialty *</label>
              <input
                required
                value={form.specialty}
                onChange={e => set('specialty', e.target.value)}
                className={inputCls}
                placeholder="e.g. Musculoskeletal"
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Bio / About</label>
              <textarea
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                rows={3}
                className={inputCls + ' resize-none'}
                placeholder="Brief professional background..."
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted uppercase tracking-wide">Login Credentials</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={customPass}
                onChange={e => setCustomPass(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-xs text-muted">Set custom password</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  readOnly={!customPass}
                  className={inputCls + ' pr-10 font-mono' + (!customPass ? ' bg-muted-bg cursor-default' : '')}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gray-700"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!customPass && (
                <button
                  type="button"
                  onClick={refreshPassword}
                  className="px-3 py-2.5 border border-border rounded-lg hover:bg-muted-bg transition"
                  title="Generate new password"
                >
                  <RefreshCw className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted mt-1.5">
              {customPass
                ? 'Min 6 characters'
                : 'Auto-generated — you\'ll see it after account creation'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
          >
            {saving ? 'Creating account...' : 'Create Doctor Account'}
          </button>
        </div>
      </form>
    </div>
  )
}

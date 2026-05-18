'use client'

import { useState } from 'react'
import { submitApplicationAction } from '@/app/actions/apply'
import { Stethoscope, CheckCircle } from 'lucide-react'

export default function ApplyPage() {
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialty: '',
    gender: 'male',
    bio: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const result = await submitApplicationAction(form)

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSubmitted(true)
    setSaving(false)
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white transition"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-bg mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h1>
          <p className="text-muted text-sm">
            Thank you for applying to join Go Doc. Our team will review your application and get back to you soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Go Doc</h1>
          <p className="text-sm text-muted mt-1">Apply to join our physiotherapy team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Full name *</label>
                <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  className={inputCls} placeholder="Dr. Ahmed Ali" />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className={inputCls} placeholder="you@example.com" dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className={inputCls} placeholder="01xxxxxxxxx" dir="ltr" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Professional Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Specialty *</label>
                <input required value={form.specialty} onChange={e => set('specialty', e.target.value)}
                  className={inputCls} placeholder="e.g. Musculoskeletal" />
              </div>
              <div>
                <label className={labelCls}>Gender *</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>About you</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                  className={inputCls + ' resize-none'} rows={4}
                  placeholder="Brief background, years of experience, areas of expertise..." />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg text-sm transition disabled:opacity-60">
            {saving ? 'Submitting...' : 'Submit Application'}
          </button>

          <p className="text-center text-xs text-muted">
            Go Doc © {new Date().getFullYear()}
          </p>
        </form>
      </div>
    </div>
  )
}

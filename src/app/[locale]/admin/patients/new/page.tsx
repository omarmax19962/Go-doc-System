'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'
import type { PatientStatus, SourceChannel } from '@/types'

export default function NewPatientPage() {
  const router = useRouter()
  const { locale } = useParams()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    complaint: '',
    source_channel: 'phone' as SourceChannel,
    status: 'lead' as PatientStatus,
    referring_physician: '',
    notes: '',
    gender: '',
    address_text: '',  // simplified — Google Maps picker is Wave 2
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Your session has expired. Please log in again.')
      setSaving(false)
      return
    }

    const address = {
      place_id: '',
      display_name: form.address_text,
      lat: 0,
      lng: 0,
    }

    const { data, error } = await supabase
      .from('patients')
      .insert({
        full_name: form.full_name,
        phone: form.phone,
        complaint: form.complaint,
        source_channel: form.source_channel,
        status: form.status,
        referring_physician: form.referring_physician || null,
        notes: form.notes || null,
        gender: (form.gender as 'male' | 'female') || null,
        address,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) {
      toast.error(friendlyError(error.message))
      setSaving(false)
      return
    }

    toast.success('Patient created')
    router.push(`/${locale}/admin/patients/${data.id}`)
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">New Patient</h1>
        <p className="text-sm text-muted mt-0.5">Fill the required fields — aim for 90 seconds</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wide">Required</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full name *</label>
              <input
                required
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                className={inputCls}
                placeholder="Mona Ahmed"
              />
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className={inputCls}
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Chief complaint *</label>
            <input
              required
              value={form.complaint}
              onChange={e => set('complaint', e.target.value)}
              className={inputCls}
              placeholder="e.g. Low back pain after surgery"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Source channel *</label>
              <select
                value={form.source_channel}
                onChange={e => set('source_channel', e.target.value)}
                className={inputCls}
              >
                <option value="phone">Phone call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="referral">Referral</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Initial status *</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputCls}
              >
                <option value="lead">Lead</option>
                <option value="follow_up">Follow-up</option>
                <option value="booked">Booked</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Home address *</label>
            <input
              required
              value={form.address_text}
              onChange={e => set('address_text', e.target.value)}
              className={inputCls}
              placeholder="e.g. New Cairo, 5th Settlement"
            />
            <p className="text-xs text-muted mt-1">Google Maps picker coming in next update</p>
          </div>
        </div>

        {/* Optional fields */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wide">Optional</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Gender</label>
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
                className={inputCls}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Referring physician</label>
              <input
                value={form.referring_physician}
                onChange={e => set('referring_physician', e.target.value)}
                className={inputCls}
                placeholder="Dr. Name — Specialty"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Admin notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className={inputCls + ' h-20 resize-none'}
              placeholder="Any context for the team..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
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
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create Patient'}
          </button>
        </div>
      </form>
    </div>
  )
}

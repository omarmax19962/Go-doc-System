'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewDoctorPage() {
  const supabase = createClient()
  const router = useRouter()
  const { locale } = useParams()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
    gender: 'male',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Create auth user via admin (in production use service role key or edge function)
    // For local dev, we create the user through Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role: 'doctor',
          full_name: form.full_name,
          phone: form.phone,
        },
      },
    })

    if (authError || !authData.user) {
      toast.error('Failed to create user: ' + authError?.message)
      setSaving(false)
      return
    }

    // Create doctor record
    const { error: doctorError } = await supabase.from('doctors').insert({
      user_id: authData.user.id,
      specialty: form.specialty,
      gender: form.gender,
      covered_locations: [],
      is_active: true,
    })

    if (doctorError) {
      toast.error('User created but doctor profile failed: ' + doctorError.message)
      setSaving(false)
      return
    }

    toast.success(`Dr. ${form.full_name} added to the team`)
    router.push(`/${locale}/admin/doctors`)
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link
        href={`/${locale}/admin/doctors`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Doctors
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-5">Add New Doctor</h1>

      <form onSubmit={handleCreate} className="space-y-5">
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Full name *</label>
              <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                className={inputCls} placeholder="Dr. Ahmed Ali" />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className={inputCls} placeholder="doctor@godoc.eg" dir="ltr" />
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className={inputCls} placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
            <div>
              <label className={labelCls}>Temporary password *</label>
              <input required type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className={inputCls} placeholder="Min 6 characters" dir="ltr" />
            </div>
            <div>
              <label className={labelCls}>Gender *</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Specialty *</label>
              <input required value={form.specialty} onChange={e => set('specialty', e.target.value)}
                className={inputCls} placeholder="e.g. Musculoskeletal, Neurological, Pediatric" />
            </div>
          </div>

          <p className="text-xs text-muted">
            Coverage areas can be added after the doctor account is created.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60">
            {saving ? 'Creating...' : 'Create Doctor Account'}
          </button>
        </div>
      </form>
    </div>
  )
}

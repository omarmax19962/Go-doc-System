'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'
import { useRouter } from 'next/navigation'
import { CalendarPlus, X } from 'lucide-react'
import type { VisitType } from '@/types'

export default function NewVisitModal({
  patientId,
  doctors,
  locale,
}: {
  patientId: string
  doctors: any[]
  locale: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    doctor_id: '',
    type: 'assessment' as VisitType,
    scheduled_at: '',
    address_text: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCreate() {
    if (!form.doctor_id || !form.scheduled_at) {
      toast.error('Doctor and date/time are required')
      return
    }
    setSaving(true)

    const location = {
      place_id: '',
      display_name: form.address_text || 'Patient home address',
      lat: 0,
      lng: 0,
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('visits').insert({
      patient_id: patientId,
      doctor_id: form.doctor_id,
      type: form.type,
      status: 'scheduled',
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      location,
      payment_confirmed: false,
      created_by: user!.id,
    })

    if (error) {
      toast.error(friendlyError(error.message))
      setSaving(false)
      return
    }

    toast.success('Visit scheduled')
    setOpen(false)
    router.refresh()
    setSaving(false)
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition"
      >
        <CalendarPlus className="w-4 h-4" />
        Schedule Visit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Schedule New Visit</h2>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Visit type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['assessment', 'treatment', 'discharge'] as VisitType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => set('type', t)}
                      className={`py-2 rounded-lg text-sm font-medium border transition capitalize ${
                        form.type === t
                          ? 'bg-primary text-white border-primary'
                          : 'border-border text-gray-700 hover:bg-muted-bg'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Doctor *
                </label>
                <select
                  value={form.doctor_id}
                  onChange={e => set('doctor_id', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.profile?.full_name} — {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => set('scheduled_at', e.target.value)}
                  className={inputCls}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location (if different from home)
                </label>
                <input
                  value={form.address_text}
                  onChange={e => set('address_text', e.target.value)}
                  className={inputCls}
                  placeholder="Leave blank to use patient's home address"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
              >
                {saving ? 'Scheduling...' : 'Schedule Visit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

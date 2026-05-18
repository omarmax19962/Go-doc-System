'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { UserCog, X } from 'lucide-react'

export default function AssignDoctorModal({
  patientId,
  currentDoctorId,
  doctors,
}: {
  patientId: string
  currentDoctorId?: string
  doctors: any[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(currentDoctorId ?? '')
  const [saving, setSaving] = useState(false)

  async function handleAssign() {
    setSaving(true)
    const { error } = await supabase
      .from('patients')
      .update({ assigned_doctor_id: selected || null })
      .eq('id', patientId)

    if (error) {
      toast.error('Failed to assign doctor')
      setSaving(false)
      return
    }

    toast.success('Doctor assigned')
    setOpen(false)
    router.refresh()
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
      >
        <UserCog className="w-4 h-4" />
        Assign Doctor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Assign Doctor</h2>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted-bg">
                <input
                  type="radio"
                  name="doctor"
                  value=""
                  checked={selected === ''}
                  onChange={() => setSelected('')}
                />
                <span className="text-sm text-muted italic">Unassigned</span>
              </label>

              {doctors.map((doc: any) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted-bg"
                >
                  <input
                    type="radio"
                    name="doctor"
                    value={doc.id}
                    checked={selected === doc.id}
                    onChange={() => setSelected(doc.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.profile?.full_name}
                    </p>
                    <p className="text-xs text-muted">{doc.specialty}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

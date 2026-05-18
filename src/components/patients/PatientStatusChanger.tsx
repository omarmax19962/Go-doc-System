'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import PatientStatusBadge from '@/components/shared/PatientStatusBadge'
import type { PatientStatus } from '@/types'

const ALL_STATUSES: PatientStatus[] = [
  'lead', 'follow_up', 'didnt_reply', 'booked',
  'active', 'paused', 'discharged', 'lost'
]

const STATUS_LABELS: Record<PatientStatus, string> = {
  lead: 'Lead',
  follow_up: 'Follow-up',
  didnt_reply: "Didn't Reply",
  booked: 'Booked',
  active: 'Active',
  paused: 'Paused',
  discharged: 'Discharged',
  lost: 'Lost',
}

export default function PatientStatusChanger({
  patientId,
  currentStatus,
}: {
  patientId: string
  currentStatus: PatientStatus
}) {
  const supabase = createClient()
  const router = useRouter()
  const [selected, setSelected] = useState<PatientStatus>(currentStatus)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState(false)

  async function handleSave() {
    if (selected === currentStatus) return
    setSaving(true)

    const { error } = await supabase
      .from('patients')
      .update({ status: selected })
      .eq('id', patientId)

    if (error) {
      toast.error('Failed to update status')
      setSaving(false)
      return
    }

    // Log history
    await supabase.from('patient_status_history').insert({
      patient_id: patientId,
      from_status: currentStatus,
      to_status: selected,
      note: note || null,
    })

    toast.success(`Status updated to ${STATUS_LABELS[selected]}`)
    setChanged(false)
    setNote('')
    router.refresh()
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={e => {
          setSelected(e.target.value as PatientStatus)
          setChanged(e.target.value !== currentStatus)
        }}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
      >
        {ALL_STATUSES.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      {changed && (
        <>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Reason for change (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Update Status'}
          </button>
        </>
      )}
    </div>
  )
}

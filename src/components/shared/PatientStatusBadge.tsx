import type { PatientStatus } from '@/types'

const STYLES: Record<PatientStatus, { bg: string; text: string; label: string }> = {
  lead:         { bg: 'bg-info-bg',    text: 'text-info',    label: 'Lead' },
  follow_up:    { bg: 'bg-[#f3e8ff]',  text: 'text-[#7c3aed]', label: 'Follow-up' },
  didnt_reply:  { bg: 'bg-muted-bg',   text: 'text-muted',   label: "Didn't Reply" },
  booked:       { bg: 'bg-primary-light', text: 'text-primary', label: 'Booked' },
  active:       { bg: 'bg-success-bg', text: 'text-success', label: 'Active' },
  paused:       { bg: 'bg-warning-bg', text: 'text-warning', label: 'Paused' },
  discharged:   { bg: 'bg-muted-bg',   text: 'text-[#475569]', label: 'Discharged' },
  lost:         { bg: 'bg-danger-bg',  text: 'text-danger',  label: 'Lost' },
}

export default function PatientStatusBadge({ status }: { status: PatientStatus }) {
  const s = STYLES[status] ?? STYLES.lead
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

import type { NoteReviewStatus } from '@/types'

const STYLES: Record<NoteReviewStatus, { bg: string; text: string; label: string }> = {
  draft:                { bg: 'bg-muted-bg',    text: 'text-muted',   label: 'Draft' },
  submitted:            { bg: 'bg-info-bg',     text: 'text-info',    label: 'Submitted' },
  under_review:         { bg: 'bg-warning-bg',  text: 'text-warning', label: 'In Review' },
  approved:             { bg: 'bg-success-bg',  text: 'text-success', label: 'Approved' },
  approved_with_comment:{ bg: 'bg-success-bg',  text: 'text-success', label: 'Approved ✦' },
  returned:             { bg: 'bg-danger-bg',   text: 'text-danger',  label: 'Returned' },
}

export default function NoteReviewStatusBadge({ status }: { status: NoteReviewStatus }) {
  const s = STYLES[status] ?? STYLES.draft
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

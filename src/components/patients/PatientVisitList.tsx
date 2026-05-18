import { format } from 'date-fns'
import Link from 'next/link'
import NoteReviewStatusBadge from '@/components/shared/NoteReviewStatusBadge'
import type { VisitType, VisitStatus, NoteReviewStatus } from '@/types'

const TYPE_COLORS: Record<VisitType, string> = {
  assessment: 'bg-info',
  treatment: 'bg-primary',
  discharge: 'bg-warning',
}

const STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  rescheduled: 'Rescheduled',
}

export default function PatientVisitList({
  visits,
  locale,
  role,
}: {
  visits: any[]
  locale: string
  role: 'admin' | 'doctor'
}) {
  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-bold text-gray-900">
          Visits ({visits.length})
        </h2>
      </div>

      {visits.length > 0 ? (
        <div className="divide-y divide-border">
          {visits.map(visit => {
            const note = Array.isArray(visit.note) ? visit.note[0] : visit.note
            const basePath = role === 'admin'
              ? `/${locale}/doctor/visits/${visit.id}`
              : `/${locale}/doctor/visits/${visit.id}`

            return (
              <div key={visit.id} className="px-4 py-3 flex items-center gap-4">
                {/* Type indicator */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${TYPE_COLORS[visit.type as VisitType] ?? 'bg-muted'}`} />

                {/* Date/time */}
                <div className="w-28 shrink-0">
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(visit.scheduled_at), 'd MMM yyyy')}
                  </p>
                  <p className="text-xs text-muted">
                    {format(new Date(visit.scheduled_at), 'h:mm a')}
                  </p>
                </div>

                {/* Type */}
                <div className="w-24 shrink-0">
                  <span className="text-xs font-medium text-gray-600 capitalize">{visit.type}</span>
                </div>

                {/* Doctor (admin only) */}
                {role === 'admin' && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted truncate">
                      {visit.doctor?.profile?.full_name ?? 'Unassigned'}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="shrink-0">
                  <span className="text-xs text-muted">
                    {STATUS_LABELS[visit.status as VisitStatus] ?? visit.status}
                  </span>
                </div>

                {/* Note status */}
                {note && (
                  <div className="shrink-0">
                    <NoteReviewStatusBadge status={note.review_status as NoteReviewStatus} />
                  </div>
                )}

                {/* Link */}
                <Link
                  href={`/${locale}/doctor/visits/${visit.id}`}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  {note ? 'View note' : visit.status === 'scheduled' ? 'Start' : 'Open'}
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-muted text-sm">
          No visits yet
        </div>
      )}
    </div>
  )
}

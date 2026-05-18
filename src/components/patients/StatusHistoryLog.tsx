import { format } from 'date-fns'
import type { PatientStatus } from '@/types'
import PatientStatusBadge from '@/components/shared/PatientStatusBadge'

export default function StatusHistoryLog({ history }: { history: any[] }) {
  if (!history.length) return null

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-bold text-gray-900">Status History</h2>
      </div>
      <div className="divide-y divide-border">
        {history.map(entry => (
          <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.from_status && (
                  <>
                    <PatientStatusBadge status={entry.from_status as PatientStatus} />
                    <span className="text-xs text-muted">→</span>
                  </>
                )}
                <PatientStatusBadge status={entry.to_status as PatientStatus} />
              </div>
              {entry.note && (
                <p className="text-xs text-muted mt-1">{entry.note}</p>
              )}
            </div>
            <div className="text-xs text-muted shrink-0">
              {format(new Date(entry.created_at), 'd MMM, h:mm a')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

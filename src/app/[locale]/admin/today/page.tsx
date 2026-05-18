import { createServerSupabaseClient } from '@/lib/supabase'
import { format, startOfDay, endOfDay } from 'date-fns'
import VisitCard from '@/components/admin/VisitCard'
import TodayStats from '@/components/admin/TodayStats'

export default async function AdminTodayPage() {
  const supabase = await createServerSupabaseClient()
  const today = new Date()

  const { data: visits } = await supabase
    .from('visits')
    .select(`
      *,
      patient:patients(id, full_name, phone, complaint, status),
      doctor:doctors(id, specialty, user_id,
        profile:profiles(full_name, phone)
      )
    `)
    .gte('scheduled_at', startOfDay(today).toISOString())
    .lte('scheduled_at', endOfDay(today).toISOString())
    .order('scheduled_at', { ascending: true })

  const stats = {
    total: visits?.length ?? 0,
    completed: visits?.filter(v => v.status === 'completed').length ?? 0,
    in_progress: visits?.filter(v => v.status === 'in_progress').length ?? 0,
    cancelled: visits?.filter(v => v.status === 'cancelled').length ?? 0,
    no_show: visits?.filter(v => v.status === 'no_show').length ?? 0,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {format(today, 'EEEE, d MMMM yyyy')}
        </h1>
        <p className="text-sm text-muted mt-0.5">Operations Command Center</p>
      </div>

      {/* Stats row */}
      <TodayStats stats={stats} />

      {/* Visit list */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Today&apos;s Visits ({stats.total})
        </h2>

        {visits && visits.length > 0 ? (
          <div className="space-y-3">
            {visits.map(visit => (
              <VisitCard key={visit.id} visit={visit} role="admin" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted">
            <p className="text-lg">No visits scheduled for today</p>
            <p className="text-sm mt-1">Use &ldquo;New Patient&rdquo; to book the first one</p>
          </div>
        )}
      </div>
    </div>
  )
}

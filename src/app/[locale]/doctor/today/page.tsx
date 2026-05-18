import { createServerSupabaseClient } from '@/lib/supabase-server'
import { format, startOfDay, endOfDay } from 'date-fns'
import VisitCard from '@/components/admin/VisitCard'

export default async function DoctorTodayPage() {
  const supabase = await createServerSupabaseClient()
  const today = new Date()

  // Get current doctor
  const { data: { user } } = await supabase.auth.getUser()
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: visits } = await supabase
    .from('visits')
    .select(`
      *,
      patient:patients(id, full_name, phone, complaint, status)
    `)
    .eq('doctor_id', doctor!.id)
    .gte('scheduled_at', startOfDay(today).toISOString())
    .lte('scheduled_at', endOfDay(today).toISOString())
    .order('scheduled_at', { ascending: true })

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">
          {format(today, 'EEEE, d MMM')}
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {visits?.length ?? 0} visits today
        </p>
      </div>

      {visits && visits.length > 0 ? (
        <div className="space-y-3">
          {visits.map(visit => (
            <VisitCard key={visit.id} visit={visit} role="doctor" />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted">
          <p className="text-lg">No visits today</p>
          <p className="text-sm mt-1">Enjoy your day off</p>
        </div>
      )}
    </div>
  )
}

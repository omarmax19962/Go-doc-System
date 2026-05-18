import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import PatientStatusBadge from '@/components/shared/PatientStatusBadge'
import { ChevronRight } from 'lucide-react'
import type { PatientStatus } from '@/types'

export default async function DoctorPatientsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: doctor } = await supabase
    .from('doctors').select('id').eq('user_id', user!.id).single()

  const { data: patients } = await supabase
    .from('patients').select('*')
    .eq('assigned_doctor_id', doctor?.id)
    .order('updated_at', { ascending: false })

  const active = patients?.filter(p => ['active','booked'].includes(p.status)) ?? []
  const others = patients?.filter(p => !['active','booked'].includes(p.status)) ?? []

  function PatientRow({ patient }: { patient: any }) {
    return (
      <Link href={`/${locale}/doctor/patients/${patient.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted-bg transition">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{patient.full_name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{patient.full_name}</p>
          <p className="text-xs text-muted truncate">{patient.complaint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PatientStatusBadge status={patient.status as PatientStatus} />
          <ChevronRight className="w-4 h-4 text-muted" />
        </div>
      </Link>
    )
  }

  return (
    <div className="px-4 pt-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-5">My Patients ({patients?.length ?? 0})</h1>
      {active.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Active ({active.length})</p>
          <div className="bg-white rounded-xl border border-border divide-y divide-border">
            {active.map(p => <PatientRow key={p.id} patient={p} />)}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Other ({others.length})</p>
          <div className="bg-white rounded-xl border border-border divide-y divide-border">
            {others.map(p => <PatientRow key={p.id} patient={p} />)}
          </div>
        </div>
      )}
      {!patients?.length && (
        <div className="text-center py-16 text-muted">
          <p>No patients assigned yet</p>
        </div>
      )}
    </div>
  )
}

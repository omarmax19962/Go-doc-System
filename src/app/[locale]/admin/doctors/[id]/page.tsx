import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ManageDoctorClient from './ManageDoctorClient'

export default async function ManageDoctorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*, profile:profiles(id, full_name, phone)')
    .eq('id', id)
    .single()

  if (!doctor) notFound()

  const profile = doctor.profile as any
  const locations = (doctor.covered_locations as any[]) ?? []

  // Stats
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_doctor_id', id)

  const { count: totalVisits } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', id)

  const { count: completedVisits } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', id)
    .eq('status', 'completed')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href={`/${locale}/admin/doctors`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Doctors
      </Link>

      <ManageDoctorClient
        doctor={doctor}
        profile={profile}
        locations={locations}
        stats={{
          totalPatients: totalPatients ?? 0,
          totalVisits: totalVisits ?? 0,
          completedVisits: completedVisits ?? 0,
        }}
        locale={locale}
      />
    </div>
  )
}

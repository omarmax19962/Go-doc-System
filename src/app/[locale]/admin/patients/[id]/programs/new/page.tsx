import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import ProgramFormBuilder from '@/components/programs/ProgramFormBuilder'

export default async function NewProgramPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('id, full_name, assigned_doctor_id')
    .eq('id', id)
    .single()

  if (!patient) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  let doctorId = patient.assigned_doctor_id

  // If admin is creating, use assigned doctor or first available
  if (profile?.role === 'admin' && !doctorId) {
    const { data: firstDoctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()
    doctorId = firstDoctor?.id ?? null
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href={`/${locale}/admin/patients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        {patient.full_name}
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-5">New Program</h1>

      <ProgramFormBuilder
        patientId={id}
        doctorId={doctorId ?? ''}
        visitType="assessment"
        locale={locale}
      />
    </div>
  )
}

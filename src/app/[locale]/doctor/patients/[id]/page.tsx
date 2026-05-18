import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ChevronLeft, Phone, MapPin, FileText } from 'lucide-react'
import Link from 'next/link'
import PatientStatusBadge from '@/components/shared/PatientStatusBadge'
import PatientVisitList from '@/components/patients/PatientVisitList'
import type { PatientStatus } from '@/types'

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createServerSupabaseClient()

  // Verify this patient is assigned to the current doctor
  const { data: { user } } = await supabase.auth.getUser()
  const { data: doctor } = await supabase
    .from('doctors').select('id').eq('user_id', user!.id).single()

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('assigned_doctor_id', doctor?.id) // RLS enforces this too
    .single()

  if (!patient) notFound()

  const { data: visits } = await supabase
    .from('visits')
    .select(`*, note:visit_notes(id, review_status, quick_sheet)`)
    .eq('patient_id', id)
    .order('scheduled_at', { ascending: false })

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  const address = patient.address as any

  return (
    <div className="px-4 pt-6 pb-6 max-w-2xl mx-auto">
      <Link
        href={`/${locale}/doctor/patients`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        My Patients
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-primary">{patient.full_name.charAt(0)}</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{patient.full_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <PatientStatusBadge status={patient.status as PatientStatus} />
            {patient.date_of_birth && (
              <span className="text-xs text-muted">
                {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} yrs
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-2.5">
        <p className="text-sm text-gray-800"><span className="font-semibold">Complaint:</span> {patient.complaint}</p>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-muted" />
          <a href={`tel:${patient.phone}`} className="text-sm text-primary">{patient.phone}</a>
        </div>
        {address?.display_name && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-muted" />
            <p className="text-sm text-gray-700">{address.display_name}</p>
          </div>
        )}
        {patient.referring_physician && (
          <p className="text-xs text-muted">Ref: {patient.referring_physician}</p>
        )}
      </div>

      {/* Programs */}
      {programs && programs.length > 0 && (
        <div className="bg-white rounded-xl border border-border mb-4">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Programs ({programs.length})</h2>
            <Link
              href={`/${locale}/doctor/patients/${id}/programs/new`}
              className="text-xs font-medium text-primary hover:text-primary-dark"
            >
              + New
            </Link>
          </div>
          <div className="divide-y divide-border">
            {programs.map(p => (
              <Link
                key={p.id}
                href={`/${locale}/doctor/patients/${id}/programs/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted-bg transition"
              >
                <FileText className="w-4 h-4 text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.source === 'uploaded'
                      ? p.uploaded_file_name ?? 'Uploaded program'
                      : (p.form_data as any)?.primary_diagnosis ?? 'Program'}
                  </p>
                  <p className="text-xs text-muted">{format(new Date(p.created_at), 'd MMM yyyy')}</p>
                </div>
                {p.is_active && (
                  <span className="text-xs text-success font-semibold shrink-0">Active</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Visits */}
      <PatientVisitList visits={visits ?? []} locale={locale} role="doctor" />
    </div>
  )
}

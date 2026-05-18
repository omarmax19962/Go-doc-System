import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import PatientStatusBadge from '@/components/shared/PatientStatusBadge'
import PatientStatusChanger from '@/components/patients/PatientStatusChanger'
import PatientProgramList from '@/components/patients/PatientProgramList'
import AssignDoctorModal from '@/components/patients/AssignDoctorModal'
import NewVisitModal from '@/components/patients/NewVisitModal'
import SessionLog from '@/components/patients/SessionLog'
import { Phone, MapPin, ChevronLeft, User, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import type { PatientStatus } from '@/types'

export default async function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: patient } = await supabase
    .from('patients')
    .select(`
      *,
      assigned_doctor:doctors(
        id, specialty, gender,
        profile:profiles(full_name, phone)
      )
    `)
    .eq('id', id)
    .single()

  if (!patient) notFound()

  const [
    { data: sessions },
    { data: visits },
    { data: programs },
    { data: doctors },
  ] = await Promise.all([
    supabase
      .from('clinic_sessions')
      .select('*')
      .eq('patient_id', id)
      .order('date', { ascending: false }),
    supabase
      .from('visits')
      .select(`*, doctor:doctors(id, profile:profiles(full_name)), note:visit_notes(id, review_status, quick_sheet)`)
      .eq('patient_id', id)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('programs')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('doctors')
      .select('id, specialty, covered_locations, profile:profiles(full_name)')
      .eq('is_active', true),
  ])

  const address = patient.address as { display_name?: string } | null
  const assignedDoctor = patient.assigned_doctor as any
  const secondaryDx = (patient.secondary_diagnoses as any[]) ?? []

  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null

  // Get doctor_id for session logging (the assigned doctor's doctors.id)
  const assignedDoctorId = assignedDoctor?.id ?? null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href={`/${locale}/admin/patients`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-5 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Patients
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {patient.full_name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{patient.full_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <PatientStatusBadge status={patient.status as PatientStatus} />
                {age && <span className="text-xs text-muted">{age} yrs</span>}
                {patient.gender && (
                  <span className="text-xs text-muted capitalize">{patient.gender}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <NewVisitModal patientId={id} doctors={doctors ?? []} locale={locale} />
            <AssignDoctorModal
              patientId={id}
              currentDoctorId={assignedDoctor?.id}
              doctors={doctors ?? []}
            />
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
            <a href={`tel:${patient.phone}`} className="text-primary hover:underline">
              {patient.phone}
            </a>
          </div>

          {address?.display_name && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
              <p className="text-gray-700">{address.display_name}</p>
            </div>
          )}

          {patient.primary_diagnosis && (
            <div className="flex items-start gap-2 col-span-2">
              <Stethoscope className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-900 font-medium">{patient.primary_diagnosis}</span>
                {patient.primary_icd && (
                  <span className="ml-1.5 text-xs text-muted font-mono">{patient.primary_icd}</span>
                )}
                {secondaryDx.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {secondaryDx.map((d: any, i: number) => (
                      <span key={i} className="text-xs bg-muted-bg text-muted px-2 py-0.5 rounded-full">
                        {d.name} {d.icd_hint && <span className="font-mono">{d.icd_hint}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {patient.referring_physician && (
            <div className="flex items-center gap-2 col-span-2">
              <User className="w-3.5 h-3.5 text-muted shrink-0" />
              <p className="text-gray-700">Ref: {patient.referring_physician}</p>
            </div>
          )}
        </div>

        {/* Complaint */}
        <div className="mt-4 bg-muted-bg rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">Chief complaint</p>
          <p className="text-sm text-gray-800">{patient.complaint}</p>
        </div>
      </div>

      {/* Two-column: left = sidebar, right = main content */}
      <div className="grid grid-cols-3 gap-5">
        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          {/* Assigned Doctor */}
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Doctor</p>
            {assignedDoctor ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {assignedDoctor.profile?.full_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {assignedDoctor.profile?.full_name}
                  </p>
                  <p className="text-xs text-muted">{assignedDoctor.specialty}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted italic">Not assigned</p>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Status</p>
            <PatientStatusChanger
              patientId={id}
              currentStatus={patient.status as PatientStatus}
            />
          </div>

          {/* Admin notes */}
          {patient.notes && (
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-700">{patient.notes}</p>
            </div>
          )}

          {/* Programs */}
          <PatientProgramList
            programs={programs ?? []}
            patientId={id}
            locale={locale}
          />
        </div>

        {/* Main content — session log + pain chart */}
        <div className="col-span-2">
          <SessionLog
            patientId={id}
            patientName={patient.full_name}
            doctorId={assignedDoctorId}
            sessions={sessions ?? []}
            locale={locale}
            role="admin"
          />
        </div>
      </div>
    </div>
  )
}

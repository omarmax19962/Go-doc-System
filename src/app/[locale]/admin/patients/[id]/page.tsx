import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import PatientStatusBadge from '@/components/shared/PatientStatusBadge'
import PatientStatusChanger from '@/components/patients/PatientStatusChanger'
import PatientVisitList from '@/components/patients/PatientVisitList'
import PatientProgramList from '@/components/patients/PatientProgramList'
import AssignDoctorModal from '@/components/patients/AssignDoctorModal'
import NewVisitModal from '@/components/patients/NewVisitModal'
import StatusHistoryLog from '@/components/patients/StatusHistoryLog'
import { Phone, MapPin, User, Calendar, Clock, ChevronLeft } from 'lucide-react'
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

  const { data: statusHistory } = await supabase
    .from('patient_status_history')
    .select('*, changed_by_profile:profiles(full_name)')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  const { data: visits } = await supabase
    .from('visits')
    .select(`
      *,
      doctor:doctors(id, profile:profiles(full_name)),
      note:visit_notes(id, review_status, quick_sheet)
    `)
    .eq('patient_id', id)
    .order('scheduled_at', { ascending: false })

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  const { data: doctors } = await supabase
    .from('doctors')
    .select('id, specialty, covered_locations, profile:profiles(full_name)')
    .eq('is_active', true)

  const address = patient.address as { display_name?: string } | null
  const assignedDoctor = patient.assigned_doctor as any

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href={`/${locale}/admin/patients`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-5 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Patients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {patient.full_name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{patient.full_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <PatientStatusBadge status={patient.status as PatientStatus} />
              <span className="text-xs text-muted">
                Added {format(new Date(patient.created_at), 'd MMM yyyy')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NewVisitModal patientId={id} doctors={doctors ?? []} locale={locale} />
          <AssignDoctorModal
            patientId={id}
            currentDoctorId={assignedDoctor?.id}
            doctors={doctors ?? []}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left column — patient info */}
        <div className="col-span-1 space-y-4">
          {/* Contact */}
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Contact</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-muted shrink-0" />
                <a href={`tel:${patient.phone}`} className="text-sm text-primary hover:underline">
                  {patient.phone}
                </a>
              </div>
              {address?.display_name && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{address.display_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Clinical */}
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Clinical</p>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-muted">Chief complaint</p>
                <p className="text-sm text-gray-800 mt-0.5">{patient.complaint}</p>
              </div>
              {patient.gender && (
                <div>
                  <p className="text-xs text-muted">Gender</p>
                  <p className="text-sm text-gray-800 mt-0.5 capitalize">{patient.gender}</p>
                </div>
              )}
              {patient.date_of_birth && (
                <div>
                  <p className="text-xs text-muted">Date of birth</p>
                  <p className="text-sm text-gray-800 mt-0.5">
                    {format(new Date(patient.date_of_birth), 'd MMM yyyy')}
                  </p>
                </div>
              )}
              {patient.referring_physician && (
                <div>
                  <p className="text-xs text-muted">Referring physician</p>
                  <p className="text-sm text-gray-800 mt-0.5">{patient.referring_physician}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned doctor */}
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Assigned Doctor</p>
            {assignedDoctor ? (
              <div className="flex items-center gap-3">
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
              <p className="text-sm text-muted italic">No doctor assigned</p>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
              Update Status
            </p>
            <PatientStatusChanger
              patientId={id}
              currentStatus={patient.status as PatientStatus}
            />
          </div>

          {/* Admin notes */}
          {patient.notes && (
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Admin Notes</p>
              <p className="text-sm text-gray-700">{patient.notes}</p>
            </div>
          )}
        </div>

        {/* Right column — visits, programs, history */}
        <div className="col-span-2 space-y-5">
          {/* Programs */}
          <PatientProgramList
            programs={programs ?? []}
            patientId={id}
            locale={locale}
          />

          {/* Visits */}
          <PatientVisitList visits={visits ?? []} locale={locale} role="admin" />

          {/* Status history */}
          <StatusHistoryLog history={statusHistory ?? []} />
        </div>
      </div>
    </div>
  )
}

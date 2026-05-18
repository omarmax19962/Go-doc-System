import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { MapPin, Phone, ChevronLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import VisitActions from '@/components/visits/VisitActions'
import QuickSheetForm from '@/components/visits/QuickSheetForm'
import FullSheetForm from '@/components/visits/FullSheetForm'
import type { VisitType, VisitStatus } from '@/types'

const TYPE_LABELS: Record<VisitType, string> = {
  assessment: 'Assessment Visit',
  treatment: 'Treatment Visit',
  discharge: 'Discharge Visit',
}

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: visit } = await supabase
    .from('visits')
    .select(`
      *,
      patient:patients(id, full_name, phone, complaint, address, assigned_doctor_id),
      doctor:doctors(id, user_id, profile:profiles(full_name))
    `)
    .eq('id', id)
    .single()

  if (!visit) notFound()

  const { data: note } = await supabase
    .from('visit_notes')
    .select('*')
    .eq('visit_id', id)
    .maybeSingle()

  const { data: programs } = await supabase
    .from('programs')
    .select('id, source, form_data, uploaded_file_name, is_active')
    .eq('patient_id', visit.patient_id)
    .eq('is_active', true)

  // Check if current user is the assigned doctor
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentDoctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const isOwnVisit = currentDoctor?.id === visit.doctor_id
  const patient = visit.patient as any
  const location = visit.location as any

  // Determine if full sheet is default for this visit type
  const defaultFullSheet = visit.type === 'assessment' || visit.type === 'discharge'

  return (
    <div className="px-4 pt-6 pb-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href={`/${locale}/doctor/today`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Today
      </Link>

      {/* Visit header */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
              {TYPE_LABELS[visit.type as VisitType]}
            </p>
            <h1 className="text-lg font-bold text-gray-900">{patient?.full_name}</h1>
            <p className="text-sm text-muted mt-0.5">{patient?.complaint}</p>
          </div>
          <VisitActions
            visitId={id}
            visitStatus={visit.status as VisitStatus}
            isOwnVisit={isOwnVisit}
          />
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-muted" />
            <a href={`tel:${patient?.phone}`} className="text-sm text-primary">
              {patient?.phone}
            </a>
          </div>
          {location?.display_name && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted" />
              <button
                onClick={() => window.open(
                  `https://maps.google.com/?q=${location.lat},${location.lng}`,
                  '_blank'
                )}
                className="text-sm text-primary"
              >
                {location.display_name}
              </button>
            </div>
          )}
          <div className="ms-auto text-xs text-muted">
            {format(new Date(visit.scheduled_at), 'h:mm a · d MMM')}
          </div>
        </div>
      </div>

      {/* Active programs reference */}
      {programs && programs.length > 0 && (
        <div className="bg-primary-light rounded-xl border border-primary/20 p-3 mb-4">
          <p className="text-xs font-bold text-primary mb-2">Active Program</p>
          {programs.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">
                {p.source === 'uploaded'
                  ? p.uploaded_file_name
                  : (p.form_data as any)?.primary_diagnosis ?? 'Program'}
              </span>
              <Link
                href={`/${locale}/doctor/patients/${visit.patient_id}/programs/${p.id}`}
                className="text-xs underline text-primary ms-auto"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Documentation */}
      {visit.status === 'completed' || visit.status === 'in_progress' || note ? (
        <QuickSheetForm
          visitId={id}
          visitType={visit.type as VisitType}
          existingNote={note}
          defaultFullSheet={defaultFullSheet}
          programs={programs ?? []}
          isOwnVisit={isOwnVisit}
          locale={locale}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border p-5 text-center text-muted">
          <p className="text-sm">Start the visit to begin documentation</p>
        </div>
      )}
    </div>
  )
}

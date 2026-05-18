import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function ProgramViewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; pid: string }>
}) {
  const { locale, id, pid } = await params
  const supabase = await createServerSupabaseClient()

  const { data: program } = await supabase
    .from('programs').select('*').eq('id', pid).single()
  if (!program) notFound()

  const fd = program.form_data as any

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/${locale}/admin/patients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition">
        <ChevronLeft className="w-4 h-4" />
        Patient file
      </Link>

      {program.source === 'uploaded' ? (
        <div className="bg-white rounded-xl border border-border p-6 text-center">
          <p className="font-bold text-gray-900 mb-2">{program.uploaded_file_name}</p>
          <p className="text-sm text-muted mb-4">Uploaded document — view or download below</p>
          {program.uploaded_file_url && (
            <a href={program.uploaded_file_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
              <Download className="w-4 h-4" />
              Open Document
            </a>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{fd?.primary_diagnosis}</h1>
            <p className="text-sm text-muted mt-1">
              {fd?.duration_weeks} weeks · {fd?.phase_count} phase{fd?.phase_count > 1 ? 's' : ''}
              {fd?.referring_physician && ` · Ref: ${fd.referring_physician}`}
            </p>
          </div>

          {fd?.phases?.map((phase: any, i: number) => (
            <div key={i} className="p-4 bg-muted-bg rounded-xl">
              <p className="text-sm font-bold text-gray-900 mb-1">Phase {phase.number}: {phase.goal}</p>
              <p className="text-xs text-muted">{phase.weeks} weeks · {phase.visits_per_week}×/week</p>
            </div>
          ))}

          {fd?.baseline_assessment?.notes && (
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Baseline</p>
              <p className="text-sm text-gray-700">{fd.baseline_assessment.notes}</p>
            </div>
          )}

          {fd?.red_flags?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Red Flags</p>
              {fd.red_flags.map((rf: any, i: number) => (
                <p key={i} className="text-sm text-danger">⚠ {rf.description}</p>
              ))}
            </div>
          )}

          <Link href={`/${locale}/admin/patients/${id}/programs/${pid}/edit`}
            className="inline-block px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary-light transition">
            Edit Program
          </Link>
        </div>
      )}
    </div>
  )
}

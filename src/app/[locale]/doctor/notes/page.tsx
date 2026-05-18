import { createServerSupabaseClient } from '@/lib/supabase-server'
import { format } from 'date-fns'
import NoteReviewStatusBadge from '@/components/shared/NoteReviewStatusBadge'
import Link from 'next/link'
import type { NoteReviewStatus } from '@/types'

export default async function DoctorNotesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: notes } = await supabase
    .from('visit_notes')
    .select(`
      *,
      visit:visits(
        id, type, scheduled_at,
        patient:patients(full_name, complaint)
      )
    `)
    .eq('doctor_id', doctor?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const drafts = notes?.filter(n => n.review_status === 'draft') ?? []
  const submitted = notes?.filter(n => n.review_status !== 'draft') ?? []

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-5">My Notes</h1>

      {/* Drafts — batch submit */}
      {drafts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted uppercase tracking-wide">
              Drafts ({drafts.length})
            </p>
            <button className="text-xs font-semibold text-primary hover:text-primary-dark transition">
              Submit all for review
            </button>
          </div>
          <div className="space-y-2">
            {drafts.map(note => (
              <NoteRow key={note.id} note={note} isDraft />
            ))}
          </div>
        </div>
      )}

      {/* Submitted / reviewed */}
      {submitted.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
            Submitted ({submitted.length})
          </p>
          <div className="space-y-2">
            {submitted.map(note => (
              <NoteRow key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {!notes?.length && (
        <div className="text-center py-20 text-muted">
          <p>No notes yet</p>
          <p className="text-sm mt-1">Notes appear here after you complete a visit</p>
        </div>
      )}
    </div>
  )
}

function NoteRow({ note, isDraft }: { note: any; isDraft?: boolean }) {
  const visit = note.visit
  const patient = visit?.patient

  return (
    <div className="bg-white rounded-xl border border-border px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {patient?.full_name ?? 'Unknown'}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {visit?.type} · {visit?.scheduled_at
            ? format(new Date(visit.scheduled_at), 'd MMM yyyy')
            : ''}
        </p>
        {note.review_comment && note.review_status === 'returned' && (
          <p className="text-xs text-danger mt-1 font-medium">
            ↩ Returned: {note.review_comment}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <NoteReviewStatusBadge status={note.review_status as NoteReviewStatus} />
        {isDraft && (
          <button className="text-xs font-semibold text-primary hover:text-primary-dark">
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

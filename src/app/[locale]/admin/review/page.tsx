import { createServerSupabaseClient } from '@/lib/supabase'
import { format } from 'date-fns'
import ReviewNoteCard from '@/components/admin/ReviewNoteCard'

export default async function AdminReviewPage() {
  const supabase = await createServerSupabaseClient()

  const { data: notes } = await supabase
    .from('visit_notes')
    .select(`
      *,
      visit:visits(
        id, type, scheduled_at,
        patient:patients(full_name, complaint)
      ),
      doctor:doctors(
        id,
        profile:profiles(full_name)
      )
    `)
    .in('review_status', ['submitted', 'under_review'])
    .order('submitted_at', { ascending: true })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Note Review</h1>
        <p className="text-sm text-muted mt-0.5">
          {notes?.length ?? 0} notes awaiting review — oldest first
        </p>
      </div>

      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map(note => (
            <ReviewNoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-border">
          <p className="text-lg text-gray-900 font-medium">All caught up</p>
          <p className="text-sm text-muted mt-1">No notes waiting for review</p>
        </div>
      )}
    </div>
  )
}

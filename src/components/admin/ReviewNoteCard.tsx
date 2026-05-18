'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, CheckCircle, MessageSquare, RotateCcw } from 'lucide-react'
import type { QuickSheet, PatientResponse } from '@/types'

const RESPONSE_LABELS: Record<PatientResponse, string> = {
  better: '✅ Better',
  same: '➡️ Same',
  worse: '⬇️ Worse',
  mixed: '↕️ Mixed',
}

export default function ReviewNoteCard({ note }: { note: any }) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)
  const [loading, setLoading] = useState(false)

  const qs = note.quick_sheet as QuickSheet
  const patient = note.visit?.patient
  const doctorName = note.doctor?.profile?.full_name

  async function review(action: 'approve' | 'approve_with_comment' | 'send_back') {
    if ((action === 'approve_with_comment' || action === 'send_back') && !comment.trim()) {
      toast.error('A comment is required for this action')
      return
    }

    setLoading(true)

    const newStatus = action === 'approve'
      ? 'approved'
      : action === 'approve_with_comment'
        ? 'approved_with_comment'
        : 'returned'

    const { error } = await supabase
      .from('visit_notes')
      .update({
        review_status: newStatus,
        reviewed_at: new Date().toISOString(),
        review_comment: comment || null,
      })
      .eq('id', note.id)

    if (error) {
      toast.error('Failed to review note')
      setLoading(false)
      return
    }

    // Log review action
    await supabase.from('review_actions').insert({
      note_id: note.id,
      action,
      comment: comment || null,
    })

    toast.success(
      action === 'approve' ? 'Note approved' :
      action === 'approve_with_comment' ? 'Approved with comment' :
      'Returned for revision'
    )

    // Refresh
    window.location.reload()
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted-bg transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {patient?.full_name ?? 'Unknown'}
            </p>
            <p className="text-xs text-muted mt-0.5">{patient?.complaint}</p>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <p className="text-xs text-muted">Doctor</p>
            <p className="text-xs font-medium text-gray-700">{doctorName}</p>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <p className="text-xs text-muted">Submitted</p>
            <p className="text-xs font-medium text-gray-700">
              {note.submitted_at
                ? format(new Date(note.submitted_at), 'd MMM, h:mm a')
                : '—'}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted" />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Quick sheet */}
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Quick Sheet</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-muted-bg rounded-lg px-3 py-2.5">
                <p className="text-xs text-muted">Pain Before</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{qs.pain_before}<span className="text-sm font-normal text-muted">/10</span></p>
              </div>
              <div className="bg-muted-bg rounded-lg px-3 py-2.5">
                <p className="text-xs text-muted">Pain After</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{qs.pain_after}<span className="text-sm font-normal text-muted">/10</span></p>
              </div>
              <div className="bg-muted-bg rounded-lg px-3 py-2.5">
                <p className="text-xs text-muted">Response</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {RESPONSE_LABELS[qs.patient_response as PatientResponse] ?? qs.patient_response}
                </p>
              </div>
              <div className="bg-muted-bg rounded-lg px-3 py-2.5">
                <p className="text-xs text-muted">Red Flags</p>
                <p className={`text-sm font-semibold mt-0.5 ${qs.red_flags_noted ? 'text-danger' : 'text-success'}`}>
                  {qs.red_flags_noted ? '⚠️ Yes' : '✓ None'}
                </p>
              </div>
            </div>

            {qs.what_was_done?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted mb-1">What was done</p>
                <div className="flex flex-wrap gap-1.5">
                  {qs.what_was_done.map((item: string, i: number) => (
                    <span key={i} className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {qs.red_flags_detail && (
              <div className="mt-3 p-3 bg-danger-bg rounded-lg">
                <p className="text-xs font-semibold text-danger">Red flag detail</p>
                <p className="text-sm text-danger mt-1">{qs.red_flags_detail}</p>
              </div>
            )}
          </div>

          {/* Full sheet if present */}
          {note.full_sheet && (
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Full Sheet (SOAP)</p>
              {['subjective', 'objective', 'assessment', 'plan'].map(key => (
                note.full_sheet.soap?.[key] && (
                  <div key={key} className="mb-2">
                    <p className="text-xs font-semibold text-gray-500 capitalize">{key}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{note.full_sheet.soap[key]}</p>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Comment input */}
          {showComment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comment (visible to doctor)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                placeholder="Write your feedback or revision request..."
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => review('approve')}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-60"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => { setShowComment(true); setComment(comment) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-info text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
            >
              <MessageSquare className="w-4 h-4" />
              Approve with Comment
            </button>
            {showComment && comment && (
              <button
                onClick={() => review('approve_with_comment')}
                disabled={loading}
                className="px-4 py-2 bg-info-bg text-info text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-60"
              >
                Confirm Comment
              </button>
            )}
            <button
              onClick={() => { setShowComment(true) }}
              className="flex items-center gap-1.5 px-4 py-2 border border-danger text-danger text-sm font-medium rounded-lg hover:bg-danger-bg transition"
            >
              <RotateCcw className="w-4 h-4" />
              Send Back
            </button>
            {showComment && (
              <button
                onClick={() => review('send_back')}
                disabled={loading || !comment}
                className="px-4 py-2 bg-danger text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-60"
              >
                Confirm Send Back
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

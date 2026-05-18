'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import FullSheetForm from './FullSheetForm'
import type { QuickSheet, PatientResponse, VisitType } from '@/types'

const RESPONSES: { value: PatientResponse; label: string; emoji: string }[] = [
  { value: 'better', label: 'Better', emoji: '✅' },
  { value: 'same',   label: 'Same',   emoji: '➡️' },
  { value: 'worse',  label: 'Worse',  emoji: '⬇️' },
  { value: 'mixed',  label: 'Mixed',  emoji: '↕️' },
]

function PainSlider({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void
}) {
  const color = value <= 3 ? 'text-success' : value <= 6 ? 'text-warning' : 'text-danger'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={`text-xl font-bold ${color}`}>{value}<span className="text-sm font-normal text-muted">/10</span></span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted mt-0.5">
        <span>No pain</span>
        <span>Worst</span>
      </div>
    </div>
  )
}

export default function QuickSheetForm({
  visitId,
  visitType,
  existingNote,
  defaultFullSheet,
  programs,
  isOwnVisit,
  locale,
}: {
  visitId: string
  visitType: VisitType
  existingNote: any
  defaultFullSheet: boolean
  programs: any[]
  isOwnVisit: boolean
  locale: string
}) {
  const supabase = createClient()
  const router = useRouter()

  const existing = existingNote?.quick_sheet as QuickSheet | undefined
  const isReadOnly = !isOwnVisit ||
    existingNote?.review_status === 'approved' ||
    existingNote?.review_status === 'approved_with_comment'

  const [mode, setMode] = useState<'quick' | 'full'>(defaultFullSheet ? 'full' : 'quick')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [painBefore, setPainBefore] = useState(existing?.pain_before ?? 5)
  const [painAfter, setPainAfter] = useState(existing?.pain_after ?? 3)
  const [whatDone, setWhatDone] = useState(existing?.what_was_done?.join('\n') ?? '')
  const [response, setResponse] = useState<PatientResponse>(existing?.patient_response ?? 'better')
  const [nextVisit, setNextVisit] = useState(existing?.next_visit_recommendation ?? '')
  const [redFlags, setRedFlags] = useState(existing?.red_flags_noted ?? false)
  const [redFlagsDetail, setRedFlagsDetail] = useState(existing?.red_flags_detail ?? '')

  function buildQuickSheet(): QuickSheet {
    return {
      pain_before: painBefore,
      pain_after: painAfter,
      what_was_done: whatDone.split('\n').map(s => s.trim()).filter(Boolean),
      patient_response: response,
      next_visit_recommendation: nextVisit,
      red_flags_noted: redFlags,
      red_flags_detail: redFlagsDetail || undefined,
    }
  }

  async function handleSave(andSubmit = false) {
    if (andSubmit) setSubmitting(true)
    else setSaving(true)

    const quickSheet = buildQuickSheet()

    if (existingNote) {
      const { error } = await supabase
        .from('visit_notes')
        .update({
          quick_sheet: quickSheet,
          ...(andSubmit ? {
            review_status: 'submitted',
            submitted_at: new Date().toISOString(),
          } : {}),
        })
        .eq('id', existingNote.id)

      if (error) { toast.error('Save failed'); setSaving(false); setSubmitting(false); return }
    } else {
      const { error } = await supabase
        .from('visit_notes')
        .insert({
          visit_id: visitId,
          quick_sheet: quickSheet,
          review_status: andSubmit ? 'submitted' : 'draft',
          ...(andSubmit ? { submitted_at: new Date().toISOString() } : {}),
        })

      if (error) { toast.error('Save failed'); setSaving(false); setSubmitting(false); return }
    }

    toast.success(andSubmit ? 'Submitted for review' : 'Draft saved')
    router.refresh()
    setSaving(false)
    setSubmitting(false)
  }

  const reviewStatus = existingNote?.review_status

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Tab toggle */}
      <div className="flex border-b border-border">
        {(['quick', 'full'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              mode === m
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted hover:text-gray-700'
            }`}
          >
            {m === 'quick' ? '⚡ Quick Sheet' : '📋 Full Sheet'}
          </button>
        ))}
      </div>

      {/* Review status banner */}
      {reviewStatus && reviewStatus !== 'draft' && (
        <div className={`px-4 py-2.5 text-xs font-semibold ${
          reviewStatus === 'approved' || reviewStatus === 'approved_with_comment'
            ? 'bg-success-bg text-success'
            : reviewStatus === 'returned'
              ? 'bg-danger-bg text-danger'
              : 'bg-warning-bg text-warning'
        }`}>
          {reviewStatus === 'approved' && '✅ Approved'}
          {reviewStatus === 'approved_with_comment' && `✅ Approved — ${existingNote.review_comment}`}
          {reviewStatus === 'returned' && `↩ Returned for revision: ${existingNote.review_comment}`}
          {reviewStatus === 'submitted' && '⏳ Awaiting review'}
          {reviewStatus === 'under_review' && '👀 Under review'}
        </div>
      )}

      {mode === 'quick' ? (
        <div className="p-5 space-y-5">
          {/* Pain scores */}
          <PainSlider label="Pain before session" value={painBefore} onChange={setPainBefore} />
          <PainSlider label="Pain after session" value={painAfter} onChange={setPainAfter} />

          {/* Patient response */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient response</label>
            <div className="grid grid-cols-4 gap-2">
              {RESPONSES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setResponse(r.value)}
                  disabled={isReadOnly}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition ${
                    response === r.value
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-gray-600 hover:bg-muted-bg'
                  }`}
                >
                  <span className="text-base">{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* What was done */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What was done
              <span className="text-xs text-muted font-normal ms-1">(one per line)</span>
            </label>
            <textarea
              value={whatDone}
              onChange={e => setWhatDone(e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-muted-bg"
              placeholder="Nerve gliding&#10;Calf raises 3×15&#10;Gait re-education 10 min"
            />
          </div>

          {/* Next visit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Next visit recommendation
            </label>
            <input
              value={nextVisit}
              onChange={e => setNextVisit(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted-bg"
              placeholder="3 days / as scheduled / 1 week"
            />
          </div>

          {/* Red flags */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={redFlags}
                onChange={e => setRedFlags(e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4 accent-danger"
              />
              <span className="text-sm font-medium text-gray-700">Red flags noted</span>
            </label>
            {redFlags && (
              <textarea
                value={redFlagsDetail}
                onChange={e => setRedFlagsDetail(e.target.value)}
                disabled={isReadOnly}
                rows={2}
                className="mt-2 w-full px-3.5 py-2.5 rounded-lg border border-danger bg-danger-bg text-sm focus:outline-none focus:ring-2 focus:ring-danger resize-none"
                placeholder="Describe the red flag..."
              />
            )}
          </div>

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <FullSheetForm
          visitId={visitId}
          visitType={visitType}
          existingNote={existingNote}
          isReadOnly={isReadOnly}
          onSave={() => router.refresh()}
        />
      )}
    </div>
  )
}

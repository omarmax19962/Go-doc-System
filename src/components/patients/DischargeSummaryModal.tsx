'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { X, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  date: string
  pain_score: number | null
  outcome: string | null
  session_number: number | null
}

interface Props {
  patientId: string
  patientName: string
  sessions: Session[]
  onClose: () => void
  locale: string
}

export default function DischargeSummaryModal({ patientId, patientName, sessions, onClose, locale }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [dischargeNotes, setDischargeNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const firstSession = sorted[0]
  const lastSession = sorted[sorted.length - 1]

  const painAtAdmission = firstSession?.pain_score ?? null
  const painAtDischarge = lastSession?.pain_score ?? null
  const improvement = painAtAdmission !== null && painAtDischarge !== null && painAtAdmission > 0
    ? Math.round(((painAtAdmission - painAtDischarge) / painAtAdmission) * 100)
    : null

  const outcomeCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    if (s.outcome) acc[s.outcome] = (acc[s.outcome] ?? 0) + 1
    return acc
  }, {})

  // Simple sparkline: build points from pain scores
  const withScores = sorted.filter(s => s.pain_score !== null)
  const sparkPoints = withScores.map((s, i) => {
    const x = withScores.length === 1 ? 50 : (i / (withScores.length - 1)) * 100
    const y = 100 - ((s.pain_score! / 10) * 100)
    return `${x},${y}`
  }).join(' ')

  async function handleDischarge() {
    setSaving(true)
    const { error } = await supabase
      .from('patients')
      .update({ status: 'discharged' })
      .eq('id', patientId)

    if (error) {
      toast.error('Failed to discharge patient')
      setSaving(false)
      return
    }

    toast.success('Patient discharged')
    router.refresh()
    onClose()
  }

  const statBox = (label: string, value: string | number | null, sub?: string) => (
    <div className="bg-muted-bg rounded-xl p-3 text-center">
      <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-gray-900">Discharge Summary</h2>
            <p className="text-xs text-muted mt-0.5">{patientName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted-bg rounded-lg transition">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {statBox('Total sessions', sessions.length)}
            {statBox('First session', firstSession ? format(new Date(firstSession.date), 'd MMM') : null)}
            {statBox('Pain (admission)', painAtAdmission !== null ? `${painAtAdmission}/10` : null)}
            {statBox('Pain (discharge)', painAtDischarge !== null ? `${painAtDischarge}/10` : null)}
          </div>

          {/* Improvement banner */}
          {improvement !== null && (
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              improvement > 0 ? 'bg-success/10 text-success' : 'bg-danger-bg text-danger'
            }`}>
              <TrendingDown className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">
                {improvement > 0
                  ? `${improvement}% pain improvement`
                  : `${Math.abs(improvement)}% pain increase`
                }
              </p>
            </div>
          )}

          {/* Outcome breakdown */}
          {Object.keys(outcomeCounts).length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Session outcomes</p>
              <div className="grid grid-cols-2 gap-2">
                {(['improving', 'stable', 'declining', 'worsening'] as const).map(o => {
                  const count = outcomeCounts[o] ?? 0
                  if (count === 0) return null
                  const colors: Record<string, string> = {
                    improving: 'text-success bg-success/10',
                    stable: 'text-primary bg-primary-light',
                    declining: 'text-warning bg-warning/10',
                    worsening: 'text-danger bg-danger-bg',
                  }
                  return (
                    <div key={o} className={`flex items-center justify-between px-3 py-2 rounded-lg ${colors[o]}`}>
                      <span className="text-xs font-medium capitalize">{o}</span>
                      <span className="text-xs font-bold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pain trend sparkline */}
          {withScores.length > 1 && (
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Pain trend</p>
              <div className="bg-muted-bg rounded-xl p-3">
                <svg viewBox="0 0 100 40" className="w-full h-12" preserveAspectRatio="none">
                  <polyline
                    points={sparkPoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                    vectorEffect="non-scaling-stroke"
                  />
                  {withScores.map((s, i) => {
                    const x = withScores.length === 1 ? 50 : (i / (withScores.length - 1)) * 100
                    const y = 100 - ((s.pain_score! / 10) * 100)
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2"
                        fill="currentColor"
                        className="text-primary"
                        vectorEffect="non-scaling-stroke"
                      />
                    )
                  })}
                </svg>
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>{firstSession ? format(new Date(firstSession.date), 'd MMM') : ''}</span>
                  <span>{lastSession ? format(new Date(lastSession.date), 'd MMM') : ''}</span>
                </div>
              </div>
            </div>
          )}

          {/* Clinician discharge notes */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1.5">
              Clinician discharge notes
            </label>
            <textarea
              value={dischargeNotes}
              onChange={e => setDischargeNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary transition"
              placeholder="Goals achieved, home program, follow-up plan..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleDischarge}
            className="flex-1 py-2.5 bg-danger hover:bg-danger/90 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
          >
            {saving ? 'Discharging...' : 'Confirm discharge'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, TrendingUp, Minus, TrendingDown, AlertTriangle } from 'lucide-react'
import LogSessionModal from './LogSessionModal'
import DischargeSummaryModal from './DischargeSummaryModal'

interface Session {
  id: string
  date: string
  session_number: number | null
  duration_min: number | null
  pain_score: number | null
  outcome: string | null
  next_appointment: string | null
  notes: string | null
  exercises: string | null
}

interface Props {
  patientId: string
  patientName: string
  doctorId?: string | null
  sessions: Session[]
  locale: string
  role?: 'admin' | 'doctor'
}

const OUTCOME_CONFIG = {
  improving: { icon: TrendingUp,    color: 'text-success',  bg: 'bg-success/10',  label: 'Improving'  },
  stable:    { icon: Minus,         color: 'text-primary',  bg: 'bg-primary-light', label: 'Stable'   },
  declining: { icon: TrendingDown,  color: 'text-warning',  bg: 'bg-warning/10',  label: 'Declining'  },
  worsening: { icon: AlertTriangle, color: 'text-danger',   bg: 'bg-danger-bg',   label: 'Worsening'  },
}

export default function SessionLog({ patientId, patientName, doctorId, sessions, locale, role = 'admin' }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showDischargeModal, setShowDischargeModal] = useState(false)
  const [list, setList] = useState<Session[]>(sessions)

  async function refresh() {
    // Reload page to get fresh data
    window.location.reload()
  }

  const sorted = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Pain sparkline (last 10 sessions with scores)
  const painPoints = [...list]
    .filter(s => s.pain_score !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)

  const sparkCoords = painPoints.map((s, i) => {
    const x = painPoints.length === 1 ? 50 : (i / (painPoints.length - 1)) * 100
    const y = 100 - ((s.pain_score! / 10) * 100)
    return { x, y, score: s.pain_score!, date: s.date }
  })

  const latestPain = painPoints[painPoints.length - 1]?.pain_score ?? null
  const firstPain  = painPoints[0]?.pain_score ?? null
  const isImproving = latestPain !== null && firstPain !== null && latestPain < firstPain

  const nextAppt = sorted.find(s => s.next_appointment)?.next_appointment

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{list.length}</p>
          <p className="text-xs text-muted mt-0.5">Total sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {latestPain !== null ? `${latestPain}/10` : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Latest pain score</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {nextAppt ? format(new Date(nextAppt), 'd MMM') : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Next appointment</p>
        </div>
      </div>

      {/* Pain trend chart */}
      {sparkCoords.length > 1 && (
        <div className="bg-white rounded-xl border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted uppercase tracking-wide">Pain trend (VAS)</p>
            {isImproving && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success">
                <TrendingUp className="w-3.5 h-3.5" /> Improving
              </span>
            )}
          </div>
          <svg viewBox="0 0 100 40" className="w-full h-16" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={y * 0.4} x2="100" y2={y * 0.4}
                stroke="#f0f0f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            ))}
            {/* Gradient fill */}
            <defs>
              <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,40 ${sparkCoords.map(p => `${p.x},${p.y * 0.4}`).join(' ')} 100,40`}
              fill="url(#painGrad)"
            />
            <polyline
              points={sparkCoords.map(p => `${p.x},${p.y * 0.4}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {sparkCoords.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y * 0.4} r="1.5"
                fill="#3b82f6" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>{format(new Date(painPoints[0].date), 'd MMM')}</span>
            <span>{format(new Date(painPoints[painPoints.length - 1].date), 'd MMM')}</span>
          </div>
        </div>
      )}

      {/* Session log header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted uppercase tracking-wide">
          Session log ({list.length})
        </p>
        <div className="flex items-center gap-2">
          {role === 'admin' && list.length > 0 && (
            <button
              onClick={() => setShowDischargeModal(true)}
              className="text-xs font-semibold text-danger hover:text-danger/80 transition"
            >
              Discharge
            </button>
          )}
          <button
            onClick={() => setShowLogModal(true)}
            className="text-xs font-semibold text-primary hover:text-primary-dark transition"
          >
            + Log session
          </button>
        </div>
      </div>

      {/* Sessions */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-border px-4 py-10 text-center text-muted">
          <p>No sessions logged yet</p>
          <p className="text-sm mt-1">Click "+ Log session" to add the first one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(s => {
            const cfg = OUTCOME_CONFIG[s.outcome as keyof typeof OUTCOME_CONFIG]
            const Icon = cfg?.icon
            const isOpen = expanded === s.id

            return (
              <div key={s.id} className="bg-white rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted-bg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {s.session_number ?? '#'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      Session {s.session_number ?? '?'}
                      {s.duration_min && (
                        <span className="text-muted font-normal ml-1">· {s.duration_min} min</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {format(new Date(s.date), 'd MMM yyyy')}
                      {s.next_appointment && (
                        <span> · Next: {format(new Date(s.next_appointment), 'd MMM')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.pain_score !== null && (
                      <span className="text-xs font-semibold text-gray-700">{s.pain_score}/10</span>
                    )}
                    {cfg && Icon && (
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    )}
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-muted" />
                      : <ChevronDown className="w-4 h-4 text-muted" />
                    }
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 pt-0 border-t border-border space-y-2">
                    {s.notes && (
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">Notes</p>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{s.notes}</p>
                      </div>
                    )}
                    {s.exercises && (
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">Exercises</p>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{s.exercises}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {showLogModal && (
        <LogSessionModal
          patientId={patientId}
          doctorId={doctorId}
          sessionCount={list.length}
          onClose={() => setShowLogModal(false)}
          onSaved={() => { setShowLogModal(false); refresh() }}
        />
      )}

      {showDischargeModal && (
        <DischargeSummaryModal
          patientId={patientId}
          patientName={patientName}
          sessions={list}
          onClose={() => setShowDischargeModal(false)}
          locale={locale}
        />
      )}
    </>
  )
}

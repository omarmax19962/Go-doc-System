'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  patientId: string
  doctorId?: string | null
  sessionCount: number
  onClose: () => void
  onSaved: () => void
}

const OUTCOMES = [
  { value: 'improving', label: 'Improving' },
  { value: 'stable',    label: 'Stable' },
  { value: 'declining', label: 'Declining' },
  { value: 'worsening', label: 'Worsening' },
]

export default function LogSessionModal({ patientId, doctorId, sessionCount, onClose, onSaved }: Props) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    session_number: sessionCount + 1,
    duration_min: 45,
    pain_score: 5,
    outcome: 'stable',
    next_appointment: '',
    notes: '',
    exercises: '',
  })

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.notes.trim()) {
      toast.error('Session notes are required')
      return
    }
    setSaving(true)

    const { error } = await supabase.from('clinic_sessions').insert({
      patient_id: patientId,
      doctor_id: doctorId ?? null,
      session_number: form.session_number,
      date: form.date,
      duration_min: form.duration_min,
      pain_score: form.pain_score,
      outcome: form.outcome,
      next_appointment: form.next_appointment || null,
      notes: form.notes,
      exercises: form.exercises || null,
    })

    if (error) {
      toast.error('Failed to save session')
      setSaving(false)
      return
    }

    toast.success('Session logged')
    onSaved()
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
  const labelCls = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-gray-900">Log New Session</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted-bg rounded-lg transition">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="col-span-1">
              <label className={labelCls}>Session #</label>
              <input
                type="number"
                min={1}
                value={form.session_number}
                onChange={e => set('session_number', parseInt(e.target.value) || 1)}
                className={inputCls}
              />
            </div>
            <div className="col-span-1">
              <label className={labelCls}>Duration (min)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={form.duration_min}
                onChange={e => set('duration_min', parseInt(e.target.value) || 45)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Pain VAS */}
          <div>
            <label className={labelCls}>
              Pain score (VAS)
              <span className="ml-2 text-primary font-bold normal-case text-sm">
                {form.pain_score}/10
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={form.pain_score}
              onChange={e => set('pain_score', parseInt(e.target.value))}
              className="w-full accent-primary h-2 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>0 — No pain</span>
              <span>10 — Worst</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Outcome</label>
              <select
                value={form.outcome}
                onChange={e => set('outcome', e.target.value)}
                className={inputCls}
              >
                {OUTCOMES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Next appointment</label>
              <input
                type="date"
                value={form.next_appointment}
                onChange={e => set('next_appointment', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Session notes *</label>
            <textarea
              required
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="What was done, patient response, functional improvements..."
            />
          </div>

          <div>
            <label className={labelCls}>Exercises prescribed</label>
            <textarea
              value={form.exercises}
              onChange={e => set('exercises', e.target.value)}
              rows={2}
              className={inputCls + ' resize-none'}
              placeholder="Home exercise program..."
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
            onClick={handleSave}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save session'}
          </button>
        </div>
      </div>
    </div>
  )
}

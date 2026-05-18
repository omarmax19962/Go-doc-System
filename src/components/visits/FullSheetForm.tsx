'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import type { VisitType, FullSheet, Measurement } from '@/types'

export default function FullSheetForm({
  visitId,
  visitType,
  existingNote,
  isReadOnly,
  onSave,
}: {
  visitId: string
  visitType: VisitType
  existingNote: any
  isReadOnly: boolean
  onSave: () => void
}) {
  const supabase = createClient()
  const existing = existingNote?.full_sheet as FullSheet | undefined

  const [saving, setSaving] = useState(false)
  const [subjective, setSubjective] = useState(existing?.soap?.subjective ?? '')
  const [objective, setObjective] = useState(existing?.soap?.objective ?? '')
  const [assessment, setAssessment] = useState(existing?.soap?.assessment ?? '')
  const [plan, setPlan] = useState(existing?.soap?.plan ?? '')
  const [dischargeProgress, setDischargeProgress] = useState(
    existing?.discharge_criteria_progress ?? ''
  )
  const [programMods, setProgramMods] = useState(
    existing?.program_modifications ?? ''
  )
  const [measurements, setMeasurements] = useState<Measurement[]>(
    existing?.measurements ?? []
  )
  const [newMeasurement, setNewMeasurement] = useState({ label: '', value: '', unit: '' })

  function addMeasurement() {
    if (!newMeasurement.label || !newMeasurement.value) return
    setMeasurements(prev => [...prev, { ...newMeasurement }])
    setNewMeasurement({ label: '', value: '', unit: '' })
  }

  function removeMeasurement(i: number) {
    setMeasurements(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    setSaving(true)

    const fullSheet: FullSheet = {
      soap: { subjective, objective, assessment, plan },
      measurements,
      discharge_criteria_progress: dischargeProgress || undefined,
      program_modifications: programMods || undefined,
    }

    if (existingNote) {
      const { error } = await supabase
        .from('visit_notes')
        .update({ full_sheet: fullSheet as any })
        .eq('id', existingNote.id)

      if (error) { toast.error('Save failed'); setSaving(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user!.id).single()
      const { error } = await supabase
        .from('visit_notes')
        .insert({ visit_id: visitId, doctor_id: doc!.id, quick_sheet: {} as any, full_sheet: fullSheet as any, review_status: 'draft' })

      if (error) { toast.error('Save failed'); setSaving(false); return }
    }

    toast.success('Full sheet saved')
    onSave()
    setSaving(false)
  }

  const textareaCls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-muted-bg"
  const inputCls = "px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted-bg"

  return (
    <div className="p-5 space-y-5">
      {/* SOAP */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-muted uppercase tracking-wide">SOAP Note</p>

        {[
          { key: 'subjective', label: 'S — Subjective', value: subjective, set: setSubjective,
            placeholder: "Patient's report: pain level, symptoms since last visit, functional changes..." },
          { key: 'objective', label: 'O — Objective', value: objective, set: setObjective,
            placeholder: 'Observed findings: ROM, strength grades, gait pattern, special tests...' },
          { key: 'assessment', label: 'A — Assessment', value: assessment, set: setAssessment,
            placeholder: 'Clinical reasoning: progress toward goals, response to treatment...' },
          { key: 'plan', label: 'P — Plan', value: plan, set: setPlan,
            placeholder: 'Next session focus, progression, modifications, frequency changes...' },
        ].map(({ key, label, value, set, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <textarea
              value={value}
              onChange={e => set(e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className={textareaCls}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>

      {/* Measurements */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Measurements</p>

        {measurements.length > 0 && (
          <div className="space-y-2 mb-3">
            {measurements.map((m, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-muted-bg rounded-lg">
                <span className="text-sm font-medium text-gray-700 flex-1">{m.label}</span>
                <span className="text-sm text-gray-900">{m.value}{m.unit && ` ${m.unit}`}</span>
                {!isReadOnly && (
                  <button onClick={() => removeMeasurement(i)} className="text-danger text-xs">✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isReadOnly && (
          <div className="flex gap-2">
            <input
              value={newMeasurement.label}
              onChange={e => setNewMeasurement(p => ({ ...p, label: e.target.value }))}
              className={inputCls + ' flex-1'}
              placeholder="Label (e.g. Dorsiflexion ROM)"
            />
            <input
              value={newMeasurement.value}
              onChange={e => setNewMeasurement(p => ({ ...p, value: e.target.value }))}
              className={inputCls + ' w-20'}
              placeholder="Value"
            />
            <input
              value={newMeasurement.unit}
              onChange={e => setNewMeasurement(p => ({ ...p, unit: e.target.value }))}
              className={inputCls + ' w-16'}
              placeholder="Unit"
            />
            <button
              onClick={addMeasurement}
              className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Discharge-specific */}
      {visitType === 'discharge' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Discharge Criteria Progress
          </label>
          <textarea
            value={dischargeProgress}
            onChange={e => setDischargeProgress(e.target.value)}
            disabled={isReadOnly}
            rows={3}
            className={textareaCls}
            placeholder="Document which discharge criteria were met and the patient's outcome..."
          />
        </div>
      )}

      {/* Program modifications */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Program Modifications
        </label>
        <textarea
          value={programMods}
          onChange={e => setProgramMods(e.target.value)}
          disabled={isReadOnly}
          rows={2}
          className={textareaCls}
          placeholder="Any changes to the program plan, exercises, or frequency..."
        />
      </div>

      {!isReadOnly && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Full Sheet'}
        </button>
      )}
    </div>
  )
}

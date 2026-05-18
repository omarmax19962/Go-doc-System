'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import DiagnosisPicker from '@/components/programs/DiagnosisPicker'
import ExerciseBlock from '@/components/programs/ExerciseBlock'
import type { ProgramFormData, Phase } from '@/types'

const OPTIONAL_BLOCKS = [
  { id: 'secondary_diagnoses', label: 'Secondary Diagnoses' },
  { id: 'baseline_assessment', label: 'Baseline Assessment' },
  { id: 'phase_content', label: 'Phase Exercises & Progression' },
  { id: 'home_exercises', label: 'Home Exercise Program' },
  { id: 'red_flag_details', label: 'Detailed Red Flags' },
  { id: 'custom_section', label: 'Custom Section' },
]

export default function ProgramFormBuilder({
  patientId,
  doctorId,
  visitType = 'assessment',
  existingProgram,
  locale,
}: {
  patientId: string
  doctorId: string
  visitType?: string
  existingProgram?: any
  locale: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Smart defaults by visit type
  const defaultBlocks = visitType === 'assessment'
    ? ['baseline_assessment', 'phase_content']
    : visitType === 'discharge'
      ? ['red_flag_details']
      : ['phase_content']

  const [activeBlocks, setActiveBlocks] = useState<string[]>(
    existingProgram ? Object.keys(existingProgram.form_data ?? {}) : defaultBlocks
  )

  // Tier 1 — mandatory
  const existing = existingProgram?.form_data as ProgramFormData | undefined
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(existing?.primary_diagnosis ?? '')
  const [referringPhysician, setReferringPhysician] = useState(existing?.referring_physician ?? '')
  const [selfReferred, setSelfReferred] = useState(existing?.self_referred ?? false)
  const [durationWeeks, setDurationWeeks] = useState(existing?.duration_weeks ?? 6)
  const [phaseCount, setPhaseCount] = useState<1 | 2 | 3>(existing?.phase_count ?? 1)
  const [baselinePain, setBaselinePain] = useState(existing?.baseline_pain_score ?? 5)
  const [redFlags, setRedFlags] = useState(
    existing?.red_flags?.map(r => r.description).join('\n') ?? 'Standard PT precautions apply'
  )

  // Phase goals
  const [phaseGoals, setPhaseGoals] = useState<string[]>(
    existing?.phases?.map(p => p.goal) ?? ['', '', '']
  )
  const [phaseWeeks, setPhaseWeeks] = useState<number[]>(
    existing?.phases?.map(p => p.weeks) ?? [2, 2, 2]
  )
  const [phaseFrequency, setPhaseFrequency] = useState<number[]>(
    existing?.phases?.map(p => p.visits_per_week) ?? [3, 2, 1]
  )

  // Tier 2 blocks
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState<string[]>(
    existing?.secondary_diagnoses ?? []
  )
  const [baselineNotes, setBaselineNotes] = useState(
    existing?.baseline_assessment?.notes ?? ''
  )
  const [customSectionTitle, setCustomSectionTitle] = useState('')
  const [customSectionBody, setCustomSectionBody] = useState('')

  // Phase exercises state (simple text-based for now)
  const [phaseExercises, setPhaseExercises] = useState<string[][]>(
    Array.from({ length: 3 }, (_, i) =>
      existing?.phases?.[i]?.exercises?.map(e => e.exercise_id ?? '') ?? []
    )
  )

  function toggleBlock(blockId: string) {
    setActiveBlocks(prev =>
      prev.includes(blockId)
        ? prev.filter(b => b !== blockId)
        : [...prev, blockId]
    )
  }

  function buildFormData(): ProgramFormData {
    const phases: Phase[] = Array.from({ length: phaseCount }, (_, i) => ({
      number: i + 1,
      goal: phaseGoals[i] ?? '',
      weeks: phaseWeeks[i] ?? 2,
      visits_per_week: phaseFrequency[i] ?? 2,
      exercises: [],
    }))

    return {
      primary_diagnosis: primaryDiagnosis,
      referring_physician: selfReferred ? undefined : referringPhysician,
      self_referred: selfReferred,
      duration_weeks: durationWeeks,
      phase_count: phaseCount,
      phases,
      baseline_pain_score: baselinePain,
      red_flags: redFlags.split('\n').filter(Boolean).map(d => ({ description: d })),
      secondary_diagnoses: activeBlocks.includes('secondary_diagnoses')
        ? secondaryDiagnoses : undefined,
      baseline_assessment: activeBlocks.includes('baseline_assessment')
        ? { pain_score: baselinePain, notes: baselineNotes } : undefined,
      custom_sections: activeBlocks.includes('custom_section') && customSectionTitle
        ? [{ title: customSectionTitle, body: customSectionBody }] : undefined,
    }
  }

  async function handleSave() {
    if (!primaryDiagnosis) {
      toast.error('Primary diagnosis is required')
      return
    }
    setSaving(true)

    const formData = buildFormData()

    if (existingProgram) {
      const { error } = await supabase
        .from('programs')
        .update({ form_data: formData as any, updated_at: new Date().toISOString() })
        .eq('id', existingProgram.id)

      if (error) { toast.error('Save failed'); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('programs')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          source: 'form_generated',
          form_data: formData as any,
          is_active: true,
        })

      if (error) { toast.error('Save failed'); setSaving(false); return }
    }

    toast.success('Program saved')
    router.back()
    setSaving(false)
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"

  return (
    <div className="space-y-5">
      {/* Tier 1 — Mandatory */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Required</p>
        </div>

        {/* Primary diagnosis */}
        <DiagnosisPicker
          value={primaryDiagnosis}
          onChange={setPrimaryDiagnosis}
          label="Primary Diagnosis *"
        />

        {/* Referring physician */}
        <div>
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selfReferred}
              onChange={e => setSelfReferred(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm font-medium text-gray-700">Self-referred</span>
          </label>
          {!selfReferred && (
            <input
              value={referringPhysician}
              onChange={e => setReferringPhysician(e.target.value)}
              className={inputCls}
              placeholder="Dr. Name — Specialty — Institution"
            />
          )}
        </div>

        {/* Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Duration (weeks) *
            </label>
            <input
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={e => setDurationWeeks(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phases *
            </label>
            <div className="grid grid-cols-3 gap-1">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setPhaseCount(n)}
                  className={`py-2.5 rounded-lg text-sm font-bold border transition ${
                    phaseCount === n
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-gray-600 hover:bg-muted-bg'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Per-phase goals + frequency */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Phase Goals *</label>
          {Array.from({ length: phaseCount }, (_, i) => (
            <div key={i} className="p-3 bg-muted-bg rounded-lg space-y-2">
              <p className="text-xs font-bold text-muted">Phase {i + 1}</p>
              <input
                value={phaseGoals[i] ?? ''}
                onChange={e => {
                  const g = [...phaseGoals]
                  g[i] = e.target.value
                  setPhaseGoals(g)
                }}
                className={inputCls}
                placeholder={`Phase ${i + 1} goal (e.g. Restore ROM, Build strength)`}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted">Weeks</label>
                  <input
                    type="number" min={1} max={20}
                    value={phaseWeeks[i] ?? 2}
                    onChange={e => {
                      const w = [...phaseWeeks]; w[i] = Number(e.target.value); setPhaseWeeks(w)
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Visits/week</label>
                  <input
                    type="number" min={1} max={7}
                    value={phaseFrequency[i] ?? 2}
                    onChange={e => {
                      const f = [...phaseFrequency]; f[i] = Number(e.target.value); setPhaseFrequency(f)
                    }}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Baseline pain */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Baseline Pain Score *</label>
            <span className="text-xl font-bold text-danger">{baselinePain}<span className="text-sm font-normal text-muted">/10</span></span>
          </div>
          <input
            type="range" min={0} max={10}
            value={baselinePain}
            onChange={e => setBaselinePain(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Red flags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Red Flags / Stop Conditions *
            <span className="text-xs text-muted font-normal ms-1">(one per line)</span>
          </label>
          <textarea
            value={redFlags}
            onChange={e => setRedFlags(e.target.value)}
            rows={3}
            className={inputCls + ' resize-none'}
            placeholder="Standard PT precautions apply&#10;Stop if sharp electric pain&#10;..."
          />
        </div>
      </div>

      {/* Tier 2 — Optional blocks */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-info" />
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Optional Sections</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {OPTIONAL_BLOCKS.map(block => (
            <button
              key={block.id}
              onClick={() => toggleBlock(block.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                activeBlocks.includes(block.id)
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-gray-600 hover:border-primary'
              }`}
            >
              {activeBlocks.includes(block.id) ? '✓ ' : '+ '}{block.label}
            </button>
          ))}
        </div>

        {/* Secondary diagnoses */}
        {activeBlocks.includes('secondary_diagnoses') && (
          <div className="mb-4 p-4 bg-muted-bg rounded-lg">
            <p className="text-xs font-bold text-gray-700 mb-2">Secondary Diagnoses</p>
            <DiagnosisPicker
              value=""
              onChange={d => {
                if (d && !secondaryDiagnoses.includes(d))
                  setSecondaryDiagnoses(prev => [...prev, d])
              }}
              label="Add secondary diagnosis"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {secondaryDiagnoses.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-border rounded-full text-xs">
                  {d}
                  <button onClick={() => setSecondaryDiagnoses(prev => prev.filter((_, idx) => idx !== i))} className="text-danger">✕</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Baseline assessment */}
        {activeBlocks.includes('baseline_assessment') && (
          <div className="mb-4 p-4 bg-muted-bg rounded-lg">
            <p className="text-xs font-bold text-gray-700 mb-2">Baseline Assessment Notes</p>
            <textarea
              value={baselineNotes}
              onChange={e => setBaselineNotes(e.target.value)}
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="ROM measurements, strength grades, special test results, functional baseline..."
            />
          </div>
        )}

        {/* Custom section */}
        {activeBlocks.includes('custom_section') && (
          <div className="mb-4 p-4 bg-muted-bg rounded-lg space-y-2">
            <p className="text-xs font-bold text-gray-700">Custom Section</p>
            <input
              value={customSectionTitle}
              onChange={e => setCustomSectionTitle(e.target.value)}
              className={inputCls}
              placeholder="Section title"
            />
            <textarea
              value={customSectionBody}
              onChange={e => setCustomSectionBody(e.target.value)}
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Section content..."
            />
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : existingProgram ? 'Update Program' : 'Create Program'}
        </button>
      </div>
    </div>
  )
}

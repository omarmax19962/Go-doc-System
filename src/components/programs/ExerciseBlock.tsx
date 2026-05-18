'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Plus, Trash2 } from 'lucide-react'
import type { ProgramExercise } from '@/types'

interface ExerciseEntry extends ProgramExercise {
  name: string
}

export default function ExerciseBlock({
  phaseIndex,
  exercises,
  onChange,
}: {
  phaseIndex: number
  exercises: ExerciseEntry[]
  onChange: (exercises: ExerciseEntry[]) => void
}) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)

  async function search(q: string) {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', `%${q}%`)
      .limit(6)
    setResults(data ?? [])
  }

  function addExercise(ex: any) {
    const entry: ExerciseEntry = {
      exercise_id: ex.id,
      name: ex.name,
      sets: ex.default_sets ?? 3,
      reps: ex.default_reps ?? 10,
      duration_seconds: ex.default_duration_seconds,
      notes: '',
    }
    onChange([...exercises, entry])
    setQuery('')
    setResults([])
    setShowSearch(false)
  }

  function addCustom() {
    if (!query.trim()) return
    const entry: ExerciseEntry = {
      exercise_id: '',
      name: query.trim(),
      sets: 3,
      reps: 10,
      notes: '',
    }
    onChange([...exercises, entry])
    setQuery('')
    setResults([])
    setShowSearch(false)
  }

  function updateExercise(i: number, field: string, value: any) {
    const updated = exercises.map((e, idx) =>
      idx === i ? { ...e, [field]: value } : e
    )
    onChange(updated)
  }

  function removeExercise(i: number) {
    onChange(exercises.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {exercises.map((ex, i) => (
        <div key={i} className="p-3 bg-white border border-border rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{ex.name}</p>
              <div className="flex gap-2 mt-2">
                <label className="flex items-center gap-1 text-xs text-muted">
                  Sets
                  <input
                    type="number" min={1} max={20}
                    value={ex.sets ?? ''}
                    onChange={e => updateExercise(i, 'sets', Number(e.target.value))}
                    className="w-12 px-1.5 py-1 border border-border rounded text-xs text-center"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted">
                  Reps
                  <input
                    type="number" min={1} max={100}
                    value={ex.reps ?? ''}
                    onChange={e => updateExercise(i, 'reps', Number(e.target.value))}
                    className="w-12 px-1.5 py-1 border border-border rounded text-xs text-center"
                  />
                </label>
              </div>
              <input
                value={ex.notes ?? ''}
                onChange={e => updateExercise(i, 'notes', e.target.value)}
                className="mt-1.5 w-full px-2 py-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Notes / cues (optional)"
              />
            </div>
            <button onClick={() => removeExercise(i)} className="text-danger shrink-0 mt-0.5">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {showSearch ? (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={e => search(e.target.value)}
                className="w-full ps-8 pe-3 py-2 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search exercises or type custom name..."
              />
            </div>
            <button
              onClick={() => setShowSearch(false)}
              className="px-2 py-2 text-xs text-muted border border-border rounded-lg"
            >
              ✕
            </button>
          </div>
          {results.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => addExercise(r)}
                  className="w-full text-start px-3 py-2.5 hover:bg-muted-bg text-xs border-b border-border last:border-0"
                >
                  <p className="font-medium">{r.name}</p>
                  {r.default_sets && (
                    <p className="text-muted">{r.default_sets}×{r.default_reps}</p>
                  )}
                </button>
              ))}
              {query && (
                <button
                  onClick={addCustom}
                  className="w-full text-start px-3 py-2.5 hover:bg-muted-bg text-xs text-primary font-medium"
                >
                  + Add &ldquo;{query}&rdquo; as new exercise
                </button>
              )}
            </div>
          )}
          {query.length >= 2 && results.length === 0 && (
            <div className="absolute z-30 w-full mt-1 bg-white border border-border rounded-lg shadow-lg">
              <button
                onClick={addCustom}
                className="w-full text-start px-3 py-2.5 text-xs text-primary font-medium hover:bg-muted-bg"
              >
                + Add &ldquo;{query}&rdquo; as new exercise
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowSearch(true)}
          className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary transition flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Exercise
        </button>
      )}
    </div>
  )
}

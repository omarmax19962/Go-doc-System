'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Plus } from 'lucide-react'

export interface Diagnosis {
  id: string
  name: string
  icd_hint: string | null
  system: string | null
}

interface Props {
  diagnoses: Diagnosis[]
  value: Diagnosis | null
  onChange: (d: Diagnosis | null) => void
  placeholder?: string
}

export function DiagnosisPicker({ diagnoses, value, onChange, placeholder = 'Search diagnosis...' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.length < 1
    ? diagnoses
    : diagnoses.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        (d.icd_hint ?? '').toLowerCase().includes(query.toLowerCase())
      )

  const grouped = filtered.reduce<Record<string, Diagnosis[]>>((acc, d) => {
    const key = d.system ?? 'Other'
    acc[key] = acc[key] ?? []
    acc[key].push(d)
    return acc
  }, {})

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-primary bg-primary-light">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary truncate">{value.name}</p>
          {value.icd_hint && (
            <p className="text-xs text-primary/70">{value.icd_hint}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-0.5 hover:bg-primary/10 rounded"
        >
          <X className="w-4 h-4 text-primary" />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-muted hover:border-primary transition text-left"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span>{placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-border shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type to search..."
                className="flex-1 text-sm outline-none bg-transparent py-1"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(grouped).length === 0 && (
              <p className="text-sm text-muted text-center py-6">No results</p>
            )}
            {Object.entries(grouped).map(([system, items]) => (
              <div key={system}>
                <p className="text-xs font-bold text-muted uppercase tracking-wide px-3 py-1.5 bg-muted-bg sticky top-0">
                  {system}
                </p>
                {items.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => { onChange(d); setOpen(false); setQuery('') }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted-bg transition text-left"
                  >
                    <span className="text-sm text-gray-900">{d.name}</span>
                    {d.icd_hint && (
                      <span className="text-xs text-muted font-mono ml-2 shrink-0">{d.icd_hint}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Multi-select secondary diagnoses
interface MultiProps {
  diagnoses: Diagnosis[]
  value: Diagnosis[]
  onChange: (d: Diagnosis[]) => void
}

export function SecondaryDiagnosisPicker({ diagnoses, value, onChange }: MultiProps) {
  const available = diagnoses.filter(d => !value.find(v => v.id === d.id))

  return (
    <div className="space-y-2">
      {value.map(d => (
        <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted-bg">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">{d.name}</p>
            {d.icd_hint && <p className="text-xs text-muted">{d.icd_hint}</p>}
          </div>
          <button
            type="button"
            onClick={() => onChange(value.filter(v => v.id !== d.id))}
            className="p-0.5 hover:bg-border rounded shrink-0"
          >
            <X className="w-3.5 h-3.5 text-muted" />
          </button>
        </div>
      ))}
      {value.length < 5 && (
        <DiagnosisPicker
          diagnoses={available}
          value={null}
          onChange={d => d && onChange([...value, d])}
          placeholder="+ Add secondary diagnosis"
        />
      )}
    </div>
  )
}

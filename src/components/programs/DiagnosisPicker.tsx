'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Search } from 'lucide-react'

export default function DiagnosisPicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const supabase = createClient()
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function search(q: string) {
    setQuery(q)
    if (!q || q.length < 2) { setResults([]); setOpen(false); return }

    const { data } = await supabase
      .from('apta_diagnoses')
      .select('*')
      .or(`name.ilike.%${q}%,name_ar.ilike.%${q}%`)
      .limit(8)

    setResults(data ?? [])
    setOpen(true)
  }

  function select(diagnosis: any) {
    setQuery(diagnosis.name)
    onChange(diagnosis.name)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full ps-9 pe-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          placeholder="Search APTA diagnoses or type custom..."
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          {results.map(d => (
            <button
              key={d.id}
              onClick={() => select(d)}
              className="w-full text-start px-4 py-3 hover:bg-muted-bg transition border-b border-border last:border-0"
            >
              <p className="text-sm font-medium text-gray-900">{d.name}</p>
              {d.name_ar && <p className="text-xs text-muted mt-0.5">{d.name_ar}</p>}
              <p className="text-xs text-muted mt-0.5">{d.system}</p>
            </button>
          ))}
          {query && (
            <button
              onClick={() => { onChange(query); setOpen(false) }}
              className="w-full text-start px-4 py-3 hover:bg-muted-bg transition text-sm text-primary font-medium"
            >
              + Use &ldquo;{query}&rdquo; as custom diagnosis
            </button>
          )}
        </div>
      )}
    </div>
  )
}

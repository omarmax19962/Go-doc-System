'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { LogOut, MapPin, Plus, X } from 'lucide-react'
import NoteReviewStatusBadge from '@/components/shared/NoteReviewStatusBadge'

export default function DoctorProfileClient({
  profile,
  doctor,
  completedVisits,
  totalVisits,
  feedbackHistory,
  locale,
}: {
  profile: any
  doctor: any
  completedVisits: number
  totalVisits: number
  feedbackHistory: any[]
  locale: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [locations, setLocations] = useState<any[]>(doctor?.covered_locations ?? [])
  const [newLocation, setNewLocation] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`/${locale}/auth`)
  }

  function addLocation() {
    if (!newLocation.trim()) return
    const loc = {
      place_id: Date.now().toString(),
      display_name: newLocation.trim(),
      lat: 0,
      lng: 0,
    }
    setLocations(prev => [...prev, loc])
    setNewLocation('')
  }

  function removeLocation(i: number) {
    setLocations(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveLocations() {
    setSaving(true)
    const { error } = await supabase
      .from('doctors')
      .update({ covered_locations: locations })
      .eq('id', doctor.id)

    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Coverage areas updated')
    setSaving(false)
  }

  return (
    <div className="px-4 pt-6 pb-6 max-w-2xl mx-auto space-y-4">
      {/* Profile card */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {profile?.full_name?.charAt(0) ?? 'D'}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-muted">{profile?.email}</p>
            <p className="text-xs text-muted mt-0.5">{doctor?.specialty} · {doctor?.gender}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-danger transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted-bg rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{completedVisits}</p>
            <p className="text-xs text-muted">Visits completed</p>
          </div>
          <div className="bg-muted-bg rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
            <p className="text-xs text-muted">Total visits</p>
          </div>
        </div>
      </div>

      {/* Coverage areas */}
      <div className="bg-white rounded-xl border border-border p-5">
        <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted" />
          Coverage Areas
        </p>

        <div className="space-y-2 mb-3">
          {locations.map((loc, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-muted-bg rounded-lg">
              <p className="text-sm text-gray-700 flex-1">{loc.display_name}</p>
              <button onClick={() => removeLocation(i)} className="text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLocation()}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. New Cairo, Maadi..."
          />
          <button
            onClick={addLocation}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {locations.length > 0 && (
          <button
            onClick={saveLocations}
            disabled={saving}
            className="w-full mt-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Coverage Areas'}
          </button>
        )}

        <p className="text-xs text-muted mt-2">
          Google Maps integration coming soon — add area names manually for now
        </p>
      </div>

      {/* Feedback history */}
      {feedbackHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-border">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-gray-900">Recent Feedback</p>
          </div>
          <div className="divide-y divide-border">
            {feedbackHistory.map(fb => (
              <div key={fb.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    fb.action === 'approve' ? 'bg-success-bg text-success' :
                    fb.action === 'approve_with_comment' ? 'bg-success-bg text-success' :
                    'bg-danger-bg text-danger'
                  }`}>
                    {fb.action === 'approve' ? '✅ Approved' :
                     fb.action === 'approve_with_comment' ? '✅ Approved with comment' :
                     '↩ Returned'}
                  </span>
                  <span className="text-xs text-muted">
                    {format(new Date(fb.created_at), 'd MMM')}
                  </span>
                </div>
                {fb.comment && (
                  <p className="text-sm text-gray-700 mt-1">{fb.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

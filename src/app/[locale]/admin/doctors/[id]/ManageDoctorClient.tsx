'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, Plus, X, CheckCircle, XCircle, Users, Calendar, ClipboardCheck } from 'lucide-react'
import { updateDoctorAction, updateDoctorProfileAction } from '@/app/actions/doctor'

interface Location {
  place_id: string
  display_name: string
  lat: number
  lng: number
}

export default function ManageDoctorClient({
  doctor,
  profile,
  locations: initialLocations,
  stats,
  locale,
}: {
  doctor: any
  profile: any
  locations: Location[]
  stats: { totalPatients: number; totalVisits: number; completedVisits: number }
  locale: string
}) {
  const router = useRouter()

  // Profile fields
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  // Doctor fields
  const [specialty, setSpecialty] = useState(doctor.specialty ?? '')
  const [isActive, setIsActive] = useState(doctor.is_active ?? true)

  // Coverage areas
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [newLocation, setNewLocation] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingDoctor, setSavingDoctor] = useState(false)
  const [savingLocations, setSavingLocations] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    const result = await updateDoctorProfileAction(profile.id, { full_name: fullName, phone })
    if (result.error) toast.error(result.error)
    else { toast.success('Profile updated'); router.refresh() }
    setSavingProfile(false)
  }

  async function handleSaveDoctor(e: React.FormEvent) {
    e.preventDefault()
    setSavingDoctor(true)
    const result = await updateDoctorAction(doctor.id, { specialty, is_active: isActive })
    if (result.error) toast.error(result.error)
    else { toast.success('Doctor info updated'); router.refresh() }
    setSavingDoctor(false)
  }

  async function handleToggleActive() {
    const next = !isActive
    setIsActive(next)
    const result = await updateDoctorAction(doctor.id, { is_active: next })
    if (result.error) { toast.error(result.error); setIsActive(!next) }
    else toast.success(next ? 'Doctor set to active' : 'Doctor set to inactive')
    router.refresh()
  }

  function addLocation() {
    if (!newLocation.trim()) return
    setLocations(prev => [...prev, {
      place_id: Date.now().toString(),
      display_name: newLocation.trim(),
      lat: 0,
      lng: 0,
    }])
    setNewLocation('')
  }

  function removeLocation(i: number) {
    setLocations(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSaveLocations() {
    setSavingLocations(true)
    const result = await updateDoctorAction(doctor.id, { covered_locations: locations })
    if (result.error) toast.error(result.error)
    else toast.success('Coverage areas saved')
    setSavingLocations(false)
    router.refresh()
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {profile?.full_name?.charAt(0) ?? 'D'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-lg">{profile?.full_name}</p>
              {isActive
                ? <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle className="w-3.5 h-3.5" />Active</span>
                : <span className="inline-flex items-center gap-1 text-xs text-muted"><XCircle className="w-3.5 h-3.5" />Inactive</span>
              }
            </div>
            <p className="text-sm text-muted">{doctor.specialty} · {doctor.gender}</p>
          </div>
          <button
            onClick={handleToggleActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isActive
                ? 'border-danger text-danger hover:bg-danger-bg'
                : 'border-success text-success hover:bg-success-bg'
            }`}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted-bg rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1"><Users className="w-4 h-4 text-muted" /></div>
            <p className="text-xl font-bold text-gray-900">{stats.totalPatients}</p>
            <p className="text-xs text-muted">Patients</p>
          </div>
          <div className="bg-muted-bg rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1"><Calendar className="w-4 h-4 text-muted" /></div>
            <p className="text-xl font-bold text-gray-900">{stats.totalVisits}</p>
            <p className="text-xs text-muted">Total Visits</p>
          </div>
          <div className="bg-muted-bg rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1"><ClipboardCheck className="w-4 h-4 text-muted" /></div>
            <p className="text-xl font-bold text-gray-900">{stats.completedVisits}</p>
            <p className="text-xs text-muted">Completed</p>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Full name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={inputCls}
              placeholder="Dr. Ahmed Ali"
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={inputCls}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Professional info */}
      <form onSubmit={handleSaveDoctor} className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Professional Details</h2>
        <div>
          <label className={labelCls}>Specialty</label>
          <input
            value={specialty}
            onChange={e => setSpecialty(e.target.value)}
            className={inputCls}
            placeholder="e.g. Musculoskeletal, Neurological"
          />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <div className="flex gap-2">
            {[true, false].map(val => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setIsActive(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                  isActive === val
                    ? val ? 'bg-success-bg border-success text-success' : 'bg-danger-bg border-danger text-danger'
                    : 'border-border text-gray-500 hover:bg-muted-bg'
                }`}
              >
                {val ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={savingDoctor}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {savingDoctor ? 'Saving...' : 'Save Details'}
        </button>
      </form>

      {/* Coverage areas */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted" />
          Coverage Areas
        </h2>

        <div className="space-y-2">
          {locations.length === 0 && (
            <p className="text-sm text-muted">No coverage areas set yet.</p>
          )}
          {locations.map((loc, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-muted-bg rounded-lg">
              <p className="text-sm text-gray-700 flex-1">{loc.display_name}</p>
              <button onClick={() => removeLocation(i)} className="text-muted hover:text-danger transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLocation() } }}
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. New Cairo, Maadi, Heliopolis..."
          />
          <button
            type="button"
            onClick={addLocation}
            className="px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleSaveLocations}
          disabled={savingLocations}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {savingLocations ? 'Saving...' : 'Save Coverage Areas'}
        </button>
      </div>
    </div>
  )
}

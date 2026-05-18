'use client'

import { format } from 'date-fns'
import { MapPin, Phone, Clock, User } from 'lucide-react'
import type { VisitStatus, VisitType } from '@/types'

interface VisitCardProps {
  visit: any
  role: 'admin' | 'doctor'
}

const STATUS_STYLES: Record<VisitStatus, { bg: string; text: string; label: string }> = {
  scheduled:   { bg: 'bg-info-bg',    text: 'text-info',    label: 'Scheduled' },
  confirmed:   { bg: 'bg-[#f3e8ff]',  text: 'text-[#7c3aed]', label: 'Confirmed' },
  in_progress: { bg: 'bg-warning-bg', text: 'text-warning', label: 'In Progress' },
  completed:   { bg: 'bg-success-bg', text: 'text-success', label: 'Completed' },
  cancelled:   { bg: 'bg-muted-bg',   text: 'text-muted',   label: 'Cancelled' },
  no_show:     { bg: 'bg-danger-bg',  text: 'text-danger',  label: 'No Show' },
  rescheduled: { bg: 'bg-muted-bg',   text: 'text-muted',   label: 'Rescheduled' },
}

const TYPE_STYLES: Record<VisitType, { label: string; dot: string }> = {
  assessment: { label: 'Assessment', dot: 'bg-info' },
  treatment:  { label: 'Treatment',  dot: 'bg-primary' },
  discharge:  { label: 'Discharge',  dot: 'bg-warning' },
}

export default function VisitCard({ visit, role }: VisitCardProps) {
  const status = STATUS_STYLES[visit.status as VisitStatus] ?? STATUS_STYLES.scheduled
  const type = TYPE_STYLES[visit.type as VisitType] ?? TYPE_STYLES.treatment
  const patient = visit.patient
  const doctor = visit.doctor
  const doctorName = doctor?.profile?.full_name ?? 'Unassigned'
  const location = visit.location as { display_name?: string } | null

  function openMaps() {
    if (visit.location?.lat && visit.location?.lng) {
      window.open(
        `https://maps.google.com/?q=${visit.location.lat},${visit.location.lng}`,
        '_blank'
      )
    }
  }

  function callPatient() {
    if (patient?.phone) {
      window.location.href = `tel:${patient.phone}`
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex gap-4">
      {/* Time column */}
      <div className="flex flex-col items-center w-14 shrink-0">
        <p className="text-sm font-bold text-gray-900">
          {format(new Date(visit.scheduled_at), 'h:mm')}
        </p>
        <p className="text-xs text-muted">
          {format(new Date(visit.scheduled_at), 'a')}
        </p>
        <div className={`mt-2 w-2 h-2 rounded-full ${type.dot}`} />
      </div>

      {/* Divider */}
      <div className="w-px bg-border self-stretch" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {patient?.full_name ?? 'Unknown patient'}
            </p>
            <p className="text-xs text-muted mt-0.5">{patient?.complaint}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-gray-500">{type.label}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2.5">
          {role === 'admin' && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <User className="w-3.5 h-3.5" />
              <span>{doctorName}</span>
            </div>
          )}
          {location?.display_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{location.display_name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={openMaps}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition"
          >
            <MapPin className="w-3.5 h-3.5" />
            Navigate
          </button>
          <span className="text-border">·</span>
          <button
            onClick={callPatient}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </button>
          {role === 'doctor' && visit.status === 'scheduled' && (
            <>
              <span className="text-border">·</span>
              <button className="text-xs font-medium text-primary hover:text-primary-dark transition">
                Start Visit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

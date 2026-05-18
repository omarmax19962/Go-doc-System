import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import PatientStatusBadge from '@/components/shared/PatientStatusBadge'
import { format } from 'date-fns'
import { Phone, ChevronRight } from 'lucide-react'
import type { PatientStatus } from '@/types'

const STATUS_LIST: PatientStatus[] = [
  'lead','follow_up','didnt_reply','booked','active','paused','discharged','lost'
]

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('patients')
    .select(`
      *,
      assigned_doctor:doctors(id, specialty,
        profile:profiles(full_name)
      )
    `)
    .order('created_at', { ascending: false })

  if (status && STATUS_LIST.includes(status as PatientStatus)) {
    query = query.eq('status', status)
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: patients } = await query.limit(100)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-muted mt-0.5">
            {patients?.length ?? 0} records
          </p>
        </div>
        <Link
          href="patients/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition"
        >
          + New Patient
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5">
        <form className="flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or phone..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="patients"
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
              !status
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-border hover:border-primary'
            }`}
          >
            All
          </Link>
          {STATUS_LIST.map(s => (
            <Link
              key={s}
              href={`patients?status=${s}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                status === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-border hover:border-primary'
              }`}
            >
              {s.replace('_', ' ')}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {patients && patients.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted-bg">
                <th className="text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 text-start">Patient</th>
                <th className="text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 text-start">Status</th>
                <th className="text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 text-start">Doctor</th>
                <th className="text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 text-start">Added</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map(patient => (
                <tr key={patient.id} className="hover:bg-muted-bg transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{patient.full_name}</p>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {patient.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <PatientStatusBadge status={patient.status as PatientStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">
                      {(patient.assigned_doctor as any)?.profile?.full_name ?? (
                        <span className="text-muted italic">Unassigned</span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted">
                      {format(new Date(patient.created_at), 'd MMM yyyy')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`patients/${patient.id}`}>
                      <ChevronRight className="w-4 h-4 text-muted hover:text-primary transition" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 text-muted bg-white rounded-xl border border-border">
          <p>No patients found</p>
          {(q || status) && (
            <Link href="patients" className="text-sm text-primary hover:underline mt-2 inline-block">
              Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

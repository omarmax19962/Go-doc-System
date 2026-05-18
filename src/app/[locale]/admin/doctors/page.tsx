import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { UserPlus, MapPin, CheckCircle, XCircle } from 'lucide-react'

export default async function AdminDoctorsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: doctors } = await supabase
    .from('doctors')
    .select(`
      *,
      profile:profiles(full_name, phone)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-muted mt-0.5">{doctors?.length ?? 0} on the team</p>
        </div>
        <Link
          href={`/${locale}/admin/doctors/new`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition"
        >
          <UserPlus className="w-4 h-4" />
          Add Doctor
        </Link>
      </div>

      <div className="space-y-4">
        {doctors?.map(doctor => {
          const profile = doctor.profile as any
          const locations = doctor.covered_locations as any[]
          return (
            <div key={doctor.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-primary">
                  {profile?.full_name?.charAt(0) ?? 'D'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{profile?.full_name}</p>
                  {doctor.is_active
                    ? <span className="text-xs text-success flex items-center gap-1"><CheckCircle className="w-3 h-3" />Active</span>
                    : <span className="text-xs text-muted flex items-center gap-1"><XCircle className="w-3 h-3" />Inactive</span>
                  }
                </div>
                <p className="text-xs text-muted mt-0.5">{doctor.specialty} · {doctor.gender}</p>
                <p className="text-xs text-muted mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locations?.length > 0
                    ? locations.slice(0, 3).map((l: any) => l.display_name).join(', ')
                    : 'No coverage set'}
                </p>
              </div>
              <Link
                href={`/${locale}/admin/doctors/${doctor.id}`}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-gray-700 hover:bg-muted-bg transition"
              >
                Manage
              </Link>
            </div>
          )
        })}
        {!doctors?.length && (
          <div className="text-center py-16 bg-white rounded-xl border border-border text-muted">
            <p>No doctors yet</p>
            <Link href={`/${locale}/admin/doctors/new`} className="text-sm text-primary hover:underline mt-2 inline-block">
              Add your first doctor
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

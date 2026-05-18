import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DoctorProfileClient from '@/components/doctor/DoctorProfileClient'

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth`)

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  const { data: doctor } = await supabase
    .from('doctors').select('*').eq('user_id', user.id).single()
  const { data: stats } = await supabase
    .from('visits').select('id, status').eq('doctor_id', doctor?.id ?? '')
  const completed = stats?.filter(v => v.status === 'completed').length ?? 0

  const noteIds = await supabase
    .from('visit_notes').select('id').eq('doctor_id', doctor?.id ?? '')
    .then(r => r.data?.map(n => n.id) ?? [])

  const { data: feedbackHistory } = await supabase
    .from('review_actions').select('*')
    .in('note_id', noteIds)
    .order('created_at', { ascending: false }).limit(10)

  return (
    <DoctorProfileClient
      profile={profile}
      doctor={doctor}
      completedVisits={completed}
      totalVisits={stats?.length ?? 0}
      feedbackHistory={feedbackHistory ?? []}
      locale={locale}
    />
  )
}

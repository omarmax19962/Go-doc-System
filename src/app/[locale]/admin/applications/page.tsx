import { createServerSupabaseClient } from '@/lib/supabase-server'
import ApplicationsClient from './ApplicationsClient'

export default async function ApplicationsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: applications } = await supabase
    .from('doctor_applications')
    .select('*')
    .order('created_at', { ascending: false })

  return <ApplicationsClient applications={applications ?? []} />
}

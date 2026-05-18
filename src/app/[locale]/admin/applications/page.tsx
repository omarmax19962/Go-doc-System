import { createServerSupabaseClient } from '@/lib/supabase-server'
import ApplicationsClient from './ApplicationsClient'

export default async function ApplicationsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: applications } = await supabase
    .from('doctor_applications')
    .select('id, full_name, email, phone, specialty, gender, bio, status, rejection_reason, cv_url, created_at')
    .order('created_at', { ascending: false })

  return <ApplicationsClient applications={applications ?? []} />
}

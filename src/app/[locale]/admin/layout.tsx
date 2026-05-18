import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(`/${locale}/doctor/today`)

  const [{ count: reviewCount }, { count: applicationsCount }] = await Promise.all([
    supabase.from('visit_notes').select('id', { count: 'exact', head: true }).eq('review_status', 'submitted'),
    supabase.from('doctor_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        profile={{ ...profile!, email: user.email }}
        locale={locale}
        reviewBadge={reviewCount ?? 0}
        applicationsBadge={applicationsCount ?? 0}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

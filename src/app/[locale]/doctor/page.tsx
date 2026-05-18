import { redirect } from 'next/navigation'

export default async function DoctorRootPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/doctor/today`)
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase'
import {
  Calendar,
  Users,
  ClipboardCheck,
  UserCog,
  BarChart3,
  LogOut,
  Stethoscope,
} from 'lucide-react'
import type { AppUser } from '@/types'

interface Props {
  profile: AppUser
  locale: string
  reviewBadge: number
}

export default function AdminSidebar({ profile, locale, reviewBadge }: Props) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const nav = [
    { key: 'today', href: `/${locale}/admin/today`, icon: Calendar },
    { key: 'patients', href: `/${locale}/admin/patients`, icon: Users },
    { key: 'review', href: `/${locale}/admin/review`, icon: ClipboardCheck, badge: reviewBadge },
    { key: 'doctors', href: `/${locale}/admin/doctors`, icon: UserCog },
    { key: 'insights', href: `/${locale}/admin/insights`, icon: BarChart3 },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`/${locale}/auth`)
  }

  return (
    <aside className="w-64 bg-white border-e border-border flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Go Doc</p>
            <p className="text-xs text-muted">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ key, href, icon: Icon, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-600 hover:bg-muted-bg hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{t(key as any)}</span>
              {badge !== undefined && badge > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-danger text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* New Patient CTA */}
      <div className="px-3 pb-2">
        <Link
          href={`/${locale}/admin/patients/new`}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition"
        >
          <span>+</span>
          <span>New Patient</span>
        </Link>
      </div>

      {/* Profile / Logout */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {profile.full_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-muted truncate">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted hover:text-danger transition"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

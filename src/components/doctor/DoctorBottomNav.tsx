'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase'
import { Calendar, Users, FileText, User } from 'lucide-react'
import type { AppUser } from '@/types'

interface Props {
  locale: string
  profile: AppUser
}

export default function DoctorBottomNav({ locale, profile }: Props) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const nav = [
    { key: 'today',    href: `/${locale}/doctor/today`,    icon: Calendar },
    { key: 'patients', href: `/${locale}/doctor/patients`, icon: Users },
    { key: 'notes',    href: `/${locale}/doctor/notes`,    icon: FileText },
    { key: 'profile',  href: `/${locale}/doctor/profile`,  icon: User },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-border safe-area-pb z-50">
      <div className="flex">
        {nav.map(({ key, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={key}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                active ? 'text-primary' : 'text-muted hover:text-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium">{t(key as any)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

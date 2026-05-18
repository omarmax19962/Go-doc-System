'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function submitApplicationAction(data: {
  full_name: string
  email: string
  phone?: string
  specialty: string
  gender: string
  bio?: string
}) {
  const admin = createAdminClient()

  const { error } = await admin.from('doctor_applications').insert({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone || null,
    specialty: data.specialty,
    gender: data.gender as 'male' | 'female',
    bio: data.bio || null,
  })

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { error: 'An application with this email already exists.' }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

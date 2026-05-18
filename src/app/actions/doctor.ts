'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { friendlyError } from '@/lib/errors'

export async function createDoctorAction(data: {
  full_name: string
  email: string
  phone: string
  password: string
  specialty: string
  gender: string
}) {
  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      role: 'doctor',
      full_name: data.full_name,
      phone: data.phone,
    },
  })

  if (authError || !authData.user) {
    return { error: friendlyError(authError?.message ?? '') }
  }

  const { error: doctorError } = await admin
    .from('doctors')
    .insert({
      user_id: authData.user.id,
      specialty: data.specialty,
      gender: data.gender as 'male' | 'female',
      covered_locations: [],
      is_active: true,
    })

  if (doctorError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: friendlyError(doctorError.message) }
  }

  revalidatePath('/admin/doctors')
  return { success: true }
}

export async function acceptApplicationAction(applicationId: string) {
  const admin = createAdminClient()
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: app, error: fetchError } = await admin
    .from('doctor_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (fetchError || !app) return { error: 'Application not found' }

  // Generate a temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: app.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: 'doctor',
      full_name: app.full_name,
      phone: app.phone ?? '',
    },
  })

  if (authError || !authData.user) {
    return { error: friendlyError(authError?.message ?? '') }
  }

  const { error: doctorError } = await admin
    .from('doctors')
    .insert({
      user_id: authData.user.id,
      specialty: app.specialty,
      gender: app.gender as 'male' | 'female',
      covered_locations: [],
      is_active: true,
    })

  if (doctorError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: friendlyError(doctorError.message) }
  }

  await admin
    .from('doctor_applications')
    .update({
      status: 'accepted',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  revalidatePath('/admin/applications')
  revalidatePath('/admin/doctors')
  return { success: true, tempPassword, email: app.email }
}

export async function rejectApplicationAction(applicationId: string, reason?: string) {
  const admin = createAdminClient()
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await admin
    .from('doctor_applications')
    .update({
      status: 'rejected',
      rejection_reason: reason ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) return { error: error.message }

  revalidatePath('/admin/applications')
  return { success: true }
}

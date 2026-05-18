'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { friendlyError } from '@/lib/errors'

export async function createDoctorAction(data: {
  full_name: string
  email: string
  phone: string
  password?: string   // if omitted, a temp password is auto-generated
  specialty: string
  gender: string
  bio?: string
}) {
  const admin = createAdminClient()

  // Check if email already exists
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = listData?.users?.find(u => u.email === data.email)
  if (existingUser) {
    return { error: 'An account with this email already exists.' }
  }

  const tempPassword = data.password || (Math.random().toString(36).slice(-8) + 'A1!')

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: 'doctor',
      full_name: data.full_name,
      phone: data.phone,
    },
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create account' }
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
    return { error: doctorError.message }
  }

  revalidatePath('/admin/doctors')
  return { success: true, email: data.email, tempPassword }
}

export async function updateDoctorAction(doctorId: string, data: {
  specialty?: string
  is_active?: boolean
  covered_locations?: { place_id: string; display_name: string; lat: number; lng: number }[]
}) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('doctors')
    .update({
      ...(data.specialty !== undefined && { specialty: data.specialty }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.covered_locations !== undefined && { covered_locations: data.covered_locations }),
    })
    .eq('id', doctorId)

  if (error) return { error: friendlyError(error.message) }

  revalidatePath('/admin/doctors')
  revalidatePath(`/admin/doctors/${doctorId}`)
  return { success: true }
}

export async function updateDoctorProfileAction(userId: string, data: {
  full_name?: string
  phone?: string
}) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({
      ...(data.full_name !== undefined && { full_name: data.full_name }),
      ...(data.phone !== undefined && { phone: data.phone }),
    })
    .eq('id', userId)

  if (error) return { error: friendlyError(error.message) }

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

  // If this application was previously accepted (auth_user_id is set), just re-activate
  if ((app as any).auth_user_id) {
    const existingUserId = (app as any).auth_user_id as string

    // Re-activate doctor record in case it was deactivated
    await admin.from('doctors').update({ is_active: true }).eq('user_id', existingUserId)

    await admin
      .from('doctor_applications')
      .update({ status: 'accepted', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', applicationId)

    revalidatePath('/admin/applications')
    revalidatePath('/admin/doctors')
    return { success: true, email: app.email, reactivated: true }
  }

  // Check if an auth user with this email already exists
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existingAuthUser = listData?.users?.find(u => u.email === app.email)

  let authUserId: string
  let tempPassword: string | undefined

  if (existingAuthUser) {
    // Reuse existing auth user — just ensure they have a doctors row
    authUserId = existingAuthUser.id
  } else {
    // Create new auth user
    tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

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
      return { error: authError?.message ?? 'Failed to create account' }
    }

    authUserId = authData.user.id
  }

  // Upsert doctors row (create if missing, activate if already exists)
  const { data: existingDoctor } = await admin
    .from('doctors')
    .select('id')
    .eq('user_id', authUserId)
    .single()

  if (existingDoctor) {
    await admin.from('doctors').update({ is_active: true }).eq('user_id', authUserId)
  } else {
    const { error: doctorError } = await admin
      .from('doctors')
      .insert({
        user_id: authUserId,
        specialty: app.specialty,
        gender: app.gender as 'male' | 'female',
        covered_locations: [],
        is_active: true,
      })

    if (doctorError) {
      if (!existingAuthUser) await admin.auth.admin.deleteUser(authUserId)
      return { error: doctorError.message }
    }
  }

  await admin
    .from('doctor_applications')
    .update({
      status: 'accepted',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      auth_user_id: authUserId,
    } as any)
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

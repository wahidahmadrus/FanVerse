import { requireSupabase } from './supabaseClient.js'

export const getProfile = async (userId) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export const upsertProfile = async (profile) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const updateProfile = async (userId, profile) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .update(profile)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

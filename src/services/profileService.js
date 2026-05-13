import { requireSupabase } from './supabaseClient.js'

const isMissingColumnError = (error) =>
  error?.code === '42703' ||
  error?.message?.toLowerCase().includes('column') ||
  error?.message?.toLowerCase().includes('schema cache')

const getDefaultDisplayName = (user) =>
  user?.user_metadata?.display_name ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split('@')[0] ||
  'Fan Explorer'

export const getMainFandomName = (profile) =>
  profile?.favorite_fandom_artist || profile?.favorite_artist || ''

export const isFanProfileComplete = (profile) =>
  Boolean(
    profile?.profile_completed &&
      profile?.display_name?.trim() &&
      profile?.main_artist_id,
  )

export const shouldShowProfileCompletion = (profile) =>
  !profile ||
  !profile.profile_completed ||
  !profile.display_name?.trim() ||
  !profile.main_artist_id

export const getProfileCompletedValue = (profile) =>
  Boolean(profile?.display_name?.trim() && profile?.main_artist_id)

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

export const ensureProfile = async (user) => {
  if (!user?.id) {
    return null
  }

  const existingProfile = await getProfile(user.id)

  if (existingProfile) {
    if (!existingProfile.email && user.email) {
      const client = requireSupabase()
      const { data, error } = await client
        .from('profiles')
        .update({ email: user.email })
        .eq('user_id', user.id)
        .select()
        .single()

      if (!error) {
        return data
      }

      if (!isMissingColumnError(error)) {
        throw error
      }
    }

    return existingProfile
  }

  return upsertProfile({
    user_id: user.id,
    email: user.email || '',
    display_name: getDefaultDisplayName(user),
    bio: '',
    favorite_artist: '',
    favorite_fandom_artist: '',
    main_artist_id: null,
    profile_completed: false,
    avatar_url: user.user_metadata?.avatar_url || '',
    status: 'active',
  })
}

export const upsertProfile = async (profile) => {
  const client = requireSupabase()
  let response = await client
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single()

  if (response.error && isMissingColumnError(response.error) && 'email' in profile) {
    const profileWithoutEmail = { ...profile }
    delete profileWithoutEmail.email
    response = await client
      .from('profiles')
      .upsert(profileWithoutEmail, { onConflict: 'user_id' })
      .select()
      .single()
  }

  if (response.error) {
    throw response.error
  }

  return response.data
}

export const updateProfile = async (userId, profile) => {
  const client = requireSupabase()
  let response = await client
    .from('profiles')
    .update(profile)
    .eq('user_id', userId)
    .select()
    .single()

  if (response.error && isMissingColumnError(response.error) && 'email' in profile) {
    const profileWithoutEmail = { ...profile }
    delete profileWithoutEmail.email
    response = await client
      .from('profiles')
      .update(profileWithoutEmail)
      .eq('user_id', userId)
      .select()
      .single()
  }

  if (response.error) {
    throw response.error
  }

  return response.data
}

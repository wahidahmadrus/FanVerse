import { requireSupabase } from './supabaseClient.js'
import { ensureProfile, upsertProfile } from './profileService.js'

export const signUp = async ({ name, email, password }) => {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name,
      },
    },
  })

  if (error) {
    throw error
  }

  if (data.user && data.session) {
    await upsertProfile({
      user_id: data.user.id,
      email,
      display_name: name,
      bio: '',
      favorite_artist: '',
      favorite_fandom_artist: '',
      main_artist_id: null,
      profile_completed: false,
      avatar_url: '',
    })
  }

  return data
}

export const signIn = async ({ email, password }) => {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  if (data.user) {
    await ensureProfile(data.user)
  }

  return data
}

export const signOut = async () => {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

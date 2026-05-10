import { requireSupabase } from './supabaseClient.js'
import { upsertProfile } from './profileService.js'

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
      display_name: name,
      bio: '',
      favorite_artist: '',
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

  return data
}

export const signOut = async () => {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

import { normalizeArtist } from './artistService.js'
import { memorySelect, normalizeMemory } from './memoryService.js'
import { requireSupabase } from './supabaseClient.js'

const getRows = async (query) => {
  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

export const getAdminDashboard = async () => {
  const client = requireSupabase()
  const [profiles, artists, memories, badges, fanLinks, userBadges] =
    await Promise.all([
      getRows(
        client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
      ),
      getRows(
        client
          .from('artists')
          .select('*, artist_fans(count), memories(count)')
          .order('created_at', { ascending: false }),
      ),
      getRows(
        client
          .from('memories')
          .select(memorySelect)
          .order('created_at', { ascending: false }),
      ),
      getRows(
        client
          .from('badges')
          .select('*')
          .order('created_at', { ascending: false }),
      ),
      getRows(client.from('artist_fans').select('id')),
      getRows(client.from('user_badges').select('id')),
    ])

  return {
    profiles,
    artists: artists.map(normalizeArtist),
    memories: memories.map(normalizeMemory),
    badges,
    fanLinks,
    userBadges,
  }
}

export const updateProfileRole = async ({ profileId, role }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const updateArtistAdmin = async ({ artistId, updates }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('artists')
    .update(updates)
    .eq('id', artistId)
    .select('*, artist_fans(count), memories(count)')
    .single()

  if (error) {
    throw error
  }

  return normalizeArtist(data)
}

export const deleteArtistAdmin = async (artistId) => {
  const client = requireSupabase()
  const { error } = await client.from('artists').delete().eq('id', artistId)

  if (error) {
    throw error
  }
}

export const updateMemoryAdmin = async ({ memoryId, updates }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('memories')
    .update(updates)
    .eq('id', memoryId)
    .select(memorySelect)
    .single()

  if (error) {
    throw error
  }

  return normalizeMemory(data)
}

export const deleteMemoryAdmin = async (memoryId) => {
  const client = requireSupabase()
  const { error } = await client.from('memories').delete().eq('id', memoryId)

  if (error) {
    throw error
  }
}

export const deleteBadgeAdmin = async (badgeId) => {
  const client = requireSupabase()
  const { error } = await client.from('badges').delete().eq('id', badgeId)

  if (error) {
    throw error
  }
}

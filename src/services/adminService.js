import { normalizeArtist } from './artistService.js'
import {
  memorySelect,
  memorySelectWithProfileEmail,
  normalizeMemory,
} from './memoryService.js'
import { requireSupabase } from './supabaseClient.js'

const getRows = async (query) => {
  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

const isMissingColumnError = (error) =>
  error?.code === '42703' ||
  error?.message?.toLowerCase().includes('column') ||
  error?.message?.toLowerCase().includes('schema cache')

const getRowsWithFallback = async ({ fallbackQuery, query }) => {
  const { data, error } = await query

  if (!error) {
    return data || []
  }

  if (!isMissingColumnError(error)) {
    throw error
  }

  return getRows(fallbackQuery)
}

const getDeleteUserFunctionError = async (error) => {
  const fallbackMessage = 'This user could not be permanently deleted.'
  const rawMessage = error?.message || fallbackMessage
  const isFunctionReachabilityError =
    error?.name === 'FunctionsFetchError' ||
    rawMessage.toLowerCase().includes('failed to send a request')

  if (isFunctionReachabilityError) {
    return (
      'Delete user Edge Function could not be reached. Deploy the delete-user ' +
      'function and set SUPABASE_SERVICE_ROLE_KEY in Supabase secrets, then try again.'
    )
  }

  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json()

      if (body?.error) {
        return body.error
      }
    } catch {
      // Keep the original Functions error when the response is not JSON.
    }
  }

  return rawMessage
}

export const getAdminDashboard = async () => {
  const client = requireSupabase()
  const [profiles, artists, memories, badges, fanLinks, userBadges, userCards] =
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
      getRowsWithFallback({
        query: client
          .from('memories')
          .select(memorySelectWithProfileEmail)
          .order('created_at', { ascending: false }),
        fallbackQuery: client
          .from('memories')
          .select(memorySelect)
          .order('created_at', { ascending: false }),
      }),
      getRows(
        client
          .from('badges')
          .select('*')
          .order('created_at', { ascending: false }),
      ),
      getRows(client.from('artist_fans').select('id, user_id')),
      getRows(client.from('user_badges').select('id, user_id')),
      getRows(client.from('user_collectible_cards').select('id, user_id')),
    ])

  return {
    profiles,
    artists: artists.map(normalizeArtist),
    memories: memories.map(normalizeMemory),
    badges,
    fanLinks,
    userBadges,
    userCards,
  }
}

export const updateProfileRole = async ({ profileId, role }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .update({ role, is_admin: role === 'admin' })
    .eq('id', profileId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const updateProfileAdmin = async ({ profileId, updates }) => {
  const client = requireSupabase()
  const nextUpdates = { ...updates }

  if ('role' in nextUpdates) {
    nextUpdates.is_admin = nextUpdates.role === 'admin'
  }

  const { data, error } = await client
    .from('profiles')
    .update(nextUpdates)
    .eq('id', profileId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const deleteUserAdmin = async ({ userId }) => {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('delete-user', {
    body: { userId },
  })

  if (error) {
    throw new Error(await getDeleteUserFunctionError(error))
  }

  if (data?.error) {
    throw new Error(data.error)
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
  let response = await client
    .from('memories')
    .update(updates)
    .eq('id', memoryId)
    .select(memorySelectWithProfileEmail)
    .single()

  if (response.error && isMissingColumnError(response.error)) {
    response = await client
      .from('memories')
      .update(updates)
      .eq('id', memoryId)
      .select(memorySelect)
      .single()
  }

  if (response.error) {
    throw response.error
  }

  return normalizeMemory(response.data)
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

export const createBadgeAdmin = async (badge) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('badges')
    .insert(badge)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const updateBadgeAdmin = async ({ badgeId, updates }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('badges')
    .update(updates)
    .eq('id', badgeId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

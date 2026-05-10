import { requireSupabase } from './supabaseClient.js'

const createSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const getRelationCount = (relation) => {
  if (Array.isArray(relation)) {
    return relation[0]?.count || 0
  }

  return relation?.count || 0
}

export const normalizeArtist = (artist) => ({
  ...artist,
  fanCount: getRelationCount(artist.artist_fans),
  memoryCount: getRelationCount(artist.memories),
})

export const getArtists = async ({ search = '', limit } = {}) => {
  const client = requireSupabase()
  let query = client
    .from('artists')
    .select('*, artist_fans(count), memories(count)')
    .order('created_at', { ascending: false })

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data || []).map(normalizeArtist)
}

export const getArtistById = async (artistId) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('artists')
    .select('*, artist_fans(count), memories(count)')
    .eq('id', artistId)
    .single()

  if (error) {
    throw error
  }

  return normalizeArtist(data)
}

export const getSupportedArtists = async (userId) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('artist_fans')
    .select('created_at, artist:artists(*, artist_fans(count), memories(count))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || [])
    .map((row) => row.artist)
    .filter(Boolean)
    .map(normalizeArtist)
}

export const becomeFan = async ({ artistId, userId }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('artist_fans')
    .insert({
      artist_id: artistId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existingFan, error: existingFanError } = await client
        .from('artist_fans')
        .select()
        .eq('artist_id', artistId)
        .eq('user_id', userId)
        .single()

      if (existingFanError) {
        throw existingFanError
      }

      return existingFan
    }

    throw error
  }

  return data
}

export const isFanOfArtist = async ({ artistId, userId }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('artist_fans')
    .select('id')
    .eq('artist_id', artistId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

export const createArtist = async ({ artist, userId }) => {
  const client = requireSupabase()
  const slugBase = createSlug(artist.name)
  const slug = `${slugBase}-${Date.now().toString(36)}`

  const { data, error } = await client
    .from('artists')
    .insert({
      name: artist.name,
      slug,
      category: artist.category,
      description: artist.description,
      image_url: artist.imageUrl || null,
      created_by: userId,
    })
    .select('*, artist_fans(count), memories(count)')
    .single()

  if (error) {
    throw error
  }

  await becomeFan({ artistId: data.id, userId })

  return normalizeArtist(data)
}

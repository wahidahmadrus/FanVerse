import { requireSupabase } from './supabaseClient.js'
import { calculateMemoryReward } from './rewardService.js'

export const memorySelect = `
  *,
  artist:artists(id, name, category, image_url),
  profile:profiles!memories_user_id_profiles_fkey(display_name, avatar_url)
`

export const memorySelectWithProfileEmail = `
  *,
  artist:artists(id, name, category, image_url),
  profile:profiles!memories_user_id_profiles_fkey(display_name, email, avatar_url)
`

export const normalizeMemory = (memory) => ({
  ...memory,
  title: memory.title,
  artist: memory.artist,
  artistName: memory.artist?.name || 'Unknown artist',
  type: memory.activity_type,
  date: memory.memory_date,
  baseStars: memory.base_stars || memory.stars || 0,
  finalStars: memory.final_stars || memory.stars || 0,
  stars: memory.final_stars || memory.stars || 0,
  hasProof: memory.has_proof || Boolean(memory.proof_image_url),
  proofImageUrl: memory.proof_image_url,
  imageUrl: memory.proof_image_url,
  authorName: memory.profile?.display_name || 'Fan explorer',
  authorEmail: memory.profile?.email || '',
})

export const getPublicMemories = async ({ artistId, excludeUserId, limit } = {}) => {
  const client = requireSupabase()
  let query = client
    .from('memories')
    .select(memorySelect)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  if (artistId) {
    query = query.eq('artist_id', artistId)
  }

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data || []).map(normalizeMemory)
}

export const getUserMemories = async ({ artistId, userId, limit } = {}) => {
  const client = requireSupabase()
  let query = client
    .from('memories')
    .select(memorySelect)
    .eq('user_id', userId)
    .order('memory_date', { ascending: false })

  if (artistId) {
    query = query.eq('artist_id', artistId)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data || []).map(normalizeMemory)
}

export const getUserMemoryCount = async (userId) => {
  const client = requireSupabase()
  const { count, error } = await client
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return count || 0
}

export const getUserMemoryById = async ({ memoryId, userId }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('memories')
    .select(memorySelect)
    .eq('id', memoryId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('This memory could not be found in your archive.')
  }

  return normalizeMemory(data)
}

export const createMemory = async ({ memory, userId }) => {
  if (!memory.artistId) {
    throw new Error('Choose or create your fandom before archiving a memory.')
  }

  const client = requireSupabase()
  const hasProof = Boolean(memory.proofImageUrl)
  const reward = calculateMemoryReward({
    activityType: memory.activityType,
    hasProof,
  })
  const { data, error } = await client
    .from('memories')
    .insert({
      user_id: userId,
      artist_id: memory.artistId,
      title: memory.title,
      activity_type: memory.activityType,
      mood: memory.mood,
      description: memory.description,
      stars: reward.finalStars,
      base_stars: reward.baseStars,
      final_stars: reward.finalStars,
      proof_image_url: memory.proofImageUrl || null,
      has_proof: hasProof,
      visibility: memory.visibility,
      memory_date: memory.memoryDate,
    })
    .select(memorySelect)
    .single()

  if (error) {
    if (
      error.code === '23503' ||
      error.message?.includes('memories_artist_id_fkey') ||
      error.message?.toLowerCase().includes('foreign key')
    ) {
      console.error('Memory insert failed because artist_id was invalid:', error)
      throw new Error(
        'This memory could not be archived because the fandom was not found. Please choose or create your fandom again.',
      )
    }

    throw error
  }

  return normalizeMemory(data)
}

export const updateMemory = async ({ memoryId, memory, userId }) => {
  const client = requireSupabase()
  const hasProof = Boolean(memory.proofImageUrl)
  const reward = calculateMemoryReward({
    activityType: memory.activityType,
    hasProof,
  })
  const { data, error } = await client
    .from('memories')
    .update({
      artist_id: memory.artistId,
      title: memory.title,
      activity_type: memory.activityType,
      mood: memory.mood,
      description: memory.description,
      stars: reward.finalStars,
      base_stars: reward.baseStars,
      final_stars: reward.finalStars,
      proof_image_url: memory.proofImageUrl || null,
      has_proof: hasProof,
      visibility: memory.visibility,
      memory_date: memory.memoryDate,
    })
    .eq('id', memoryId)
    .eq('user_id', userId)
    .select(memorySelect)
    .single()

  if (error) {
    throw error
  }

  return normalizeMemory(data)
}

export const deleteMemory = async ({ memoryId, userId }) => {
  const client = requireSupabase()
  const { error } = await client
    .from('memories')
    .delete()
    .eq('id', memoryId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

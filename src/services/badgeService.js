import { badgeCatalog } from '../data/badges.js'
import { requireSupabase } from './supabaseClient.js'

const hasActivity = (memories, activity) =>
  memories.some((memory) => memory.activity_type === activity || memory.type === activity)

const countActivity = (memories, activity) =>
  memories.filter(
    (memory) => memory.activity_type === activity || memory.type === activity,
  ).length

const getTotalStars = (memories) =>
  memories.reduce(
    (totalStars, memory) => totalStars + Number(memory.final_stars || memory.stars || 0),
    0,
  )

const meetsCondition = (badge, memories, supportedArtists = []) => {
  const conditionType = badge.condition_type
  const requiredValue = Number(badge.condition_value || 1)

  switch (conditionType) {
    case 'first_memory':
      return memories.length >= requiredValue
    case 'total_memories':
      return memories.length >= requiredValue
    case 'total_stars':
      return getTotalStars(memories) >= requiredValue
    case 'proof_memories':
      return memories.filter((memory) => memory.has_proof || memory.proof_image_url).length >= requiredValue
    case 'concert_memories':
      return countActivity(memories, 'Concert') >= requiredValue
    case 'fan_art_memories':
      return countActivity(memories, 'Fan Art') >= requiredValue
    case 'streaming_memories':
      return countActivity(memories, 'Streaming') >= requiredValue
    case 'voting_memories':
      return countActivity(memories, 'Voting') >= requiredValue
    case 'concert_star':
      return hasActivity(memories, 'Concert') || hasActivity(memories, 'Fan Event')
    case 'streaming_hero':
      return hasActivity(memories, 'Streaming')
    case 'proof_added':
      return memories.some((memory) => memory.has_proof || memory.proof_image_url)
    case 'hundred_stars':
      return getTotalStars(memories) >= 100
    case 'fan_art_memory':
      return hasActivity(memories, 'Fan Art')
    case 'weekly_active':
      return memories.length > 0
    case 'fan_project':
      return hasActivity(memories, 'Fan Event') || hasActivity(memories, 'Social Support')
    case 'positive_fan':
      return memories.length >= Math.max(requiredValue, 10)
    case 'seven_day_supporter':
      return memories.length >= Math.max(requiredValue, 4)
    case 'artist_supporter':
      return supportedArtists.length >= requiredValue
    default:
      return false
  }
}

const fallbackBadges = badgeCatalog.map((badge) => ({
  id: badge.id,
  title: badge.title,
  description: badge.description,
  icon: badge.icon,
  condition_type: badge.conditionType || badge.id.replaceAll('-', '_'),
  condition_value: 1,
}))

export const getBadges = async () => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('badges')
    .select('*')
    .order('title', { ascending: true })

  if (error) {
    throw error
  }

  return data?.length ? data : fallbackBadges
}

const buildBadgeRows = (badges, unlockedIds) =>
  badges.map((badge) => ({
    ...badge,
    glow: badge.glow || 'purple',
    unlocked: unlockedIds.has(badge.id),
  }))

export const syncUserBadges = async ({ userId, memories, supportedArtists = [] }) => {
  const client = requireSupabase()
  const badges = await getBadges()
  const unlockedBadges = badges.filter((badge) =>
    meetsCondition(badge, memories, supportedArtists),
  )

  if (unlockedBadges.length > 0) {
    const { error } = await client.from('user_badges').upsert(
      unlockedBadges.map((badge) => ({
        user_id: userId,
        badge_id: badge.id,
      })),
      { onConflict: 'user_id,badge_id' },
    )

    if (error) {
      throw error
    }
  }

  const { data: userBadges, error } = await client
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  const unlockedIds = new Set((userBadges || []).map((userBadge) => userBadge.badge_id))

  return buildBadgeRows(badges, unlockedIds)
}

export const syncUserBadgesWithNew = async ({
  userId,
  memories,
  supportedArtists = [],
}) => {
  const client = requireSupabase()
  const badges = await getBadges()
  const { data: existingBadges, error: existingError } = await client
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  if (existingError) {
    throw existingError
  }

  const existingIds = new Set(
    (existingBadges || []).map((userBadge) => userBadge.badge_id),
  )
  const eligibleBadges = badges.filter((badge) =>
    meetsCondition(badge, memories, supportedArtists),
  )
  const newBadges = eligibleBadges.filter((badge) => !existingIds.has(badge.id))

  if (newBadges.length > 0) {
    const { error } = await client.from('user_badges').insert(
      newBadges.map((badge) => ({
        user_id: userId,
        badge_id: badge.id,
      })),
    )

    if (error) {
      throw error
    }
  }

  const unlockedIds = new Set([
    ...existingIds,
    ...newBadges.map((badge) => badge.id),
  ])

  return {
    badges: buildBadgeRows(badges, unlockedIds),
    newBadges,
  }
}

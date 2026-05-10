import { badgeCatalog } from '../data/badges.js'
import { requireSupabase } from './supabaseClient.js'

const hasActivity = (memories, activity) =>
  memories.some((memory) => memory.activity_type === activity || memory.type === activity)

const meetsCondition = (conditionType, memories, supportedArtists = []) => {
  switch (conditionType) {
    case 'first_memory':
      return memories.length > 0
    case 'concert_star':
      return hasActivity(memories, 'Concert') || hasActivity(memories, 'Fan Event')
    case 'streaming_hero':
      return hasActivity(memories, 'Streaming')
    case 'fan_project':
      return hasActivity(memories, 'Fan Event') || hasActivity(memories, 'Social Support')
    case 'positive_fan':
      return memories.length >= 3
    case 'seven_day_supporter':
      return memories.length >= 4
    case 'artist_supporter':
      return supportedArtists.length > 0
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

export const syncUserBadges = async ({ userId, memories, supportedArtists = [] }) => {
  const client = requireSupabase()
  const badges = await getBadges()
  const unlockedBadges = badges.filter((badge) =>
    meetsCondition(badge.condition_type, memories, supportedArtists),
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

  return badges.map((badge) => ({
    ...badge,
    glow: badge.glow || 'purple',
    unlocked: unlockedIds.has(badge.id),
  }))
}

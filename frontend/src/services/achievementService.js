import { getSupportedArtists } from './artistService.js'
import { syncUserBadgesWithNew } from './badgeService.js'
import {
  getActiveCollectibleCards,
  unlockCollectibleCards,
} from './collectibleService.js'
import { getUserMemories } from './memoryService.js'

const getActivityCount = (memories, activityType) =>
  memories.filter((memory) => memory.activity_type === activityType).length

const getTotalStars = (memories) =>
  memories.reduce(
    (totalStars, memory) => totalStars + Number(memory.final_stars || memory.stars || 0),
    0,
  )

const getSameArtistMemoryMax = (memories) => {
  const counts = memories.reduce((artistCounts, memory) => {
    artistCounts[memory.artist_id] = (artistCounts[memory.artist_id] || 0) + 1
    return artistCounts
  }, {})

  return Math.max(0, ...Object.values(counts))
}

const isThisWeek = (date) => {
  const memoryDate = new Date(`${date}T00:00:00`)
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  return memoryDate >= weekAgo && memoryDate <= now
}

const isThisMonth = (date) => {
  const memoryDate = new Date(`${date}T00:00:00`)
  const now = new Date()
  return (
    memoryDate.getFullYear() === now.getFullYear() &&
    memoryDate.getMonth() === now.getMonth()
  )
}

const getConditionValue = ({ conditionType, memories, supportedArtists }) => {
  switch (conditionType) {
    case 'first_memory':
      return memories.length
    case 'total_memories':
      return memories.length
    case 'total_stars':
      return getTotalStars(memories)
    case 'proof_memories':
      return memories.filter((memory) => memory.has_proof).length
    case 'concert_memories':
      return getActivityCount(memories, 'Concert')
    case 'fan_meet_memories':
      return getActivityCount(memories, 'Fan Meet')
    case 'fan_art_memories':
      return getActivityCount(memories, 'Fan Art')
    case 'streaming_memories':
      return getActivityCount(memories, 'Streaming')
    case 'voting_memories':
      return getActivityCount(memories, 'Voting')
    case 'social_support_memories':
      return getActivityCount(memories, 'Social Support')
    case 'merch_memories':
      return getActivityCount(memories, 'Merch')
    case 'special_moment_memories':
      return getActivityCount(memories, 'Special Moment')
    case 'artist_support_count':
      return supportedArtists.length
    case 'same_artist_memories':
      return getSameArtistMemoryMax(memories)
    case 'weekly_active':
      return memories.some((memory) => isThisWeek(memory.memory_date)) ? 1 : 0
    case 'monthly_active':
      return memories.some((memory) => isThisMonth(memory.memory_date)) ? 1 : 0
    case 'golden_memory':
      return Math.max(
        0,
        ...memories.map((memory) => Number(memory.final_stars || memory.stars || 0)),
      )
    case 'cosmic_proof':
      return memories.some(
        (memory) =>
          memory.has_proof &&
          ['Concert', 'Fan Meet'].includes(memory.activity_type),
      )
        ? 1
        : 0
    case 'proof_special_moment':
      return memories.some(
        (memory) =>
          memory.has_proof && memory.activity_type === 'Special Moment',
      )
        ? 1
        : 0
    case 'detailed_memories':
      return memories.filter((memory) => memory.description?.length >= 120).length
    case 'first_archive_card':
      return 0
    default:
      return 0
  }
}

export const checkAchievements = async ({ userId }) => {
  const [memories, supportedArtists, activeCards] = await Promise.all([
    getUserMemories({ userId }),
    getSupportedArtists(userId),
    getActiveCollectibleCards(),
  ])

  const badgeResult = await syncUserBadgesWithNew({
    userId,
    memories,
    supportedArtists,
  })

  const eligibleCards = activeCards.filter((card) => {
    if (
      card.card_type &&
      !['normal_reward', 'achievement'].includes(card.card_type)
    ) {
      return false
    }

    const conditionValue = getConditionValue({
      conditionType: card.unlock_condition_type,
      memories,
      supportedArtists,
    })

    return conditionValue >= Number(card.unlock_condition_value || 1)
  })
  const newCards = await unlockCollectibleCards({ userId, cards: eligibleCards })

  return {
    badges: badgeResult.badges,
    newBadges: badgeResult.newBadges,
    newCards,
    memories,
    supportedArtists,
  }
}

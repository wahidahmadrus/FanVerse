import { getSupportedArtists } from './artistService.js'
import { getUserMemories } from './memoryService.js'
import { requireSupabase } from './supabaseClient.js'

const characterFragmentCardTypes = ['character_story', 'monthly_premium']

const isCharacterFragmentCard = (card) =>
  characterFragmentCardTypes.includes(card?.card_type)

const getActivityCount = (memories, activityType) =>
  memories.filter((memory) => memory.activity_type === activityType).length

const getConditionValue = (conditionType, userStats) => {
  switch (conditionType) {
    case 'first_memory':
      return userStats.totalMemories
    case 'total_memories':
      return userStats.totalMemories
    case 'total_stars':
      return userStats.totalStars
    case 'proof_memories':
      return userStats.proofMemories
    case 'concert_memories':
      return userStats.concertMemories
    case 'fan_art_memories':
      return userStats.fanArtMemories
    case 'streaming_memories':
      return userStats.streamingMemories
    case 'voting_memories':
      return userStats.votingMemories
    case 'artist_support_count':
      return userStats.supportedArtistCount
    default:
      return 0
  }
}

const getRequiredValue = (card) => Number(card.unlock_condition_value || 1)

const getRemainingValue = (card, userStats) =>
  Math.max(
    0,
    getRequiredValue(card) -
      getConditionValue(card.unlock_condition_type, userStats),
  )

export const getUserStats = async (userId) => {
  const [memories, supportedArtists] = await Promise.all([
    getUserMemories({ userId }),
    getSupportedArtists(userId),
  ])

  return {
    totalMemories: memories.length,
    totalStars: memories.reduce(
      (totalStars, memory) =>
        totalStars + Number(memory.final_stars || memory.stars || 0),
      0,
    ),
    proofMemories: memories.filter((memory) => memory.has_proof).length,
    concertMemories: getActivityCount(memories, 'Concert'),
    fanArtMemories: getActivityCount(memories, 'Fan Art'),
    streamingMemories: getActivityCount(memories, 'Streaming'),
    votingMemories: getActivityCount(memories, 'Voting'),
    supportedArtistCount: supportedArtists.length,
  }
}

export const isCardConditionMet = (card, userStats = {}) => {
  if (isCharacterFragmentCard(card)) {
    return true
  }

  return (
    getConditionValue(card.unlock_condition_type, userStats) >=
    getRequiredValue(card)
  )
}

const getUserCardsForEligibility = async (userId) => {
  const client = requireSupabase()
  const [cardsResponse, unlockedResponse] = await Promise.all([
    client
      .from('collectible_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    client
      .from('user_collectible_cards')
      .select('collectible_card_id, unlocked_at')
      .eq('user_id', userId),
  ])

  if (cardsResponse.error) {
    throw cardsResponse.error
  }

  if (unlockedResponse.error) {
    throw unlockedResponse.error
  }

  const unlockedById = new Map(
    (unlockedResponse.data || []).map((row) => [row.collectible_card_id, row]),
  )

  return (cardsResponse.data || []).map((card) => ({
    ...card,
    ...(unlockedById.get(card.id) || {}),
    card_type: card.card_type || 'normal_reward',
    character_id: card.character_id || '',
    story_fragment: card.story_fragment || '',
    unlocked: Boolean(unlockedById.get(card.id)?.unlocked_at),
  }))
}

export const getEligibleDrawCards = async (userId) => {
  const [cards, userStats] = await Promise.all([
    getUserCardsForEligibility(userId),
    getUserStats(userId),
  ])

  return cards.filter(
    (card) =>
      card.is_active !== false &&
      !card.unlocked &&
      (isCharacterFragmentCard(card) || isCardConditionMet(card, userStats)),
  )
}

export const getLockedCardProgressText = (card, userStats = {}) => {
  if (isCharacterFragmentCard(card)) {
    return 'Draw from the Archive to reveal this character fragment.'
  }

  if (isCardConditionMet(card, userStats)) {
    return 'This card is ready for your next Archive draw.'
  }

  const remainingValue = getRemainingValue(card, userStats)
  const pluralize = (word) => (remainingValue === 1 ? word : `${word}s`)

  switch (card.unlock_condition_type) {
    case 'first_memory':
    case 'total_memories':
      return `Archive ${remainingValue} more ${pluralize(
        'memory',
      )} to reveal this card.`
    case 'total_stars':
      return `Earn ${remainingValue} more ${pluralize(
        'star',
      )} to reveal this card.`
    case 'proof_memories':
      return `Add proof to ${remainingValue} more ${pluralize(
        'memory',
      )} to reveal this card.`
    case 'concert_memories':
      return `Archive ${remainingValue} more concert ${pluralize(
        'memory',
      )} to reveal this card.`
    case 'fan_art_memories':
      return `Archive ${remainingValue} more fan art ${pluralize(
        'memory',
      )} to reveal this card.`
    case 'streaming_memories':
      return `Archive ${remainingValue} more streaming ${pluralize(
        'memory',
      )} to reveal this card.`
    case 'voting_memories':
      return `Archive ${remainingValue} more voting ${pluralize(
        'memory',
      )} to reveal this card.`
    case 'artist_support_count':
      return `Support ${remainingValue} more ${pluralize(
        'artist',
      )} to reveal this card.`
    default:
      return 'Add more memories to unlock this card for the draw.'
  }
}

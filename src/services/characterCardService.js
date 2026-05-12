import { getArchiveCharacterById } from '../data/archiveCharacters.js'
import { getCollectibleImageUrl } from './collectibleService.js'
import { requireSupabase } from './supabaseClient.js'

const getStorageKey = (userId) => `fanverse:first-archive-card:${userId}`

const canUseLocalStorage = () => typeof window !== 'undefined' && window.localStorage

const characterCardTypes = ['character_story', 'monthly_premium']

const uniqueStrings = (values) => [...new Set(values.filter(Boolean))]

export const getLinkedCharacterCard = ({ cards = [], characterId }) => {
  const linkedCards = cards.filter((card) => card.character_id === characterId)

  return (
    linkedCards.find(
      (card) =>
        card.card_type === 'monthly_premium' && getCollectibleImageUrl(card),
    ) ||
    linkedCards.find(
      (card) =>
        characterCardTypes.includes(card.card_type) && getCollectibleImageUrl(card),
    ) ||
    linkedCards.find((card) => getCollectibleImageUrl(card)) ||
    linkedCards[0] ||
    null
  )
}

export const getCharacterCardImageSources = ({ cards = [], character }) => {
  if (!character) {
    return []
  }

  const linkedCard = getLinkedCharacterCard({
    cards,
    characterId: character.id,
  })
  const linkedImageUrl = linkedCard ? getCollectibleImageUrl(linkedCard) : ''

  return uniqueStrings([
    linkedImageUrl,
    character.cardImageUrl,
    character.imageUrl,
  ])
}

export const getCharacterCardImageUrl = ({ cards = [], character }) =>
  getCharacterCardImageSources({ cards, character })[0] || ''

export const getFirstArchiveCharacterId = ({ profile, userId }) => {
  if (profile?.first_character_id) {
    return profile.first_character_id
  }

  if (profile?.first_archive_character_id) {
    return profile.first_archive_character_id
  }

  if (userId && canUseLocalStorage()) {
    return window.localStorage.getItem(getStorageKey(userId)) || ''
  }

  return ''
}

const saveLocalFirstArchiveCharacter = ({ userId, characterId }) => {
  if (userId && canUseLocalStorage()) {
    window.localStorage.setItem(getStorageKey(userId), characterId)
  }
}

const isMissingColumnError = (error) =>
  error?.code === '42703' ||
  error?.message?.toLowerCase().includes('column') ||
  error?.message?.toLowerCase().includes('schema cache')

const updateFirstArchiveCharacterProfile = async ({ client, userId, characterId }) => {
  const profileFieldPayloads = [
    {
      first_character_id: characterId,
      first_archive_character_id: characterId,
    },
    { first_archive_character_id: characterId },
    { first_character_id: characterId },
  ]

  for (const payload of profileFieldPayloads) {
    const { error } = await client
      .from('profiles')
      .update(payload)
      .eq('user_id', userId)

    if (!error) {
      return true
    }

    if (!isMissingColumnError(error)) {
      throw error
    }
  }

  return false
}

const unlockLinkedCharacterCard = async ({ client, userId, characterId }) => {
  const { data: card, error: cardError } = await client
    .from('collectible_cards')
    .select('id')
    .eq('character_id', characterId)
    .eq('is_active', true)
    .eq('card_type', 'character_story')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (cardError) {
    if (isMissingColumnError(cardError)) {
      return null
    }

    throw cardError
  }

  if (!card) {
    return null
  }

  const { error: unlockError } = await client
    .from('user_collectible_cards')
    .insert({
      user_id: userId,
      collectible_card_id: card.id,
    })

  if (unlockError && unlockError.code !== '23505') {
    throw unlockError
  }

  return card.id
}

export const chooseFirstArchiveCharacter = async ({ characterId, userId }) => {
  const character = getArchiveCharacterById(characterId)

  if (!character) {
    throw new Error('Choose one of the Archive Zero characters.')
  }

  const client = requireSupabase()
  const savedToProfile = await updateFirstArchiveCharacterProfile({
    characterId,
    client,
    userId,
  })

  const unlockedCardId = !savedToProfile
    ? null
    : await unlockLinkedCharacterCard({ client, userId, characterId })

  saveLocalFirstArchiveCharacter({ userId, characterId })

  return {
    character,
    savedToProfile,
    unlockedCardId,
  }
}

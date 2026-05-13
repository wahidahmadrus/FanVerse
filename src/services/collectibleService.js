import { getEligibleDrawCards } from './cardEligibilityService.js'
import { requireSupabase, supabase } from './supabaseClient.js'

const imageFieldNames = [
  'image_url',
  'imageUrl',
  'card_image_url',
  'cardImageUrl',
  'card_image',
  'cardImage',
  'image',
]

const thumbnailFieldNames = [
  'thumbnail_url',
  'thumbnailUrl',
  'thumb_url',
  'thumbUrl',
  'card_thumbnail_url',
  'cardThumbnailUrl',
  'thumbnail',
]

const monthlyPremiumCardType = 'monthly_premium'
const archiveDrawUnlockType = 'archive_draw'
const archiveDrawCooldownMs = 24 * 60 * 60 * 1000

export const archiveDrawLimit = 1
export const characterFragmentCardTypes = ['character_story', 'monthly_premium']

const isMissingColumnError = (error) =>
  error?.code === '42703' ||
  error?.message?.toLowerCase().includes('column') ||
  error?.message?.toLowerCase().includes('schema cache')

const isMissingCardDrawsError = (error) =>
  error?.code === '42P01' ||
  error?.message?.toLowerCase().includes('card_draws') ||
  error?.message?.toLowerCase().includes('relation') ||
  error?.message?.toLowerCase().includes('schema cache')

const hasThumbnailField = (payload) =>
  Object.prototype.hasOwnProperty.call(payload, 'thumbnail_url')

const withoutThumbnailUrl = (payload) => {
  const nextPayload = { ...payload }
  delete nextPayload.thumbnail_url
  return nextPayload
}

const isDirectImageUrl = (imageValue) =>
  /^https?:\/\//i.test(imageValue) ||
  imageValue.startsWith('/') ||
  imageValue.startsWith('data:image/') ||
  imageValue.startsWith('blob:')

const getImageFieldValue = ({ card, fieldNames }) =>
  fieldNames
    .map((fieldName) => card?.[fieldName])
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim()

const getStorageImageUrl = (imageValue) => {
  if (!imageValue) {
    return ''
  }

  if (isDirectImageUrl(imageValue) || !supabase) {
    return imageValue
  }

  const storagePath = imageValue.startsWith('collectible-cards/')
    ? imageValue.replace('collectible-cards/', '')
    : imageValue
  const {
    data: { publicUrl },
  } = supabase.storage.from('collectible-cards').getPublicUrl(storagePath)

  return publicUrl
}

export const getCollectibleImageUrl = (card) =>
  getStorageImageUrl(
    getImageFieldValue({
      card,
      fieldNames: imageFieldNames,
    }),
  )

export const getCollectibleThumbnailUrl = (card) => {
  const thumbnailUrl = getStorageImageUrl(
    getImageFieldValue({
      card,
      fieldNames: thumbnailFieldNames,
    }),
  )

  return thumbnailUrl || getCollectibleImageUrl(card)
}

export const normalizeCollectibleCard = (card) => {
  const imageUrl = getCollectibleImageUrl(card)
  const thumbnailUrl = getCollectibleThumbnailUrl(card)

  return {
    ...card,
    card_type: card.card_type || 'normal_reward',
    character_id: card.character_id || '',
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
    story_fragment: card.story_fragment || '',
    unlock_month: card.unlock_month || '',
    unlock_type: card.unlock_type || '',
    unlocked: Boolean(card.unlocked_at),
  }
}

export const getCurrentUnlockMonth = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const getUnlockMonthFromDate = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return getCurrentUnlockMonth(date)
}

const getCardUnlockMonth = (card) =>
  card.unlock_month || getUnlockMonthFromDate(card.unlocked_at)

export const isMonthlyPremiumCard = (card) =>
  card?.card_type === monthlyPremiumCardType

export const isCharacterFragmentCard = (card) =>
  characterFragmentCardTypes.includes(card?.card_type)

export const getCollectibleCardTypeLabel = (card) =>
  isCharacterFragmentCard(card)
    ? 'Premium Character Fragment'
    : card?.card_type === 'achievement'
      ? 'Achievement Reward'
      : 'Regular Reward'

export const getArchiveDrawTypeForCard = (card) =>
  isCharacterFragmentCard(card) ? 'character_fragment' : 'regular'

export const getMonthlyPremiumUnlockForMonth = ({
  cards,
  month = getCurrentUnlockMonth(),
}) =>
  cards.find(
    (card) =>
      isMonthlyPremiumCard(card) &&
      card.unlocked &&
      getCardUnlockMonth(card) === month,
  )

const getUnlockedRows = async ({ client, userId }) => {
  const extendedResponse = await client
    .from('user_collectible_cards')
    .select('collectible_card_id, unlocked_at, unlock_month, unlock_type')
    .eq('user_id', userId)

  if (!extendedResponse.error) {
    return extendedResponse
  }

  if (!isMissingColumnError(extendedResponse.error)) {
    return extendedResponse
  }

  return client
    .from('user_collectible_cards')
    .select('collectible_card_id, unlocked_at')
    .eq('user_id', userId)
}

export const getActiveCollectibleCards = async () => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('collectible_cards')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []).map(normalizeCollectibleCard)
}

export const getUserCollectibleCards = async (userId) => {
  const client = requireSupabase()
  const [cardsResponse, unlockedResponse] = await Promise.all([
    client
      .from('collectible_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    getUnlockedRows({ client, userId }),
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

  return (cardsResponse.data || []).map((card) =>
    normalizeCollectibleCard({
      ...card,
      ...(unlockedById.get(card.id) || {}),
    }),
  )
}

const buildArchiveDrawStatus = ({ lastDrawAt = '', now = new Date() } = {}) => {
  if (!lastDrawAt) {
    return {
      canDraw: true,
      drawsRemaining: archiveDrawLimit,
      lastDrawAt: '',
      limit: archiveDrawLimit,
      nextDrawAt: '',
    }
  }

  const lastDrawDate = new Date(lastDrawAt)

  if (Number.isNaN(lastDrawDate.getTime())) {
    return {
      canDraw: true,
      drawsRemaining: archiveDrawLimit,
      lastDrawAt: '',
      limit: archiveDrawLimit,
      nextDrawAt: '',
    }
  }

  const nextDrawDate = new Date(lastDrawDate.getTime() + archiveDrawCooldownMs)
  const canDraw = now.getTime() >= nextDrawDate.getTime()

  return {
    canDraw,
    drawsRemaining: canDraw ? archiveDrawLimit : 0,
    lastDrawAt: lastDrawDate.toISOString(),
    limit: archiveDrawLimit,
    nextDrawAt: canDraw ? '' : nextDrawDate.toISOString(),
  }
}

const getLastArchiveDrawFallback = async ({ client, userId }) => {
  const response = await client
    .from('user_collectible_cards')
    .select('unlocked_at, unlock_type')
    .eq('user_id', userId)
    .eq('unlock_type', archiveDrawUnlockType)
    .order('unlocked_at', { ascending: false })
    .limit(1)

  if (!response.error) {
    return response.data?.[0]?.unlocked_at || ''
  }

  if (isMissingColumnError(response.error)) {
    return ''
  }

  throw response.error
}

const getLastArchiveDrawAt = async ({ client, userId }) => {
  const response = await client
    .from('card_draws')
    .select('drawn_at')
    .eq('user_id', userId)
    .order('drawn_at', { ascending: false })
    .limit(1)

  if (!response.error) {
    const historyDrawAt = response.data?.[0]?.drawn_at || ''
    const fallbackDrawAt = await getLastArchiveDrawFallback({ client, userId })
    const drawTimes = [historyDrawAt, fallbackDrawAt]
      .map((dateValue) => new Date(dateValue).getTime())
      .filter((timeValue) => !Number.isNaN(timeValue))

    if (drawTimes.length === 0) {
      return ''
    }

    return new Date(Math.max(...drawTimes)).toISOString()
  }

  if (isMissingCardDrawsError(response.error)) {
    return getLastArchiveDrawFallback({ client, userId })
  }

  throw response.error
}

export const getArchiveDrawStatus = async (userId) => {
  const client = requireSupabase()
  const lastDrawAt = await getLastArchiveDrawAt({ client, userId })

  return buildArchiveDrawStatus({ lastDrawAt })
}

const getRandomCard = (cards) =>
  cards[Math.floor(Math.random() * cards.length)]

const chooseArchiveDrawCard = (cards) => {
  if (cards.length === 0) {
    return null
  }

  const characterCards = cards.filter(isCharacterFragmentCard)
  const regularCards = cards.filter((card) => !isCharacterFragmentCard(card))
  const shouldDrawCharacter = Math.random() < 0.15
  const primaryPool = shouldDrawCharacter ? characterCards : regularCards
  const fallbackPool = shouldDrawCharacter ? regularCards : characterCards
  const drawPool = primaryPool.length > 0 ? primaryPool : fallbackPool

  return getRandomCard(drawPool)
}

const unlockArchiveDrawCard = async ({ card, client, userId }) => {
  const unlockPayload = {
    user_id: userId,
    collectible_card_id: card.id,
    unlock_month: getCurrentUnlockMonth(),
    unlock_type: archiveDrawUnlockType,
  }
  let response = await client
    .from('user_collectible_cards')
    .insert(unlockPayload)
    .select('unlocked_at')
    .single()

  if (response.error && isMissingColumnError(response.error)) {
    response = await client
      .from('user_collectible_cards')
      .insert({
        user_id: userId,
        collectible_card_id: card.id,
      })
      .select('unlocked_at')
      .single()
  }

  if (response.error?.code === '23505') {
    return { duplicate: true, unlockedAt: '' }
  }

  if (response.error) {
    throw response.error
  }

  return {
    duplicate: false,
    unlockedAt: response.data?.unlocked_at || new Date().toISOString(),
  }
}

const recordArchiveDraw = async ({ card, client, drawnAt, userId }) => {
  const { error } = await client.from('card_draws').insert({
    user_id: userId,
    collectible_card_id: card.id,
    drawn_at: drawnAt,
    draw_type: getArchiveDrawTypeForCard(card),
  })

  if (error && isMissingCardDrawsError(error)) {
    return false
  }

  if (error) {
    throw error
  }

  return true
}

export const drawArchiveCard = async ({ userId }) => {
  const client = requireSupabase()
  const drawStatus = await getArchiveDrawStatus(userId)

  if (!drawStatus.canDraw) {
    return {
      drawStatus,
      status: 'cooldown',
    }
  }

  const allCards = await getUserCollectibleCards(userId)

  if (allCards.length > 0 && allCards.every((card) => card.unlocked)) {
    return {
      drawStatus,
      status: 'complete',
    }
  }

  let cards = await getEligibleDrawCards(userId)
  let card = chooseArchiveDrawCard(cards)

  if (!card) {
    return {
      drawStatus,
      status: 'no_eligible',
    }
  }

  let unlockResult = await unlockArchiveDrawCard({ card, client, userId })

  if (unlockResult.duplicate) {
    cards = await getEligibleDrawCards(userId)
    card = chooseArchiveDrawCard(cards)

    if (!card) {
      return {
        drawStatus,
        status: 'no_eligible',
      }
    }

    unlockResult = await unlockArchiveDrawCard({ card, client, userId })
  }

  if (unlockResult.duplicate) {
    return {
      drawStatus,
      status: 'complete',
    }
  }

  const drawnAt = new Date().toISOString()
  await recordArchiveDraw({ card, client, drawnAt, userId })

  return {
    card: normalizeCollectibleCard({
      ...card,
      unlock_type: archiveDrawUnlockType,
      unlocked_at: unlockResult.unlockedAt || drawnAt,
    }),
    drawStatus: buildArchiveDrawStatus({ lastDrawAt: drawnAt }),
    drawType: getArchiveDrawTypeForCard(card),
    status: 'unlocked',
  }
}

export const unlockMonthlyPremiumCard = async ({ card, userId }) => {
  if (!isMonthlyPremiumCard(card)) {
    throw new Error('Choose a monthly premium character card.')
  }

  const client = requireSupabase()
  const month = getCurrentUnlockMonth()
  const cards = await getUserCollectibleCards(userId)
  const currentMonthUnlock = getMonthlyPremiumUnlockForMonth({ cards, month })

  if (currentMonthUnlock && currentMonthUnlock.id !== card.id) {
    return {
      card: currentMonthUnlock,
      month,
      status: 'already_chosen',
    }
  }

  if (currentMonthUnlock?.id === card.id || card.unlocked) {
    return {
      card,
      month,
      status: 'already_unlocked',
    }
  }

  const insertPayload = {
    user_id: userId,
    collectible_card_id: card.id,
    unlock_month: month,
    unlock_type: monthlyPremiumCardType,
  }
  let insertResponse = await client.from('user_collectible_cards').insert(insertPayload)

  if (insertResponse.error && isMissingColumnError(insertResponse.error)) {
    insertResponse = await client.from('user_collectible_cards').insert({
      user_id: userId,
      collectible_card_id: card.id,
    })
  }

  if (insertResponse.error && insertResponse.error.code !== '23505') {
    throw insertResponse.error
  }

  return {
    card,
    month,
    status: 'unlocked',
  }
}

export const unlockCollectibleCards = async ({ userId, cards }) => {
  if (cards.length === 0) {
    return []
  }

  const client = requireSupabase()
  const { data: existingRows, error: existingError } = await client
    .from('user_collectible_cards')
    .select('collectible_card_id')
    .eq('user_id', userId)

  if (existingError) {
    throw existingError
  }

  const existingIds = new Set(
    (existingRows || []).map((row) => row.collectible_card_id),
  )
  const cardsToUnlock = cards.filter((card) => !existingIds.has(card.id))

  if (cardsToUnlock.length === 0) {
    return []
  }

  const { error } = await client.from('user_collectible_cards').insert(
    cardsToUnlock.map((card) => ({
      user_id: userId,
      collectible_card_id: card.id,
    })),
  )

  if (error) {
    throw error
  }

  return cardsToUnlock
}

export const getAdminCollectibleCards = async () => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('collectible_cards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map(normalizeCollectibleCard)
}

export const createCollectibleCard = async (card) => {
  const client = requireSupabase()
  let response = await client
    .from('collectible_cards')
    .insert(card)
    .select()
    .single()

  if (response.error && hasThumbnailField(card) && isMissingColumnError(response.error)) {
    response = await client
      .from('collectible_cards')
      .insert(withoutThumbnailUrl(card))
      .select()
      .single()
  }

  if (response.error) {
    throw response.error
  }

  return normalizeCollectibleCard(response.data)
}

export const updateCollectibleCard = async ({ cardId, updates }) => {
  const client = requireSupabase()
  let response = await client
    .from('collectible_cards')
    .update(updates)
    .eq('id', cardId)
    .select()
    .single()

  if (
    response.error &&
    hasThumbnailField(updates) &&
    isMissingColumnError(response.error)
  ) {
    response = await client
      .from('collectible_cards')
      .update(withoutThumbnailUrl(updates))
      .eq('id', cardId)
      .select()
      .single()
  }

  if (response.error) {
    throw response.error
  }

  return normalizeCollectibleCard(response.data)
}

export const deleteCollectibleCard = async (cardId) => {
  const client = requireSupabase()
  const { error } = await client
    .from('collectible_cards')
    .delete()
    .eq('id', cardId)

  if (error) {
    throw error
  }
}

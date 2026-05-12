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

const monthlyPremiumCardType = 'monthly_premium'

const isMissingColumnError = (error) =>
  error?.code === '42703' ||
  error?.message?.toLowerCase().includes('column') ||
  error?.message?.toLowerCase().includes('schema cache')

const isDirectImageUrl = (imageValue) =>
  /^https?:\/\//i.test(imageValue) ||
  imageValue.startsWith('/') ||
  imageValue.startsWith('data:image/') ||
  imageValue.startsWith('blob:')

export const getCollectibleImageUrl = (card) => {
  const imageValue = imageFieldNames
    .map((fieldName) => card?.[fieldName])
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim()

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

export const normalizeCollectibleCard = (card) => ({
  ...card,
  card_type: card.card_type || 'normal_reward',
  character_id: card.character_id || '',
  image_url: getCollectibleImageUrl(card),
  story_fragment: card.story_fragment || '',
  unlock_month: card.unlock_month || '',
  unlock_type: card.unlock_type || '',
  unlocked: Boolean(card.unlocked_at),
})

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
  const { data, error } = await client
    .from('collectible_cards')
    .insert(card)
    .select()
    .single()

  if (error) {
    throw error
  }

  return normalizeCollectibleCard(data)
}

export const updateCollectibleCard = async ({ cardId, updates }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('collectible_cards')
    .update(updates)
    .eq('id', cardId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return normalizeCollectibleCard(data)
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

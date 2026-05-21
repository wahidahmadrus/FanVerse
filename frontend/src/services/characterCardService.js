import {
  getCollectibleImageUrl,
  getCollectibleThumbnailUrl,
} from './collectibleService.js'

const characterCardTypes = ['character_story', 'monthly_premium']

const uniqueStrings = (values) => [...new Set(values.filter(Boolean))]

const getCardImageUrl = (card, useThumbnail) =>
  useThumbnail ? getCollectibleThumbnailUrl(card) : getCollectibleImageUrl(card)

export const getLinkedCharacterCard = ({
  cards = [],
  characterId,
  useThumbnail = true,
}) => {
  const linkedCards = cards.filter((card) => card.character_id === characterId)

  return (
    linkedCards.find(
      (card) =>
        card.card_type === 'monthly_premium' && getCardImageUrl(card, useThumbnail),
    ) ||
    linkedCards.find(
      (card) =>
        characterCardTypes.includes(card.card_type) &&
        getCardImageUrl(card, useThumbnail),
    ) ||
    linkedCards.find((card) => getCardImageUrl(card, useThumbnail)) ||
    linkedCards[0] ||
    null
  )
}

export const getCharacterCardImageSources = ({
  cards = [],
  character,
  useThumbnail = true,
}) => {
  if (!character) {
    return []
  }

  const linkedCard = getLinkedCharacterCard({
    cards,
    characterId: character.id,
    useThumbnail,
  })
  const linkedImageUrl = linkedCard
    ? getCardImageUrl(linkedCard, useThumbnail)
    : ''

  return uniqueStrings([
    linkedImageUrl,
    character.cardImageUrl,
    character.imageUrl,
  ])
}

export const getCharacterCardImageUrl = ({
  cards = [],
  character,
  useThumbnail = true,
}) => getCharacterCardImageSources({ cards, character, useThumbnail })[0] || ''

import { useState } from 'react'
import ShareButton from '../ShareButton/ShareButton.jsx'
import { getArchiveCharacterById } from '../../data/archiveCharacters.js'
import {
  getCollectibleCardTypeLabel,
  getCollectibleImageUrl,
  getCollectibleThumbnailUrl,
  isCharacterFragmentCard,
} from '../../services/collectibleService.js'
import { getLockedCardProgressText } from '../../services/cardEligibilityService.js'
import './CollectibleCard.css'

const cardBackUrl = '/images/card-back.png'

function CollectibleCard({
  card,
  character: providedCharacter,
  username = 'A FanVerse fan',
  userStats = {},
}) {
  const isUnlocked = Boolean(card.unlocked)
  const character = providedCharacter || getArchiveCharacterById(card.character_id)
  const imageSources = isUnlocked
    ? [...new Set([
        getCollectibleThumbnailUrl(card),
        getCollectibleImageUrl(card),
        character?.cardImageUrl,
        character?.imageUrl,
      ].filter(Boolean))]
    : []
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const [loadedImageUrl, setLoadedImageUrl] = useState('')
  const [cardBackFailed, setCardBackFailed] = useState(false)
  const cardImage = imageSources.find(
    (imageSource) => !failedImageUrls.includes(imageSource),
  )
  const cardTypeLabel = getCollectibleCardTypeLabel(card)
  const progressText = getLockedCardProgressText(card, userStats)
  const shareImageUrl = isUnlocked ? getCollectibleImageUrl(card) || cardImage : ''
  const showStoryFragment =
    isUnlocked && card.story_fragment && !isCharacterFragmentCard(card)
  const shouldShowImage = isUnlocked && Boolean(cardImage)
  const imageLoaded = loadedImageUrl === cardImage

  return (
    <article
      className={`collectible-card collectible-card--${card.rarity
        .toLowerCase()
        .replaceAll(' ', '-')} ${
        isUnlocked ? 'collectible-card--unlocked' : 'collectible-card--locked'
      }`}
    >
      <div
        className={`collectible-card__image-wrap ${
          shouldShowImage || !isUnlocked
            ? 'collectible-card__image-wrap--image'
            : 'collectible-card__image-wrap--placeholder'
        } ${
          shouldShowImage && !imageLoaded
            ? 'collectible-card__image-wrap--loading'
            : ''
        }`}
      >
        {!isUnlocked ? (
          !cardBackFailed ? (
            <img
              alt="Mystery Archive Card"
              className="collectible-card__image collectible-card__image--back"
              decoding="async"
              loading="lazy"
              onError={() => setCardBackFailed(true)}
              src={cardBackUrl}
            />
          ) : (
            <div className="collectible-card__placeholder collectible-card__placeholder--back">
              <span>Mystery Archive Card</span>
            </div>
          )
        ) : shouldShowImage ? (
          <img
            alt={`${card.title} collectible card`}
            className="collectible-card__image"
            decoding="async"
            loading="lazy"
            onError={() =>
              setFailedImageUrls((currentUrls) => [
                ...new Set([...currentUrls, cardImage]),
              ])
            }
            onLoad={() => setLoadedImageUrl(cardImage)}
            src={cardImage}
          />
        ) : (
          <div className="collectible-card__placeholder">
            <span>{card.rarity}</span>
          </div>
        )}
      </div>
      <div className="collectible-card__body">
        <div className="collectible-card__meta">
          <span>{card.rarity}</span>
          {isUnlocked && <span>{cardTypeLabel}</span>}
          <span>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
          {isUnlocked && character && <span>{character.name}</span>}
        </div>
        <h3>{isUnlocked ? card.title : 'Mystery Archive Card'}</h3>
        <p>{isUnlocked ? card.description : progressText}</p>
        {showStoryFragment && (
          <p className="collectible-card__story">{card.story_fragment}</p>
        )}
        {isUnlocked && (
          <div className="collectible-card__share-actions">
            <ShareButton
              fileName={`${card.title}.png`}
              imageUrl={shareImageUrl}
              mode="image"
              text={`${username} unlocked '${card.title}' on FanVerse Archive.`}
              title={card.title}
            >
              Share Card
            </ShareButton>
            {shareImageUrl && (
              <a
                className="collectible-card__download"
                download={`${card.title}.png`}
                href={shareImageUrl}
              >
                Download Image
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default CollectibleCard

import { useState } from 'react'
import Button from '../Button/Button.jsx'
import ShareButton from '../ShareButton/ShareButton.jsx'
import { createCharacterShareText } from '../../data/archiveCharacters.js'
import './CharacterCard.css'

const cardBackUrl = '/images/card-back.png'

function CharacterCard({
  actionLabel = 'View Story',
  actionTo,
  character,
  compact = false,
  disabled = false,
  isSelected = false,
  isUnlocked = false,
  imageUrl = '',
  onAction,
  showQuote = true,
  showShare = false,
  shareLabel = 'Share Card',
  statusLabel = '',
}) {
  const imageSources = isUnlocked
    ? [imageUrl, character.cardImageUrl, character.imageUrl].filter(Boolean)
    : []
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const [cardBackFailed, setCardBackFailed] = useState(false)
  const [loadedImageUrl, setLoadedImageUrl] = useState('')
  const displayImage = imageSources.find(
    (imageSource) => !failedImageUrls.includes(imageSource),
  )
  const imageLoaded = loadedImageUrl === displayImage
  const cardClassName = [
    'character-card',
    `character-card--${character.id}`,
    compact ? 'character-card--compact' : '',
    isSelected ? 'character-card--selected' : '',
    isUnlocked ? 'character-card--unlocked' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={cardClassName}>
      <div
        className={`character-card__portrait ${
          !isUnlocked
            ? 'character-card__portrait--back'
            : displayImage
            ? 'character-card__portrait--image'
            : 'character-card__portrait--placeholder'
        } ${
          isUnlocked && displayImage && !imageLoaded
            ? 'character-card__portrait--loading'
            : ''
        }`}
      >
        {!isUnlocked ? (
          !cardBackFailed ? (
            <img
              alt="Mystery Archive Card"
              decoding="async"
              loading="lazy"
              onError={() => setCardBackFailed(true)}
              src={cardBackUrl}
            />
          ) : (
            <span>Mystery Archive Card</span>
          )
        ) : displayImage ? (
          <img
            alt={`${character.name} collectible card`}
            decoding="async"
            loading="lazy"
            onError={() =>
              setFailedImageUrls((currentUrls) => [
                ...new Set([...currentUrls, displayImage]),
              ])
            }
            onLoad={() => setLoadedImageUrl(displayImage)}
            src={displayImage}
          />
        ) : (
          <span>{character.name}</span>
        )}
      </div>

      <div className="character-card__body">
        <div className="character-card__topline">
          <span>{character.rarityType}</span>
          {statusLabel ? <span>{statusLabel}</span> : isUnlocked && <span>Unlocked</span>}
        </div>
        <h3>{character.name}</h3>
        <strong>{character.fullTitle}</strong>
        <p>{character.shortDescription}</p>
        {showQuote && <blockquote>{character.quote}</blockquote>}
        <small>{character.emotionalMeaning}</small>

        <div className="character-card__actions">
          {actionTo ? (
            <Button to={actionTo} variant={isSelected ? 'primary' : 'secondary'}>
              {actionLabel}
            </Button>
          ) : (
            <Button
              disabled={disabled}
              onClick={() => onAction?.(character)}
              type="button"
              variant={isSelected ? 'primary' : 'secondary'}
            >
              {actionLabel}
            </Button>
          )}
          {showShare && (
            <ShareButton
              fileName={`${character.name}.png`}
              imageUrl={displayImage}
              mode={displayImage ? 'image' : 'text'}
              text={createCharacterShareText(character)}
              title={`${character.name} - ${character.fullTitle}`}
            >
              {shareLabel}
            </ShareButton>
          )}
        </div>
      </div>
    </article>
  )
}

export default CharacterCard

import { useState } from 'react'
import Button from '../Button/Button.jsx'
import ShareButton from '../ShareButton/ShareButton.jsx'
import { createCharacterShareText } from '../../data/archiveCharacters.js'
import './CharacterCard.css'

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
  const imageSources = [imageUrl, character.cardImageUrl, character.imageUrl].filter(Boolean)
  const [failedImageUrls, setFailedImageUrls] = useState([])
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
          displayImage
            ? 'character-card__portrait--image'
            : 'character-card__portrait--placeholder'
        } ${
          displayImage && !imageLoaded ? 'character-card__portrait--loading' : ''
        }`}
      >
        {displayImage ? (
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

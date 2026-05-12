import { useState } from 'react'
import ShareButton from '../ShareButton/ShareButton.jsx'
import { getArchiveCharacterById } from '../../data/archiveCharacters.js'
import { getCollectibleImageUrl } from '../../services/collectibleService.js'
import './CollectibleCard.css'

function CollectibleCard({ card, username = 'A FanVerse fan' }) {
  const character = getArchiveCharacterById(card.character_id)
  const imageSources = [
    getCollectibleImageUrl(card),
    character?.cardImageUrl,
    character?.imageUrl,
  ].filter(Boolean)
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const cardImage = imageSources.find(
    (imageSource) => !failedImageUrls.includes(imageSource),
  )
  const cardTypeLabel = (card.card_type || 'normal_reward').replaceAll('_', ' ')
  const shouldShowImage = Boolean(cardImage)

  return (
    <article
      className={`collectible-card collectible-card--${card.rarity
        .toLowerCase()
        .replaceAll(' ', '-')} ${
        card.unlocked ? 'collectible-card--unlocked' : 'collectible-card--locked'
      }`}
    >
      <div
        className={`collectible-card__image-wrap ${
          shouldShowImage
            ? 'collectible-card__image-wrap--image'
            : 'collectible-card__image-wrap--placeholder'
        }`}
      >
        {shouldShowImage ? (
          <img
            alt={`${card.title} collectible card`}
            className="collectible-card__image"
            onError={() =>
              setFailedImageUrls((currentUrls) => [...currentUrls, cardImage])
            }
            src={cardImage}
          />
        ) : (
          <div className="collectible-card__placeholder">
            <span>{character?.name || card.rarity}</span>
          </div>
        )}
      </div>
      <div className="collectible-card__body">
        <div className="collectible-card__meta">
          <span>{card.rarity}</span>
          <span>{cardTypeLabel}</span>
          <span>{card.unlocked ? 'Unlocked' : 'Locked'}</span>
          {character && <span>{character.name}</span>}
        </div>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        {card.story_fragment && (
          <p className="collectible-card__story">{card.story_fragment}</p>
        )}
        {!card.unlocked && (
          <small>
            Condition: {card.unlock_condition_type.replaceAll('_', ' ')} x
            {card.unlock_condition_value}
          </small>
        )}
        {card.unlocked && (
          <ShareButton
            text={`${username} unlocked '${card.title}' on FanVerse Archive.`}
            title={card.title}
          >
            Share Card
          </ShareButton>
        )}
      </div>
    </article>
  )
}

export default CollectibleCard

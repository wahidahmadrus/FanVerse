import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import ShareButton from '../../components/ShareButton/ShareButton.jsx'
import StoryFragmentCard from '../../components/StoryFragmentCard/StoryFragmentCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import {
  createCharacterShareText,
  getCharacterFragments,
  getArchiveCharacterById,
} from '../../data/archiveCharacters.js'
import {
  getCharacterCardImageSources,
  getFirstArchiveCharacterId,
} from '../../services/characterCardService.js'
import { getUserCollectibleCards } from '../../services/collectibleService.js'
import { getActiveCharacterStoryFragments } from '../../services/storyFragmentService.js'
import './CharacterStoryPage.css'

function CharacterStoryPage() {
  const { characterId } = useParams()
  const { profile, user } = useAuth()
  const [characterCards, setCharacterCards] = useState([])
  const [storyFragments, setStoryFragments] = useState([])
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const character = getArchiveCharacterById(characterId)
  const firstCharacterId = getFirstArchiveCharacterId({ profile, userId: user?.id })
  const isFirstCard = firstCharacterId === character?.id
  const imageSources = useMemo(
    () =>
      getCharacterCardImageSources({
        cards: characterCards,
        character,
        useThumbnail: false,
      }),
    [character, characterCards],
  )
  const characterImageUrl = imageSources.find(
    (imageSource) => !failedImageUrls.includes(imageSource),
  )
  const hasPremiumFragment = characterCards.some(
    (card) =>
      card.character_id === character?.id &&
      card.unlocked &&
      ['character_story', 'monthly_premium'].includes(card.card_type),
  )
  const fragments = useMemo(
    () =>
      getCharacterFragments({
        character,
        firstCharacterId: firstCharacterId,
        fragments: storyFragments,
        hasPremiumFragment,
      }),
    [character, firstCharacterId, hasPremiumFragment, storyFragments],
  )

  useEffect(() => {
    let cancelled = false

    const loadCharacterCards = async () => {
      if (!user?.id) {
        return
      }

      try {
        const [nextCards, nextStoryFragments] = await Promise.all([
          getUserCollectibleCards(user.id),
          getActiveCharacterStoryFragments(),
        ])

        if (!cancelled) {
          setCharacterCards(nextCards)
          setStoryFragments(nextStoryFragments)
        }
      } catch {
        if (!cancelled) {
          setCharacterCards([])
          setStoryFragments([])
        }
      }
    }

    loadCharacterCards()

    return () => {
      cancelled = true
    }
  }, [user])

  if (!character) {
    return (
      <div className="page-shell">
        <EmptyState
          actionLabel="Collectibles"
          actionTo="/collectibles"
          description="This Archive Zero character could not be found."
          title="Story fragment missing"
        />
      </div>
    )
  }

  return (
    <div className={`page-shell character-story-page character-story-page--${character.id}`}>
      <section className="character-story-page__hero glass-panel">
        <div
          className={`character-story-page__portrait ${
            characterImageUrl
              ? 'character-story-page__portrait--image'
              : 'character-story-page__portrait--placeholder'
          }`}
        >
          {characterImageUrl ? (
            <img
              alt={`${character.name} collectible card`}
              decoding="async"
              loading="lazy"
              onError={() =>
                setFailedImageUrls((currentUrls) => [
                  ...currentUrls,
                  characterImageUrl,
                ])
              }
              src={characterImageUrl}
            />
          ) : (
            <span>{character.name}</span>
          )}
        </div>
        <div className="character-story-page__content">
          <p className="section-kicker">Archive Zero Character</p>
          <h1>{character.name}</h1>
          <strong>{character.fullTitle}</strong>
          {isFirstCard && (
            <span className="character-story-page__chosen-label">
              Your chosen Archive card
            </span>
          )}
          <blockquote>{character.quote}</blockquote>
          <p>{character.storyPreview}</p>
          <div className="character-story-page__tags">
            <span>{character.gender}</span>
            <span>{character.role}</span>
            {character.personalityTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="actions">
            <Button to="/collectibles" variant="secondary">
              Back to Collectibles
            </Button>
            <ShareButton
              text={createCharacterShareText(character)}
              title={`${character.name} - ${character.fullTitle}`}
              variant="bright"
            >
              Share Card
            </ShareButton>
          </div>
        </div>
      </section>

      <section className="character-story-page__meaning glass-panel">
        <p className="section-kicker">Emotional Meaning</p>
        <p>{character.emotionalMeaning}</p>
      </section>

      <section className="character-story-page__fragments">
        <div className="section-heading">
          <p className="section-kicker">Story Fragments</p>
          <h2>Fragments from Archive Zero</h2>
          <p>
            The first fragment is open to everyone. Your chosen Archive card
            reveals one more piece of its history.
          </p>
        </div>
        <div className="grid grid--3">
          {fragments.map((fragment) => (
            <StoryFragmentCard
              key={fragment.id}
              locked={!fragment.isUnlocked}
              title={fragment.isUnlocked ? fragment.title : 'Locked Fragment'}
            >
              {fragment.isUnlocked ? fragment.content : fragment.lockedContent}
            </StoryFragmentCard>
          ))}
        </div>
      </section>
    </div>
  )
}

export default CharacterStoryPage

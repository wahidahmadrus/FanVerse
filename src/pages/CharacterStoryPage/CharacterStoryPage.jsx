import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import ShareButton from '../../components/ShareButton/ShareButton.jsx'
import StoryFragmentCard from '../../components/StoryFragmentCard/StoryFragmentCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import {
  createCharacterShareText,
  getCharacterFragments,
} from '../../data/archiveCharacters.js'
import { getCharacterCardImageSources } from '../../services/characterCardService.js'
import { getCharacterById } from '../../services/characterService.js'
import {
  getUserCollectibleCards,
  isCharacterFragmentCard,
} from '../../services/collectibleService.js'
import { getUserMemoryCount } from '../../services/memoryService.js'
import { getActiveCharacterStoryFragments } from '../../services/storyFragmentService.js'
import './CharacterStoryPage.css'

function CharacterStoryPage() {
  const { characterId } = useParams()
  const { user } = useAuth()
  const [character, setCharacter] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [characterCards, setCharacterCards] = useState([])
  const [storyFragments, setStoryFragments] = useState([])
  const [memoryCount, setMemoryCount] = useState(0)
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const hasCharacterCard = characterCards.some(
    (card) =>
      card.character_id === character?.id &&
      card.unlocked &&
      isCharacterFragmentCard(card),
  )
  const imageSources = useMemo(
    () =>
      getCharacterCardImageSources({
        cards: characterCards,
        character: hasCharacterCard
          ? character
          : character
            ? { ...character, cardImageUrl: '', imageUrl: '' }
            : character,
        useThumbnail: false,
      }),
    [character, characterCards, hasCharacterCard],
  )
  const characterImageUrl = imageSources.find(
    (imageSource) => !failedImageUrls.includes(imageSource),
  )
  const fragments = useMemo(
    () =>
      getCharacterFragments({
        character,
        hasCharacterCard,
        fragments: storyFragments,
        memoryCount,
      }),
    [character, hasCharacterCard, memoryCount, storyFragments],
  )

  useEffect(() => {
    let cancelled = false

    const loadCharacterCards = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      try {
        const [
          nextCards,
          nextCharacter,
          nextStoryFragments,
          nextMemoryCount,
        ] = await Promise.all([
          getUserCollectibleCards(user.id),
          getCharacterById(characterId),
          getActiveCharacterStoryFragments(),
          getUserMemoryCount(user.id),
        ])

        if (!cancelled) {
          setCharacterCards(nextCards)
          setCharacter(nextCharacter)
          setStoryFragments(nextStoryFragments)
          setMemoryCount(nextMemoryCount)
          setNotFound(!nextCharacter)
        }
      } catch {
        if (!cancelled) {
          setCharacter(null)
          setCharacterCards([])
          setStoryFragments([])
          setMemoryCount(0)
          setNotFound(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCharacterCards()

    return () => {
      cancelled = true
    }
  }, [characterId, user])

  if (loading) {
    return <LoadingState label="Loading character fragments" />
  }

  if (notFound || !character) {
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
    <div className={`page-shell content-container character-story-page character-story-page--${character.id}`}>
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
          <p className="section-kicker">
            {hasCharacterCard
              ? 'Premium Character Fragment'
              : 'Locked Character Fragment'}
          </p>
          <h1>{character.name}</h1>
          <strong>{character.fullTitle}</strong>
          {hasCharacterCard ? (
            <span className="character-story-page__chosen-label">
              Premium Character Fragment unlocked
            </span>
          ) : (
            <span className="character-story-page__chosen-label">
              Locked
            </span>
          )}
          {hasCharacterCard ? (
            <>
              <blockquote>{character.quote}</blockquote>
              <p>{character.storyPreview}</p>
            </>
          ) : (
            <p>
              This story is sealed until you unlock this character card from
              the Collectibles draw.
            </p>
          )}
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
            {hasCharacterCard && (
              <ShareButton
                text={createCharacterShareText(character)}
                title={`${character.name} - ${character.fullTitle}`}
                variant="bright"
              >
                Share Card
              </ShareButton>
            )}
          </div>
        </div>
      </section>

      {hasCharacterCard && (
        <section className="character-story-page__meaning glass-panel">
          <p className="section-kicker">Emotional Meaning</p>
          <p>{character.emotionalMeaning}</p>
        </section>
      )}

      <section className="character-story-page__fragments">
        <div className="section-heading">
          <p className="section-kicker">Story Fragments</p>
          <h2>Fragments from Archive Zero</h2>
          <p>
            {hasCharacterCard
              ? 'Fragments open one at a time as your memory archive grows.'
              : 'Unlock this Premium Character Fragment card to begin revealing its story.'}
          </p>
        </div>
        <div className="grid grid--3">
          {fragments.map((fragment) => (
            <StoryFragmentCard
              key={fragment.id}
              locked={!fragment.isUnlocked}
              title={
                fragment.isUnlocked
                  ? fragment.title
                  : `Fragment ${fragment.fragmentOrder}`
              }
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

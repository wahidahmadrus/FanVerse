import { useEffect, useMemo, useState } from 'react'
import ArchiveZeroCover from '../../components/ArchiveZeroCover/ArchiveZeroCover.jsx'
import Button from '../../components/Button/Button.jsx'
import CharacterCard from '../../components/CharacterCard/CharacterCard.jsx'
import CollectibleCard from '../../components/CollectibleCard/CollectibleCard.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import ShareButton from '../../components/ShareButton/ShareButton.jsx'
import StoryFragmentCard from '../../components/StoryFragmentCard/StoryFragmentCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import {
  archiveCharacters,
  createCharacterShareText,
  getArchiveCharacterById,
  getCharacterFragments,
} from '../../data/archiveCharacters.js'
import {
  getCharacterCardImageSources,
  getCharacterCardImageUrl,
  getFirstArchiveCharacterId,
} from '../../services/characterCardService.js'
import { getUserCollectibleCards } from '../../services/collectibleService.js'
import { getActiveCharacterStoryFragments } from '../../services/storyFragmentService.js'
import './CollectiblesPage.css'

const rarityFilters = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Monthly Special']
const statusFilters = ['All', 'Unlocked', 'Locked']
const storyCardTypes = ['character_story', 'monthly_premium']

function CharacterHistoryModal({
  cards,
  character,
  firstCharacterId,
  onClose,
  storyFragments,
}) {
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const isChosenCharacter = firstCharacterId === character.id
  const hasPremiumFragment = cards.some(
    (card) =>
      card.character_id === character.id &&
      card.unlocked &&
      ['character_story', 'monthly_premium'].includes(card.card_type),
  )
  const fragments = useMemo(
    () =>
      getCharacterFragments({
        character,
        firstCharacterId,
        fragments: storyFragments,
        hasPremiumFragment,
      }),
    [character, firstCharacterId, hasPremiumFragment, storyFragments],
  )
  const imageSources = useMemo(
    () => getCharacterCardImageSources({ cards, character }),
    [cards, character],
  )
  const characterImageUrl = imageSources.find(
    (imageSource) => !failedImageUrls.includes(imageSource),
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="collectibles-page__history-overlay"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        aria-labelledby={`character-history-${character.id}`}
        aria-modal="true"
        className={`collectibles-page__history-modal collectibles-page__history-modal--${character.id}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          className="collectibles-page__history-close"
          onClick={onClose}
          type="button"
        >
          Close
        </button>

        <div className="collectibles-page__history-hero">
          <div
            className={`collectibles-page__history-image ${
              characterImageUrl
                ? 'collectibles-page__history-image--image'
                : 'collectibles-page__history-image--placeholder'
            }`}
          >
            {characterImageUrl ? (
              <img
                alt={`${character.name} collectible card`}
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

          <div className="collectibles-page__history-copy">
            <p className="section-kicker">Archive Zero Character</p>
            <h2 id={`character-history-${character.id}`}>{character.name}</h2>
            <strong>{character.fullTitle}</strong>
            {isChosenCharacter && (
              <span className="collectibles-page__chosen-label">
                Your chosen Archive card
              </span>
            )}
            <blockquote>{character.quote}</blockquote>
            <p>{character.emotionalMeaning}</p>
            <ShareButton
              text={createCharacterShareText(character)}
              title={`${character.name} - ${character.fullTitle}`}
              variant="bright"
            >
              Share Card
            </ShareButton>
          </div>
        </div>

        <div className="collectibles-page__history-fragments">
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

function CollectiblesPage() {
  const { profile, user } = useAuth()
  const [cards, setCards] = useState([])
  const [storyFragments, setStoryFragments] = useState([])
  const [search, setSearch] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedHistoryCharacter, setSelectedHistoryCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadInitialCards = async () => {
      try {
        const [nextCards, nextStoryFragments] = await Promise.all([
          getUserCollectibleCards(user.id),
          getActiveCharacterStoryFragments(),
        ])

        if (!cancelled) {
          setCards(nextCards)
          setStoryFragments(nextStoryFragments)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialCards()

    return () => {
      cancelled = true
    }
  }, [user])

  const filteredCards = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return cards.filter((card) => {
      const character = getArchiveCharacterById(card.character_id)
      const rarityMatches = selectedRarity === 'All' || card.rarity === selectedRarity
      const statusMatches =
        selectedStatus === 'All' ||
        (selectedStatus === 'Unlocked' ? card.unlocked : !card.unlocked)
      const searchMatches =
        !searchTerm ||
        [
          card.title,
          card.description,
          card.rarity,
          card.unlock_condition_type,
          card.card_type,
          card.story_fragment,
          character?.name,
          character?.fullTitle,
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm)

      return rarityMatches && statusMatches && searchMatches
    })
  }, [cards, search, selectedRarity, selectedStatus])

  const firstArchiveCharacterId = getFirstArchiveCharacterId({
    profile,
    userId: user.id,
  })
  const unlockedCount = cards.filter((card) => card.unlocked).length
  const normalCards = filteredCards.filter(
    (card) => !storyCardTypes.includes(card.card_type),
  )
  const unlockedCards = normalCards.filter((card) => card.unlocked)
  const lockedCards = normalCards.filter((card) => !card.unlocked)
  const hasRewardCards = normalCards.length > 0

  if (loading) {
    return <LoadingState label="Loading collectible cards" />
  }

  return (
    <div className="page-shell collectibles-page">
      <ArchiveZeroCover />

      <section className="collectibles-page__header">
        <div className="section-heading">
          <p className="section-kicker">Collectibles</p>
          <h1>My Collectible Cards</h1>
          <p>
            Visual rewards for memories, proof, stars, and meaningful fandom
            milestones.
          </p>
        </div>
        <div className="collectibles-page__summary glass-panel">
          <strong>{unlockedCount}</strong>
          <span>cards unlocked</span>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="collectibles-page__controls glass-panel" aria-label="Filter collectibles">
        <input
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search collectibles..."
          type="search"
          value={search}
        />
        <div className="collectibles-page__filters">
          {rarityFilters.map((rarity) => (
            <button
              className={
                selectedRarity === rarity
                  ? 'collectibles-page__filter collectibles-page__filter--active'
                  : 'collectibles-page__filter'
              }
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              type="button"
            >
              {rarity}
            </button>
          ))}
        </div>
        <div className="collectibles-page__filters">
          {statusFilters.map((status) => (
            <button
              className={
                selectedStatus === status
                  ? 'collectibles-page__filter collectibles-page__filter--active'
                  : 'collectibles-page__filter'
              }
              key={status}
              onClick={() => setSelectedStatus(status)}
              type="button"
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      <section className="collectibles-page__section collectibles-page__premium-fragments">
        <div className="section-heading">
          <p className="section-kicker">Archive Zero</p>
          <h2>Premium Character Fragments</h2>
          <p>
            Explore the Archive Zero characters, share their cards, and reveal
            their story fragments.
          </p>
        </div>

        {!firstArchiveCharacterId && (
          <div className="collectibles-page__choice-prompt glass-panel">
            <p>
              Choose your first Archive card to unlock a second fragment.
            </p>
            <Button to="/onboarding/first-card">Choose First Card</Button>
          </div>
        )}

        <div className="grid grid--4 collectibles-page__characters">
          {archiveCharacters.map((character) => {
            const isChosenCharacter = firstArchiveCharacterId === character.id

            return (
              <CharacterCard
                actionLabel="Show History"
                character={character}
                compact
                imageUrl={getCharacterCardImageUrl({ cards, character })}
                isSelected={isChosenCharacter}
                isUnlocked={isChosenCharacter}
                key={character.id}
                onAction={() => setSelectedHistoryCharacter(character)}
                showQuote={false}
                showShare
                statusLabel={
                  isChosenCharacter ? 'Your chosen Archive card' : ''
                }
              />
            )
          })}
        </div>
      </section>

      {hasRewardCards ? (
        <>
          {unlockedCards.length > 0 && (
            <section className="collectibles-page__section">
              <div className="section-heading">
                <p className="section-kicker">Unlocked</p>
                <h2>Unlocked Collectibles</h2>
              </div>
              <div className="grid grid--3 collectibles-page__cards">
                {unlockedCards.map((card) => (
                  <CollectibleCard
                    card={card}
                    key={card.id}
                    username={profile?.display_name || 'A FanVerse fan'}
                  />
                ))}
              </div>
            </section>
          )}

          {lockedCards.length > 0 && (
            <section className="collectibles-page__section">
              <div className="section-heading">
                <p className="section-kicker">Locked</p>
                <h2>Locked Collectibles</h2>
              </div>
              <div className="grid grid--3 collectibles-page__cards">
                {lockedCards.map((card) => (
                  <CollectibleCard
                    card={card}
                    key={card.id}
                    username={profile?.display_name || 'A FanVerse fan'}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <EmptyState
          description="Reward cards will appear as you archive memories and unlock milestones."
          title="No reward cards match"
        />
      )}

      {selectedHistoryCharacter && (
        <CharacterHistoryModal
          cards={cards}
          character={selectedHistoryCharacter}
          firstCharacterId={firstArchiveCharacterId}
          onClose={() => setSelectedHistoryCharacter(null)}
          storyFragments={storyFragments}
        />
      )}
    </div>
  )
}

export default CollectiblesPage

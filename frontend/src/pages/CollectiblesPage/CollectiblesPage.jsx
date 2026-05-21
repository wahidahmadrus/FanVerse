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
  createCharacterShareText,
  getCharacterFragments,
} from '../../data/archiveCharacters.js'
import {
  getCharacterCardImageSources,
  getCharacterCardImageUrl,
} from '../../services/characterCardService.js'
import {
  drawArchiveCard,
  getArchiveDrawStatus,
  getCollectibleImageUrl,
  getCollectibleThumbnailUrl,
  getUserCollectibleCards,
  isCharacterFragmentCard,
} from '../../services/collectibleService.js'
import {
  getUserStats,
  isCardConditionMet,
} from '../../services/cardEligibilityService.js'
import { getActiveCharacters } from '../../services/characterService.js'
import { getActiveCharacterStoryFragments } from '../../services/storyFragmentService.js'
import './CollectiblesPage.css'

const rarityFilters = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Monthly Special']
const statusFilters = ['All', 'Unlocked', 'Locked']
const cardBackUrl = '/images/card-back.png'
const noEligibleDrawMessage =
  'No cards are ready to unlock yet. Add more memories to unlock new cards for the draw.'

const getCountdownText = ({ nextDrawAt, now }) => {
  if (!nextDrawAt) {
    return ''
  }

  const remainingMs = Math.max(0, new Date(nextDrawAt).getTime() - now)
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(
    2,
    '0',
  )}m ${String(seconds).padStart(2, '0')}s`
}

const getLinkedCharacterFragmentCard = ({ cards, characterId }) =>
  cards.find(
    (card) =>
      card.character_id === characterId &&
      isCharacterFragmentCard(card) &&
      card.unlocked,
  ) ||
  cards.find(
    (card) =>
      card.character_id === characterId && isCharacterFragmentCard(card),
  ) ||
  null

const getDisplayCharacter = ({ character, isUnlocked }) =>
  isUnlocked
    ? character
    : {
        ...character,
        cardImageUrl: '',
        emotionalMeaning: 'Unlock through archive card draws.',
        fullTitle: 'Premium Character Fragment',
        imageUrl: '',
        quote: '',
        shortDescription:
          'Draw from the Archive to reveal this character fragment.',
      }

function CharacterHistoryModal({
  cards,
  character,
  memoryCount,
  onClose,
  storyFragments,
}) {
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const hasCharacterCard = cards.some(
    (card) =>
      card.character_id === character.id &&
      card.unlocked &&
      isCharacterFragmentCard(card),
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
  const imageSources = useMemo(
    () =>
      getCharacterCardImageSources({
        cards,
        character,
        useThumbnail: false,
      }),
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

          <div className="collectibles-page__history-copy">
            <p className="section-kicker">Premium Character Fragment</p>
            <h2 id={`character-history-${character.id}`}>{character.name}</h2>
            <strong>{character.fullTitle}</strong>
            <blockquote>{character.quote}</blockquote>
            <p>{character.emotionalMeaning}</p>
            <ShareButton
              fileName={`${character.name}.png`}
              imageUrl={characterImageUrl}
              mode={characterImageUrl ? 'image' : 'text'}
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

function CollectiblesPage() {
  const { profile, user } = useAuth()
  const [cards, setCards] = useState([])
  const [characters, setCharacters] = useState([])
  const [drawStatus, setDrawStatus] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [memoryCount, setMemoryCount] = useState(0)
  const [storyFragments, setStoryFragments] = useState([])
  const [search, setSearch] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedHistoryCharacter, setSelectedHistoryCharacter] = useState(null)
  const [revealedCard, setRevealedCard] = useState(null)
  const [revealPhase, setRevealPhase] = useState('')
  const [cardBackFailed, setCardBackFailed] = useState(false)
  const [drawMessage, setDrawMessage] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadInitialCards = async () => {
      try {
        const [
          nextCards,
          nextCharacters,
          nextStoryFragments,
          nextUserStats,
          nextDrawStatus,
        ] = await Promise.all([
          getUserCollectibleCards(user.id),
          getActiveCharacters(),
          getActiveCharacterStoryFragments(),
          getUserStats(user.id),
          getArchiveDrawStatus(user.id),
        ])

        if (!cancelled) {
          setCards(nextCards)
          setCharacters(nextCharacters)
          setStoryFragments(nextStoryFragments)
          setUserStats(nextUserStats)
          setMemoryCount(nextUserStats.totalMemories)
          setDrawStatus(nextDrawStatus)
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

  useEffect(() => {
    const updateNow = () => setNow(Date.now())

    updateNow()
    const intervalId = window.setInterval(updateNow, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const refreshCardsAndDrawStatus = async () => {
    const [nextCards, nextDrawStatus, nextUserStats] = await Promise.all([
      getUserCollectibleCards(user.id),
      getArchiveDrawStatus(user.id),
      getUserStats(user.id),
    ])

    setCards(nextCards)
    setDrawStatus(nextDrawStatus)
    setUserStats(nextUserStats)
    setMemoryCount(nextUserStats.totalMemories)
  }

  const charactersById = useMemo(
    () => new Map(characters.map((character) => [character.id, character])),
    [characters],
  )

  const handleDrawCard = async () => {
    if (!user?.id) {
      return
    }

    try {
      setDrawing(true)
      setDrawMessage('')
      setError('')
      setRevealedCard(null)
      setRevealPhase('back')

      const result = await drawArchiveCard({ userId: user.id })

      if (result.status === 'unlocked') {
        setRevealedCard(result.card)
        setDrawStatus(result.drawStatus)
        window.setTimeout(() => setRevealPhase('revealed'), 720)
      } else if (result.status === 'no_eligible') {
        setRevealPhase('')
        setDrawMessage(noEligibleDrawMessage)
      } else if (result.status === 'complete') {
        setRevealPhase('')
        setDrawMessage('Archive Complete. You have unlocked every available card.')
      } else if (result.status === 'cooldown') {
        setRevealPhase('')
        setDrawStatus(result.drawStatus)
      }

      await refreshCardsAndDrawStatus()
    } catch (drawError) {
      setRevealPhase('')
      setError(drawError.message)
    } finally {
      setDrawing(false)
    }
  }

  const handleViewRevealedCard = () => {
    if (revealedCard && !isCharacterFragmentCard(revealedCard)) {
      setSearch(revealedCard.title)
      setSelectedStatus('Unlocked')
      setSelectedRarity('All')
    }

    setRevealedCard(null)
    setRevealPhase('')
  }

  const filteredCards = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return cards.filter((card) => {
      const character = charactersById.get(card.character_id)
      const rarityMatches = selectedRarity === 'All' || card.rarity === selectedRarity
      const statusMatches =
        selectedStatus === 'All' ||
        (selectedStatus === 'Unlocked' ? card.unlocked : !card.unlocked)
      const searchMatches =
        !searchTerm ||
        (card.unlocked
          ? [
              card.title,
              card.description,
              card.rarity,
              card.unlock_condition_type,
              card.card_type,
              card.story_fragment,
              character?.name,
              character?.fullTitle,
            ]
          : [
              card.rarity,
              card.unlock_condition_type,
              card.card_type,
              isCharacterFragmentCard(card)
                ? 'premium character fragment'
                : 'mystery archive card',
            ])
          .join(' ')
          .toLowerCase()
          .includes(searchTerm)

      return rarityMatches && statusMatches && searchMatches
    })
  }, [cards, charactersById, search, selectedRarity, selectedStatus])

  const safeUserStats = userStats || {
    totalMemories: 0,
    totalStars: 0,
    proofMemories: 0,
    concertMemories: 0,
    fanArtMemories: 0,
    streamingMemories: 0,
    votingMemories: 0,
    supportedArtistCount: 0,
  }
  const unlockedCount = cards.filter((card) => card.unlocked).length
  const allCardsUnlocked = cards.length > 0 && unlockedCount === cards.length
  const eligibleDrawCards = cards.filter(
    (card) =>
      !card.unlocked &&
      (isCharacterFragmentCard(card) || isCardConditionMet(card, safeUserStats)),
  )
  const hasEligibleDrawCards = eligibleDrawCards.length > 0
  const normalCards = filteredCards.filter((card) => !isCharacterFragmentCard(card))
  const unlockedCards = normalCards.filter((card) => card.unlocked)
  const lockedCards = normalCards.filter((card) => !card.unlocked)
  const hasRewardCards = normalCards.length > 0
  const countdownText = getCountdownText({
    nextDrawAt: drawStatus?.nextDrawAt,
    now,
  })
  const cooldownComplete =
    drawStatus?.nextDrawAt &&
    new Date(drawStatus.nextDrawAt).getTime() <= now
  const drawIsReady = Boolean(!drawStatus || drawStatus.canDraw || cooldownComplete)
  const drawButtonLabel = allCardsUnlocked
    ? 'All cards unlocked'
    : drawing
      ? 'Drawing...'
      : drawIsReady
        ? hasEligibleDrawCards
          ? 'Draw Card'
          : 'No cards ready'
        : `Next draw available in ${countdownText}`
  const revealedCharacter = charactersById.get(revealedCard?.character_id)
  const revealedCardImage = revealedCard
    ? getCollectibleThumbnailUrl(revealedCard) ||
      getCollectibleImageUrl(revealedCard) ||
      revealedCharacter?.cardImageUrl ||
      revealedCharacter?.imageUrl ||
      ''
    : ''

  if (loading) {
    return <LoadingState label="Loading collectible cards" />
  }

  return (
    <div className="page-shell wide-container collectibles-page">
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
      <FormMessage type="success">{drawMessage}</FormMessage>

      <section className="collectibles-page__draw glass-panel">
        <div className="collectibles-page__draw-copy">
          <p className="section-kicker">Daily Archive Draw</p>
          <h2>Draw an Archive Card</h2>
          <p>
            Draw a card from the archive. You may receive a regular reward card
            or a rare character fragment.
          </p>
        </div>
        <div className="collectibles-page__draw-action">
          <Button
            disabled={
              drawing || allCardsUnlocked || !hasEligibleDrawCards || !drawIsReady
            }
            onClick={handleDrawCard}
            type="button"
          >
            {drawButtonLabel}
          </Button>
        </div>
      </section>

      {allCardsUnlocked && (
        <section className="collectibles-page__complete glass-panel">
          <div>
            <p className="section-kicker">Archive Complete</p>
            <h2>Archive Complete</h2>
            <p>
              You have unlocked every available card in the archive. New cards
              will appear when the archive expands.
            </p>
          </div>
          <div className="collectibles-page__complete-stats">
            <strong>{unlockedCount}</strong>
            <span>Total cards unlocked</span>
            <ShareButton
              text={`${profile?.display_name || 'A Fan Archive fan'} completed their Fan Archive card collection.`}
              title="Fan Archive Complete"
              variant="bright"
            >
              Share Collection
            </ShareButton>
          </div>
        </section>
      )}

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
            Rare character cards unlock their own story fragments as your
            memory archive grows.
          </p>
        </div>

        <div className="grid grid--4 collectibles-page__characters">
          {characters.map((character) => {
            const linkedCard = getLinkedCharacterFragmentCard({
              cards,
              characterId: character.id,
            })
            const isUnlocked = Boolean(linkedCard?.unlocked)
            const displayCharacter = getDisplayCharacter({
              character,
              isUnlocked,
            })

            return (
              <CharacterCard
                actionLabel={isUnlocked ? 'Show History' : 'Locked'}
                character={displayCharacter}
                compact
                disabled={!isUnlocked}
                imageUrl={
                  isUnlocked ? getCharacterCardImageUrl({ cards, character }) : ''
                }
                isUnlocked={isUnlocked}
                key={character.id}
                onAction={() => {
                  if (isUnlocked) {
                    setSelectedHistoryCharacter(character)
                  }
                }}
                showQuote={false}
                showShare={isUnlocked}
                statusLabel={isUnlocked ? 'Unlocked' : 'Locked'}
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
                    character={charactersById.get(card.character_id)}
                    key={card.id}
                    userStats={safeUserStats}
                    username={profile?.display_name || 'A Fan Archive fan'}
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
                    character={charactersById.get(card.character_id)}
                    key={card.id}
                    userStats={safeUserStats}
                    username={profile?.display_name || 'A Fan Archive fan'}
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
          memoryCount={memoryCount}
          onClose={() => setSelectedHistoryCharacter(null)}
          storyFragments={storyFragments}
        />
      )}

      {revealPhase && (
        <div
          className="collectibles-page__reveal-overlay"
          onMouseDown={() => {
            setRevealedCard(null)
            setRevealPhase('')
          }}
          role="presentation"
        >
          <section
            aria-labelledby="archive-draw-reveal"
            aria-modal="true"
            className="collectibles-page__reveal-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <p className="section-kicker">Archive Draw</p>
            {revealPhase !== 'revealed' || !revealedCard ? (
              <>
                <div className="collectibles-page__draw-card-back">
                  {!cardBackFailed ? (
                    <img
                      alt="Mystery Archive Card"
                      onError={() => setCardBackFailed(true)}
                      src={cardBackUrl}
                    />
                  ) : (
                    <span>Mystery Archive Card</span>
                  )}
                </div>
                <h2 id="archive-draw-reveal">Drawing from the Archive...</h2>
              </>
            ) : (
              <>
                <div className="collectibles-page__reveal-card-image">
                  {revealedCardImage ? (
                    <img
                      alt={`${revealedCard.title} collectible card`}
                      src={revealedCardImage}
                    />
                  ) : (
                    <span>{revealedCard.rarity}</span>
                  )}
                </div>
                <h2 id="archive-draw-reveal">
                  You unlocked: {revealedCard.title}
                </h2>
                <p>{revealedCard.description}</p>
                <div className="collectibles-page__reveal-actions">
                  <Button onClick={handleViewRevealedCard} type="button">
                    View in Collection
                  </Button>
                  {isCharacterFragmentCard(revealedCard) && revealedCharacter && (
                    <Button
                      onClick={() => {
                        setRevealedCard(null)
                        setRevealPhase('')
                        setSelectedHistoryCharacter(revealedCharacter)
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Show History
                    </Button>
                  )}
                </div>
              </>
              )}
          </section>
        </div>
      )}
    </div>
  )
}

export default CollectiblesPage

import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import { activityTypes } from '../../data/memories.js'
import { getPublicMemories } from '../../services/memoryService.js'
import './ExplorePage.css'

const proofFilters = ['All', 'Proof Added', 'Memory Only']
const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Most Stars', value: 'stars' },
]

const getArtistName = (memory) =>
  memory.artistName || memory.artist?.name || 'Unknown fandom'

const getMemoryDescription = (memory) =>
  memory.memory_text || memory.description || memory.content || memory.text || ''

const getNewestTime = (memory) => {
  const createdTime = Date.parse(memory.created_at || '')

  if (!Number.isNaN(createdTime)) {
    return createdTime
  }

  return new Date(`${memory.memory_date || memory.date || '1970-01-01'}T00:00:00`).getTime()
}

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

function MemoryDetailModal({ memory, onClose }) {
  if (!memory) {
    return null
  }

  const artistName = getArtistName(memory)
  const activityType = memory.activity_type || memory.type
  const memoryDate = memory.memory_date || memory.date
  const authorName = memory.authorName || memory.profile?.display_name
  const hasProof = memory.has_proof || memory.hasProof || Boolean(memory.proof_image_url)
  const finalStars = memory.final_stars || memory.finalStars || memory.stars || 0
  const memoryDescription =
    String(getMemoryDescription(memory)).trim() || 'No memory text added.'

  return (
    <div className="explore-page__modal-overlay" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby={`fandom-memory-${memory.id}`}
        aria-modal="true"
        className="explore-page__modal glass-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button className="explore-page__modal-close" onClick={onClose} type="button">
          Close
        </button>
        <div>
          <p className="section-kicker">Fandom Memory</p>
          <h2 id={`fandom-memory-${memory.id}`}>{memory.title}</h2>
          <div className="explore-page__modal-tags">
            <span>{artistName}</span>
            {authorName && <span>By {authorName}</span>}
            {activityType && <span>{activityType}</span>}
            {memoryDate && <span>{formatDate(memoryDate)}</span>}
            {memory.mood && <span>{memory.mood}</span>}
            <strong>{finalStars} stars</strong>
            <span>{hasProof ? 'Proof Added' : 'Memory Only'}</span>
          </div>
        </div>
        <p className="explore-page__modal-text">{memoryDescription}</p>
      </section>
    </div>
  )
}

function ExplorePage() {
  const { profile, user } = useAuth()
  const [memories, setMemories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedProof, setSelectedProof] = useState('All')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadPublicArchive = async () => {
      try {
        setLoading(true)
        setError('')
        const publicRows = await getPublicMemories()

        if (!cancelled) {
          setMemories(publicRows)
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

    loadPublicArchive()

    return () => {
      cancelled = true
    }
  }, [])

  const artistOptions = useMemo(() => {
    const names = new Set()

    memories.forEach((memory) => {
      const artistName = getArtistName(memory)

      if (artistName) {
        names.add(artistName)
      }
    })

    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))]
  }, [memories])

  const filteredMemories = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return memories
      .filter((memory) => {
        const artistName = getArtistName(memory)
        const activityType = memory.activity_type || memory.type
        const hasProof = memory.has_proof || Boolean(memory.proof_image_url)
        const typeMatches = selectedType === 'All' || activityType === selectedType
        const artistMatches = selectedArtist === 'All' || artistName === selectedArtist
        const proofMatches =
          selectedProof === 'All' ||
          (selectedProof === 'Proof Added' ? hasProof : !hasProof)
        const searchMatches =
          !searchTerm ||
          [
            memory.title,
            getMemoryDescription(memory),
            artistName,
            activityType,
            memory.mood,
          ]
            .join(' ')
            .toLowerCase()
            .includes(searchTerm)

        return typeMatches && artistMatches && proofMatches && searchMatches
      })
      .sort((a, b) => {
        if (selectedSort === 'stars') {
          return Number(b.final_stars || b.stars || 0) - Number(a.final_stars || a.stars || 0)
        }

        return getNewestTime(b) - getNewestTime(a)
      })
  }, [memories, search, selectedArtist, selectedProof, selectedSort, selectedType])

  if (loading) {
    return <LoadingState label="Opening Fandom" />
  }

  return (
    <div className="page-shell wide-container explore-page">
      <section className="explore-page__hero">
        <div>
          <p className="section-kicker">Fandom</p>
          <h1>Fandom</h1>
          <p>
            Browse public fan memories from every artist and fandom. Artist/Fandom
            is the context for a memory, not a wall around the archive.
          </p>
          {user && !profile?.main_artist_id && (
            <p className="explore-page__preference-note">
              Add a favorite fandom to personalize your profile, or keep browsing
              memories from all fans.
            </p>
          )}
        </div>
        <div className="actions">
          <Button to={user ? '/add-memory' : '/signup'}>Write a Fan Memory</Button>
          <Button to={user ? '/my-archive' : '/signin'} variant="secondary">
            {user ? 'My Archive' : 'Sign In'}
          </Button>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="explore-page__filters glass-panel" aria-label="Filter public fan memories">
        <label className="explore-page__search-field">
          <span>Search fan memories</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, memory text, fandom, mood, activity..."
            type="search"
            value={search}
          />
        </label>
        <div className="explore-page__filter-grid">
          <label>
            <span>Artist/Fandom</span>
            <select
              onChange={(event) => setSelectedArtist(event.target.value)}
              value={selectedArtist}
            >
              {artistOptions.map((artistName) => (
                <option key={artistName} value={artistName}>
                  {artistName === 'All' ? 'All artists/fandoms' : artistName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Activity type</span>
            <select
              onChange={(event) => setSelectedType(event.target.value)}
              value={selectedType}
            >
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All activity types' : type}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Proof</span>
            <select
              onChange={(event) => setSelectedProof(event.target.value)}
              value={selectedProof}
            >
              {proofFilters.map((proof) => (
                <option key={proof} value={proof}>
                  {proof === 'All' ? 'All proof states' : proof}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              onChange={(event) => setSelectedSort(event.target.value)}
              value={selectedSort}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <p className="section-kicker">Fandom</p>
          <h2>Public memories across all fandoms</h2>
          <p>
            Every public entry belongs to a fan first, with the artist or fandom
            shown as the memory tag.
          </p>
        </div>

        <div className="explore-page__memory-list">
          {filteredMemories.length > 0 ? (
            filteredMemories.map((memory) => (
              <MemoryCard
                actions={
                  <Button onClick={() => setSelectedMemory(memory)} type="button" variant="secondary">
                    Read Memory
                  </Button>
                }
                compact
                key={memory.id}
                memory={memory}
              />
            ))
          ) : memories.length > 0 ? (
            <EmptyState
              description="Try another search, artist/fandom, activity type, or proof filter."
              title="No matching fan memories"
            />
          ) : (
            <EmptyState
              actionLabel="Write a Fan Memory"
              actionTo={user ? '/add-memory' : '/signup'}
              description="Be the first to archive a fan memory."
              title="No public fan memories yet."
            />
          )}
        </div>
      </section>

      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
    </div>
  )
}

export default ExplorePage

import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../../context/useAuth.js'
import { activityTypes } from '../../data/memories.js'
import { deleteMemory, getUserMemories } from '../../services/memoryService.js'
import './MyArchivePage.css'

const visibilityFilters = ['All', 'Public', 'Private']
const proofFilters = ['All', 'Proof Added', 'Memory Only']
const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Highest Stars', value: 'stars' },
]

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

const getDateKey = (memory) => memory.memory_date || memory.date || 'undated'

const getPreview = (text = '') => {
  const normalizedText = text.replace(/\s+/g, ' ').trim()

  if (normalizedText.length <= 170) {
    return normalizedText
  }

  return `${normalizedText.slice(0, 170).trim()}...`
}

function DiaryEntryCard({ deletingId, memory, onDelete, onOpen }) {
  const activityType = memory.activity_type || memory.type || 'Memory'
  const memoryDate = memory.memory_date || memory.date
  const hasProof = memory.has_proof || Boolean(memory.proof_image_url)
  const stars = memory.final_stars || memory.finalStars || memory.stars || 0

  return (
    <article
      className="my-archive-page__entry"
      onClick={() => onOpen(memory)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onOpen(memory)
        }
      }}
      role="button"
      tabIndex="0"
    >
      <div className="my-archive-page__entry-main">
        <div className="my-archive-page__entry-topline">
          <span>{activityType}</span>
          <span>{hasProof ? 'Proof Added' : 'Memory Only'}</span>
          <span>{memory.visibility === 'public' ? 'Public' : 'Private'}</span>
        </div>
        <h3>{memory.title}</h3>
        <p>{getPreview(memory.description)}</p>
      </div>
      <div className="my-archive-page__entry-meta">
        {memoryDate && <span>{formatDate(memoryDate)}</span>}
        <span>{memory.mood}</span>
        <strong>{stars} stars</strong>
      </div>
      <div
        className="my-archive-page__entry-actions"
        onClick={(event) => event.stopPropagation()}
      >
        <Button to={`/memories/${memory.id}/edit`} variant="secondary">
          Edit
        </Button>
        <Button
          disabled={deletingId === memory.id}
          onClick={() => onDelete(memory)}
          type="button"
          variant="ghost"
        >
          {deletingId === memory.id ? 'Removing...' : 'Remove'}
        </Button>
      </div>
    </article>
  )
}

function DiaryDetailModal({ memory, onClose }) {
  if (!memory) {
    return null
  }

  const artistName = memory.artistName || memory.artist?.name || 'Unknown fandom'
  const activityType = memory.activity_type || memory.type || 'Memory'
  const proofImage = memory.proof_image_url || memory.proofImageUrl
  const hasProof = memory.has_proof || Boolean(proofImage)
  const baseStars = memory.base_stars || memory.baseStars || memory.stars || 0
  const finalStars = memory.final_stars || memory.finalStars || memory.stars || 0

  return (
    <div className="my-archive-page__modal-overlay" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby={`diary-entry-${memory.id}`}
        aria-modal="true"
        className="my-archive-page__modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button className="my-archive-page__modal-close" onClick={onClose} type="button">
          Close
        </button>
        <div>
          <p className="section-kicker">Diary Entry</p>
          <h2 id={`diary-entry-${memory.id}`}>{memory.title}</h2>
          <div className="my-archive-page__modal-tags">
            <span>{artistName}</span>
            <span>{activityType}</span>
            <span>{memory.mood}</span>
            <span>{memory.visibility === 'public' ? 'Public' : 'Private'}</span>
            <span>{hasProof ? 'Proof Added' : 'Memory Only'}</span>
          </div>
        </div>
        <p className="my-archive-page__modal-text">{memory.description}</p>
        {proofImage && (
          <img
            alt={`${memory.title} proof`}
            className="my-archive-page__modal-proof"
            src={proofImage}
          />
        )}
        <dl className="my-archive-page__modal-reward">
          <div>
            <dt>Date</dt>
            <dd>{formatDate(memory.memory_date || memory.date)}</dd>
          </div>
          <div>
            <dt>Base reward</dt>
            <dd>{baseStars} stars</dd>
          </div>
          <div>
            <dt>Final reward</dt>
            <dd>{finalStars} stars</dd>
          </div>
        </dl>
        <div className="actions">
          <Button to={`/memories/${memory.id}/edit`} variant="secondary">
            Edit Entry
          </Button>
          <Button onClick={onClose} type="button" variant="ghost">
            Back to Archive
          </Button>
        </div>
      </section>
    </div>
  )
}

function MyArchivePage() {
  const { user } = useAuth()
  const [memories, setMemories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedVisibility, setSelectedVisibility] = useState('All')
  const [selectedProof, setSelectedProof] = useState('All')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [deletingId, setDeletingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadArchiveMemories = async () => {
      try {
        setLoading(true)
        setMemories(await getUserMemories({ userId: user.id }))
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadArchiveMemories()
  }, [user])

  const filteredMemories = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return memories.filter((memory) => {
      const typeMatches =
        selectedType === 'All' || memory.activity_type === selectedType
      const visibilityMatches =
        selectedVisibility === 'All' ||
        memory.visibility === selectedVisibility.toLowerCase()
      const hasProof = memory.has_proof || Boolean(memory.proof_image_url)
      const proofMatches =
        selectedProof === 'All' ||
        (selectedProof === 'Proof Added' ? hasProof : !hasProof)
      const searchMatches =
        !searchTerm ||
        [
          memory.title,
          memory.artistName,
          memory.artist?.name,
          memory.activity_type,
          memory.mood,
          memory.description,
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm)

      return typeMatches && visibilityMatches && proofMatches && searchMatches
    }).sort((a, b) => {
      if (selectedSort === 'stars') {
        return Number(b.final_stars || b.stars || 0) - Number(a.final_stars || a.stars || 0)
      }

      const dateA = new Date(`${a.memory_date || a.date}T00:00:00`).getTime()
      const dateB = new Date(`${b.memory_date || b.date}T00:00:00`).getTime()

      return selectedSort === 'oldest' ? dateA - dateB : dateB - dateA
    })
  }, [memories, search, selectedProof, selectedSort, selectedType, selectedVisibility])

  const groupedMemories = useMemo(() => {
    const groups = new Map()

    filteredMemories.forEach((memory) => {
      const dateKey = getDateKey(memory)
      const existingGroup = groups.get(dateKey) || []
      groups.set(dateKey, [...existingGroup, memory])
    })

    return Array.from(groups.entries()).map(([dateKey, groupMemories]) => ({
      dateKey,
      label: dateKey === 'undated' ? 'Undated Memories' : formatDate(dateKey),
      memories: groupMemories,
    }))
  }, [filteredMemories])

  const handleDeleteMemory = async (memory) => {
    const shouldDelete = window.confirm(
      `Remove "${memory.title}" from your archive? This cannot be undone.`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setError('')
      setMessage('')
      setDeletingId(memory.id)
      await deleteMemory({ memoryId: memory.id, userId: user.id })
      setMemories((currentMemories) =>
        currentMemories.filter((currentMemory) => currentMemory.id !== memory.id),
      )
      if (selectedMemory?.id === memory.id) {
        setSelectedMemory(null)
      }
      setMessage('The memory was removed from your archive.')
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setDeletingId('')
    }
  }

  if (loading) {
    return <LoadingState label="Opening your fan diary" />
  }

  return (
    <div className="page-shell wide-container my-archive-page">
      <section className="my-archive-page__header">
        <div className="section-heading">
          <p className="section-kicker">My Archive</p>
          <h1>Your Fan Diary</h1>
          <p>
            Public entries and private memories live here as your personal fan
            archive.
          </p>
        </div>
        <Button to="/add-memory">Write a Fan Memory</Button>
      </section>

      <FormMessage type="error">{error}</FormMessage>
      <FormMessage type="success">{message}</FormMessage>

      <section className="my-archive-page__filters" aria-label="Filter memories">
        <div className="my-archive-page__search-row">
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, fandom, mood, activity..."
            type="search"
            value={search}
          />
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
        </div>
        <div>
          {activityTypes.map((type) => (
            <button
              className={
                selectedType === type
                  ? 'my-archive-page__filter my-archive-page__filter--active'
                  : 'my-archive-page__filter'
              }
              key={type}
              onClick={() => setSelectedType(type)}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>
        <div>
          {visibilityFilters.map((visibility) => (
            <button
              className={
                selectedVisibility === visibility
                  ? 'my-archive-page__filter my-archive-page__filter--active'
                  : 'my-archive-page__filter'
              }
              key={visibility}
              onClick={() => setSelectedVisibility(visibility)}
              type="button"
            >
              {visibility}
            </button>
          ))}
        </div>
        <div>
          {proofFilters.map((proof) => (
            <button
              className={
                selectedProof === proof
                  ? 'my-archive-page__filter my-archive-page__filter--active'
                  : 'my-archive-page__filter'
              }
              key={proof}
              onClick={() => setSelectedProof(proof)}
              type="button"
            >
              {proof}
            </button>
          ))}
        </div>
      </section>

      {memories.length > 0 ? (
        groupedMemories.length > 0 ? (
          <section className="my-archive-page__diary" aria-label="Diary entries">
            {groupedMemories.map((group) => (
              <div className="my-archive-page__date-group" key={group.dateKey}>
                <h2>{group.label}</h2>
                <div className="my-archive-page__entries">
                  {group.memories.map((memory) => (
                    <DiaryEntryCard
                      deletingId={deletingId}
                      key={memory.id}
                      memory={memory}
                      onDelete={handleDeleteMemory}
                      onOpen={setSelectedMemory}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <EmptyState
            description="No entries match this view yet."
            title="No matching memories"
          />
        )
      ) : (
        <EmptyState
          actionLabel="Write a Fan Memory"
          actionTo="/add-memory"
          description="Start with one concert, stream, fan event, artwork, or personal moment."
          title="Your archive is ready for its first memory"
        />
      )}

      <DiaryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
    </div>
  )
}

export default MyArchivePage

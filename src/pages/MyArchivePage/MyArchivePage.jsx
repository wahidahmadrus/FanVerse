import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import Timeline from '../../components/Timeline/Timeline.jsx'
import { useAuth } from '../../context/useAuth.js'
import { activityTypes } from '../../data/memories.js'
import { deleteMemory, getUserMemories } from '../../services/memoryService.js'
import './MyArchivePage.css'

const visibilityFilters = ['All', 'Public', 'Private']

function MyArchivePage() {
  const { user } = useAuth()
  const [memories, setMemories] = useState([])
  const [selectedType, setSelectedType] = useState('All')
  const [selectedVisibility, setSelectedVisibility] = useState('All')
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
    return memories.filter((memory) => {
      const typeMatches =
        selectedType === 'All' || memory.activity_type === selectedType
      const visibilityMatches =
        selectedVisibility === 'All' ||
        memory.visibility === selectedVisibility.toLowerCase()

      return typeMatches && visibilityMatches
    })
  }, [memories, selectedType, selectedVisibility])

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
      setMessage('The memory was removed from your archive.')
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setDeletingId('')
    }
  }

  if (loading) {
    return <LoadingState label="Opening your personal archive" />
  }

  return (
    <div className="page-shell my-archive-page">
      <section className="my-archive-page__header">
        <div className="section-heading">
          <p className="section-kicker">My Archive</p>
          <h1>Your Memory Timeline</h1>
          <p>
            This is your personal fan archive. Public posts and private memories
            both live here, organized by artist and activity.
          </p>
        </div>
        <Button to="/add-memory">Add Memory</Button>
      </section>

      <FormMessage type="error">{error}</FormMessage>
      <FormMessage type="success">{message}</FormMessage>

      <section className="my-archive-page__filters" aria-label="Filter memories">
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
      </section>

      {memories.length > 0 ? (
        <Timeline
          memories={filteredMemories}
          renderActions={(memory) => (
            <>
              <Button to={`/memories/${memory.id}/edit`} variant="secondary">
                Edit
              </Button>
              <Button
                disabled={deletingId === memory.id}
                onClick={() => handleDeleteMemory(memory)}
                type="button"
                variant="ghost"
              >
                {deletingId === memory.id ? 'Removing...' : 'Remove'}
              </Button>
            </>
          )}
        />
      ) : (
        <EmptyState
          actionLabel="Add Memory"
          actionTo="/add-memory"
          description="Start with one concert, stream, fan event, artwork, or personal moment."
          title="Your archive is ready for its first memory"
        />
      )}
    </div>
  )
}

export default MyArchivePage

import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import {
  becomeFan,
  getArtistById,
  isFanOfArtist,
} from '../../services/artistService.js'
import { getPublicMemories } from '../../services/memoryService.js'
import './ArtistDetailPage.css'

function ArtistDetailPage() {
  const { artistId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [artist, setArtist] = useState(null)
  const [memories, setMemories] = useState([])
  const [isFan, setIsFan] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')

  useEffect(() => {
    const loadArtist = async () => {
      try {
        setLoading(true)
        const [artistRow, publicMemories] = await Promise.all([
          getArtistById(artistId),
          getPublicMemories({ artistId }),
        ])
        setArtist(artistRow)
        setMemories(publicMemories)

        if (user) {
          setIsFan(await isFanOfArtist({ artistId, userId: user.id }))
        }
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadArtist()
  }, [artistId, user])

  const handleBecomeFan = async () => {
    if (!user) {
      navigate('/signin', { state: { from: location } })
      return
    }

    try {
      setJoining(true)
      await becomeFan({ artistId, userId: user.id })
      setIsFan(true)
      setArtist((currentArtist) => ({
        ...currentArtist,
        fanCount: (currentArtist?.fanCount || 0) + 1,
      }))
      setMessage('You are now part of this fan archive. Celebrate at your own pace.')
    } catch (joinError) {
      setError(joinError.message)
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return <LoadingState label="Opening artist archive" />
  }

  if (!artist) {
    return (
      <div className="page-shell">
        <EmptyState
          actionLabel="Explore Artists"
          actionTo="/artists"
          description={error || 'This artist archive could not be found.'}
          title="Artist not found"
        />
      </div>
    )
  }

  return (
    <div className="page-shell content-container artist-detail-page">
      <FormMessage type="success">{message}</FormMessage>
      <FormMessage type="error">{error}</FormMessage>

      <section className="artist-detail-page__hero glass-panel">
        <div className="artist-detail-page__image">
          {artist.image_url ? (
            <img src={artist.image_url} alt="" />
          ) : (
            <span aria-hidden="true">{artist.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="section-kicker">{artist.category}</p>
          <h1>{artist.name}</h1>
          <p>{artist.description}</p>
          <div className="artist-detail-page__stats">
            <span>{artist.fanCount || 0} fans</span>
            <span>{artist.memoryCount || 0} memories</span>
          </div>
          <div className="actions">
            <Button
              disabled={joining || isFan}
              onClick={handleBecomeFan}
              variant={isFan ? 'secondary' : 'primary'}
            >
              {isFan ? 'Fan Archive Joined' : joining ? 'Joining...' : 'Become a Fan'}
            </Button>
            <Button to={`/add-memory?artistId=${artist.id}`} variant="secondary">
              Add Memory
            </Button>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <p className="section-kicker">Public Timeline</p>
          <h2>Memories from fans</h2>
          <p>
            Public memories from this artist community appear here for everyone
            to explore.
          </p>
        </div>

        <div className="artist-detail-page__memories">
          {memories.length > 0 ? (
            memories.map((memory) => <MemoryCard key={memory.id} memory={memory} />)
          ) : (
            <EmptyState
              actionLabel="Add First Memory"
              actionTo={`/add-memory?artistId=${artist.id}`}
              description="No public memories are archived for this artist yet."
              title="A quiet corner of the universe"
            />
          )}
        </div>
      </section>
    </div>
  )
}

export default ArtistDetailPage

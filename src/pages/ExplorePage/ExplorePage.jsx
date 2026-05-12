import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { getArtists } from '../../services/artistService.js'
import { getPublicMemories } from '../../services/memoryService.js'
import './ExplorePage.css'

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

function ArtistListItem({ artist }) {
  return (
    <Link className="explore-page__artist-item" to={`/artists/${artist.id}`}>
      <span className="explore-page__avatar">
        {artist.image_url ? <img src={artist.image_url} alt="" /> : artist.name.slice(0, 2)}
      </span>
      <span>
        <strong>{artist.name}</strong>
        <small>{artist.category}</small>
      </span>
      <em>{artist.fanCount || 0} fans</em>
    </Link>
  )
}

function PublicMemoryItem({ memory }) {
  const activityType = memory.activity_type || memory.type
  const stars = memory.final_stars || memory.stars || 0
  const hasProof = memory.has_proof || Boolean(memory.proof_image_url)

  return (
    <article className="explore-page__memory-item">
      <div>
        <strong>{memory.title}</strong>
        <span>{memory.artistName || memory.artist?.name || 'Unknown artist'}</span>
        <p>{activityType} / {formatDate(memory.memory_date || memory.date)}</p>
      </div>
      <div>
        <em>{stars} stars</em>
        <small>{hasProof ? 'Proof Added' : 'Memory Only'}</small>
      </div>
    </article>
  )
}

function ExplorePage() {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [recentArtists, setRecentArtists] = useState([])
  const [memories, setMemories] = useState([])
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadExplore = async () => {
      try {
        setLoading(true)
        const [artistRows, recentArtistRows, publicMemories] = await Promise.all([
          getArtists(),
          getArtists({ limit: 4 }),
          getPublicMemories({ limit: 5 }),
        ])
        setArtists(artistRows)
        setRecentArtists(recentArtistRows)
        setMemories(publicMemories)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadExplore()
  }, [])

  const filteredArtists = useMemo(() => {
    if (!search.trim()) {
      return artists
    }

    return artists.filter((artist) =>
      artist.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
  }, [artists, search])
  const suggestionArtists = search.trim() ? filteredArtists.slice(0, 6) : []
  const featuredArtists = search.trim() ? filteredArtists.slice(0, 8) : artists.slice(0, 8)

  if (loading) {
    return <LoadingState label="Discovering the fan universe" />
  }

  return (
    <div className="page-shell explore-page">
      <section className="explore-page__hero">
        <div>
          <p className="section-kicker">Explore</p>
          <h1>Discover the shared world of fandom</h1>
          <p>
            Browse artists, public fan memories, and new communities growing one
            archive at a time.
          </p>
        </div>
        <div className="actions">
          <Button to="/artists">Explore Artists</Button>
          <Button to="/create-artist" variant="secondary">
            Create Artist
          </Button>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="explore-page__search glass-panel">
        <label>
          <span>Search artists</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for an artist in the universe..."
            type="search"
            value={search}
          />
        </label>
        {showSuggestions && search.trim() && (
          <div className="explore-page__suggestions">
            {suggestionArtists.length > 0 ? (
              suggestionArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => navigate(`/artists/${artist.id}`)}
                  type="button"
                >
                  <span>{artist.name}</span>
                  <small>{artist.category}</small>
                </button>
              ))
            ) : (
              <div>
                <p>Artist not found. Create this artist?</p>
                <Button to="/create-artist" variant="secondary">
                  Create Artist
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="page-section">
        <div className="section-heading">
          <p className="section-kicker">{search.trim() ? 'Search Results' : 'Featured Artists'}</p>
          <h2>{search.trim() ? 'Artists matching your search' : 'Fan communities lighting up'}</h2>
        </div>

        {featuredArtists.length > 0 ? (
          <div className="explore-page__list">
            {featuredArtists.map((artist) => (
              <ArtistListItem artist={artist} key={artist.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionLabel="Create Artist"
            actionTo="/create-artist"
            description="This artist is not in the universe yet. Create their first fan archive."
            title="No artist found"
          />
        )}
      </section>

      <section className="page-section explore-page__split">
        <div>
          <div className="section-heading">
            <p className="section-kicker">Recent Artists</p>
            <h2>New archives</h2>
          </div>
          <div className="explore-page__mini-list">
            {recentArtists.map((artist) => (
              <ArtistListItem artist={artist} key={artist.id} />
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading">
            <p className="section-kicker">Recent Fan Memories</p>
            <h2>Public posts</h2>
          </div>
          <div className="explore-page__memory-list">
            {memories.length > 0 ? (
              memories.map((memory) => (
                <PublicMemoryItem key={memory.id} memory={memory} />
              ))
            ) : (
              <EmptyState
                actionLabel="Add Memory"
                actionTo="/add-memory"
                description="Public memories will appear here as fans begin archiving their journeys."
                title="No public memories yet"
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ExplorePage

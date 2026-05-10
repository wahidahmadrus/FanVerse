import { useEffect, useMemo, useState } from 'react'
import ArtistCard from '../../components/ArtistCard/ArtistCard.jsx'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import { getArtists } from '../../services/artistService.js'
import { getPublicMemories } from '../../services/memoryService.js'
import './ExplorePage.css'

function ExplorePage() {
  const [artists, setArtists] = useState([])
  const [recentArtists, setRecentArtists] = useState([])
  const [memories, setMemories] = useState([])
  const [search, setSearch] = useState('')
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
            placeholder="Search for an artist in the universe..."
            type="search"
            value={search}
          />
        </label>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <p className="section-kicker">Featured Artists</p>
          <h2>Fan communities lighting up</h2>
        </div>

        {filteredArtists.length > 0 ? (
          <div className="grid grid--3">
            {filteredArtists.map((artist) => (
              <ArtistCard artist={artist} key={artist.id} />
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
              <ArtistCard artist={artist} key={artist.id} />
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
                <MemoryCard compact key={memory.id} memory={memory} />
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

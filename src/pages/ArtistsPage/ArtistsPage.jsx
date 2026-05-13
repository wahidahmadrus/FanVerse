import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ArtistCard from '../../components/ArtistCard/ArtistCard.jsx'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { getArtists } from '../../services/artistService.js'
import './ArtistsPage.css'

function ArtistsPage() {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true)
        setArtists(await getArtists())
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadArtists()
  }, [])

  const filteredArtists = useMemo(() => {
    if (!search.trim()) {
      return artists
    }

    return artists.filter((artist) =>
      artist.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
  }, [artists, search])
  const suggestions = search.trim() ? filteredArtists.slice(0, 6) : []

  if (loading) {
    return <LoadingState label="Loading artists" />
  }

  return (
    <div className="page-shell wide-container artists-page">
      <section className="artists-page__header">
        <div className="section-heading">
          <p className="section-kicker">Artists</p>
          <h1>Artists in the FanVerse</h1>
          <p>
            Browse artists fans are archiving, then join the communities that
            feel meaningful to you.
          </p>
        </div>
        <Button to="/create-artist">Create Artist</Button>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="artists-page__controls">
        <div className="artists-page__search glass-panel">
          <input
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search artists..."
            type="search"
            value={search}
          />
          {showSuggestions && search.trim() && (
            <div className="artists-page__suggestions">
              {suggestions.length > 0 ? (
                suggestions.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => navigate(`/artists/${artist.id}`)}
                    type="button"
                  >
                    <strong>{artist.name}</strong>
                    <span>{artist.category}</span>
                  </button>
                ))
              ) : (
                <div>
                  <p>This artist is not in the universe yet.</p>
                  <Button to="/create-artist" variant="secondary">
                    Create Artist
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {filteredArtists.length > 0 ? (
        <section className="grid grid--3 artists-page__grid">
          {filteredArtists.map((artist) => (
            <ArtistCard artist={artist} key={artist.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          actionLabel="Create Artist"
          actionTo="/create-artist"
          description="This artist is not in the universe yet. Create their first fan archive."
          title="No artist found"
        />
      )}
    </div>
  )
}

export default ArtistsPage

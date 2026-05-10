import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../../context/useAuth.js'
import { memoryActivityTypes, moodOptions } from '../../data/memories.js'
import { becomeFan, getArtists } from '../../services/artistService.js'
import { createMemory } from '../../services/memoryService.js'
import './AddMemoryPage.css'

const getToday = () => new Date().toISOString().slice(0, 10)

const createInitialFormState = (artistId = '') => ({
  title: '',
  artistId,
  activityType: 'Fan Event',
  memoryDate: getToday(),
  mood: 'Excited',
  description: '',
  stars: '10',
  proofImageUrl: '',
  visibility: 'public',
})

function AddMemoryPage() {
  const [searchParams] = useSearchParams()
  const preselectedArtistId = searchParams.get('artistId') || ''
  const { user } = useAuth()
  const [artists, setArtists] = useState([])
  const [artistSearch, setArtistSearch] = useState('')
  const [formData, setFormData] = useState(() =>
    createInitialFormState(preselectedArtistId),
  )
  const [savedMemory, setSavedMemory] = useState(null)
  const [loadingArtists, setLoadingArtists] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoadingArtists(true)
        setArtists(await getArtists())
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoadingArtists(false)
      }
    }

    loadArtists()
  }, [])

  const filteredArtists = useMemo(() => {
    if (!artistSearch.trim()) {
      return artists
    }

    return artists.filter((artist) =>
      artist.name.toLowerCase().includes(artistSearch.trim().toLowerCase()),
    )
  }, [artists, artistSearch])

  const selectedArtist = artists.find((artist) => artist.id === formData.artistId)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSavedMemory(null)

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Add a title and description so this memory has a clear place.')
      return
    }

    if (!formData.artistId) {
      setError('Choose the artist this memory belongs to.')
      return
    }

    try {
      setSaving(true)
      const memory = await createMemory({
        userId: user.id,
        memory: {
          title: formData.title.trim(),
          artistId: formData.artistId,
          activityType: formData.activityType,
          memoryDate: formData.memoryDate,
          mood: formData.mood,
          description: formData.description.trim(),
          stars: Number(formData.stars) || 0,
          proofImageUrl: formData.proofImageUrl.trim(),
          visibility: formData.visibility,
        },
      })

      await becomeFan({ artistId: formData.artistId, userId: user.id })
      setSavedMemory(memory)
      setFormData(createInitialFormState(formData.artistId))
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingArtists) {
    return <LoadingState label="Preparing your memory form" />
  }

  return (
    <div className="page-shell add-memory-page">
      <section className="section-heading">
        <p className="section-kicker">Add Memory</p>
        <h1>Archive a moment from your fan journey</h1>
        <p>
          Save a public post for the artist community or keep a private memory
          in your personal archive.
        </p>
      </section>

      {artists.length === 0 ? (
        <EmptyState
          actionLabel="Create Artist"
          actionTo="/create-artist"
          description="Create an artist archive first, then add your first fan memory."
          title="No artists in the universe yet"
        />
      ) : (
        <section className="add-memory-page__layout">
          <form className="add-memory-page__form glass-panel" onSubmit={handleSubmit}>
            <FormMessage type="error">{error}</FormMessage>

            <label>
              <span>Memory title</span>
              <input
                name="title"
                onChange={handleChange}
                placeholder="Joined a comeback livestream"
                required
                type="text"
                value={formData.title}
              />
            </label>

            <label>
              <span>Find artist</span>
              <input
                onChange={(event) => setArtistSearch(event.target.value)}
                placeholder="Search artists..."
                type="search"
                value={artistSearch}
              />
            </label>

            {artistSearch.trim() && filteredArtists.length === 0 && (
              <FormMessage>
                This artist is not in the universe yet. Create their first fan
                archive.
              </FormMessage>
            )}

            <label>
              <span>Artist</span>
              <select
                name="artistId"
                onChange={handleChange}
                required
                value={formData.artistId}
              >
                <option value="">Choose an artist</option>
                {filteredArtists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="add-memory-page__form-grid">
              <label>
                <span>Activity type</span>
                <select
                  name="activityType"
                  onChange={handleChange}
                  value={formData.activityType}
                >
                  {memoryActivityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date</span>
                <input
                  name="memoryDate"
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.memoryDate}
                />
              </label>
            </div>

            <div className="add-memory-page__form-grid">
              <label>
                <span>Mood</span>
                <select name="mood" onChange={handleChange} value={formData.mood}>
                  {moodOptions.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Stars earned</span>
                <input
                  min="0"
                  name="stars"
                  onChange={handleChange}
                  required
                  type="number"
                  value={formData.stars}
                />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                onChange={handleChange}
                placeholder="Write the moment you want to remember..."
                required
                rows="6"
                value={formData.description}
              ></textarea>
            </label>

            <label>
              <span>Proof image URL optional</span>
              <input
                name="proofImageUrl"
                onChange={handleChange}
                placeholder="https://example.com/memory-photo.jpg"
                type="url"
                value={formData.proofImageUrl}
              />
            </label>

            <fieldset>
              <legend>Visibility</legend>
              <label className="add-memory-page__radio">
                <input
                  checked={formData.visibility === 'public'}
                  name="visibility"
                  onChange={handleChange}
                  type="radio"
                  value="public"
                />
                <span>Public community memory</span>
              </label>
              <label className="add-memory-page__radio">
                <input
                  checked={formData.visibility === 'private'}
                  name="visibility"
                  onChange={handleChange}
                  type="radio"
                  value="private"
                />
                <span>Private personal archive memory</span>
              </label>
            </fieldset>

            <Button disabled={saving} type="submit">
              {saving ? 'Saving...' : 'Save Memory'}
            </Button>
          </form>

          <aside className="add-memory-page__side">
            <div className="add-memory-page__tip glass-panel">
              <span aria-hidden="true"></span>
              <h2>Build your fan universe with care</h2>
              <p>
                Public memories help other fans discover the artist archive.
                Private memories stay in your own timeline.
              </p>
              {selectedArtist && (
                <p className="add-memory-page__selected">
                  Selected artist: <strong>{selectedArtist.name}</strong>
                </p>
              )}
            </div>

            {savedMemory && (
              <div className="add-memory-page__success glass-panel" role="status">
                <p className="section-kicker">Saved</p>
                <h2>{savedMemory.title}</h2>
                <p>Your memory has been added to FanVerse Archive.</p>
                <div className="actions">
                  <Button to="/my-archive">My Archive</Button>
                  <Button to={`/artists/${savedMemory.artist_id}`} variant="secondary">
                    Artist Page
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </section>
      )}
    </div>
  )
}

export default AddMemoryPage

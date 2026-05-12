import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../../context/useAuth.js'
import { memoryActivityTypes, moodOptions } from '../../data/memories.js'
import { becomeFan, getArtists } from '../../services/artistService.js'
import { checkAchievements } from '../../services/achievementService.js'
import { createMemory } from '../../services/memoryService.js'
import { getProofRewardPreview } from '../../services/rewardService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
import AchievementToast from '../../components/AchievementToast/AchievementToast.jsx'
import './AddMemoryPage.css'

const getToday = () => new Date().toISOString().slice(0, 10)

const createInitialFormState = (artistId = '') => ({
  title: '',
  artistId,
  activityType: 'Fan Event',
  memoryDate: getToday(),
  mood: 'Excited',
  description: '',
  proofImageUrl: '',
  visibility: 'public',
})

function AddMemoryPage() {
  const [searchParams] = useSearchParams()
  const preselectedArtistId = searchParams.get('artistId') || ''
  const { user } = useAuth()
  const [artists, setArtists] = useState([])
  const [artistSearch, setArtistSearch] = useState('')
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false)
  const [formData, setFormData] = useState(() =>
    createInitialFormState(preselectedArtistId),
  )
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [savedMemory, setSavedMemory] = useState(null)
  const [achievementResult, setAchievementResult] = useState(null)
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
  const artistSuggestions = artistSearch.trim()
    ? filteredArtists.slice(0, 6)
    : artists.slice(0, 6)
  const rewardPreview = getProofRewardPreview(formData.activityType)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  const handleProofChange = (event) => {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      setProofFile(null)
      setProofPreview('')
      return
    }

    try {
      validateImageFile(file)
      setProofFile(file)
      setProofPreview(URL.createObjectURL(file))
    } catch (fileError) {
      setProofFile(null)
      setProofPreview('')
      setError(fileError.message)
    }
  }

  const handleArtistSearchChange = (event) => {
    setArtistSearch(event.target.value)
    setShowArtistSuggestions(true)
    setFormData((currentData) => ({
      ...currentData,
      artistId: '',
    }))
  }

  const handleSelectArtist = (artist) => {
    setFormData((currentData) => ({
      ...currentData,
      artistId: artist.id,
    }))
    setArtistSearch(artist.name)
    setShowArtistSuggestions(false)
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
      const proofImageUrl = proofFile
        ? await uploadImage({
            bucket: STORAGE_BUCKETS.memoryProofs,
            file: proofFile,
            folder: user.id,
          })
        : ''
      const memory = await createMemory({
        userId: user.id,
        memory: {
          title: formData.title.trim(),
          artistId: formData.artistId,
          activityType: formData.activityType,
          memoryDate: formData.memoryDate,
          mood: formData.mood,
          description: formData.description.trim(),
          proofImageUrl,
          visibility: formData.visibility,
        },
      })

      await becomeFan({ artistId: formData.artistId, userId: user.id })
      const achievements = await checkAchievements({ userId: user.id })
      setSavedMemory(memory)
      setAchievementResult(achievements)
      setProofFile(null)
      setProofPreview('')
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
        <h1>What memory do you want to archive today?</h1>
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
                aria-autocomplete="list"
                aria-expanded={showArtistSuggestions}
                onChange={handleArtistSearchChange}
                onFocus={() => setShowArtistSuggestions(true)}
                placeholder="Search artists..."
                type="search"
                value={artistSearch}
              />
            </label>

            {showArtistSuggestions && (
              <div className="add-memory-page__suggestions" role="listbox">
                {artistSuggestions.length > 0 ? (
                  artistSuggestions.map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() => handleSelectArtist(artist)}
                      type="button"
                    >
                      <span className="add-memory-page__suggestion-avatar">
                        {artist.image_url ? (
                          <img src={artist.image_url} alt="" />
                        ) : (
                          artist.name.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <span>
                        <strong>{artist.name}</strong>
                        <small>{artist.category}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="add-memory-page__no-suggestion">
                    <p>Artist not found. Create this artist?</p>
                    <Button to="/create-artist" variant="secondary">
                      Create Artist
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedArtist && (
              <div className="add-memory-page__selected-artist">
                <span>Selected artist</span>
                <strong>{selectedArtist.name}</strong>
                <button
                  onClick={() => {
                    setFormData((currentData) => ({ ...currentData, artistId: '' }))
                    setArtistSearch('')
                    setShowArtistSuggestions(true)
                  }}
                  type="button"
                >
                  Change
                </button>
              </div>
            )}

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

            <div className="add-memory-page__reward glass-panel">
              <strong>Base reward: {rewardPreview.baseStars} stars</strong>
              <span>If you add proof: {rewardPreview.proofStars} stars</span>
              {proofFile && <p>Proof added. 2x stars activated.</p>}
            </div>

            <label className="add-memory-page__upload">
              <span>Verification Image optional</span>
              <input accept="image/jpeg,image/png,image/webp" onChange={handleProofChange} type="file" />
              <small>
                Add proof to make this memory more authentic and earn 2x stars.
                Optional: upload a ticket, screenshot, event photo, or any proof
                connected to this memory.
              </small>
            </label>

            {proofPreview && (
              <img
                alt="Memory proof preview"
                className="add-memory-page__proof-preview"
                src={proofPreview}
              />
            )}

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
                <span>
                  <strong>Public Memory</strong>
                  <small>Visible on artist pages and public explore.</small>
                </span>
              </label>
              <label className="add-memory-page__radio">
                <input
                  checked={formData.visibility === 'private'}
                  name="visibility"
                  onChange={handleChange}
                  type="radio"
                  value="private"
                />
                <span>
                  <strong>Private Memory</strong>
                  <small>Only visible in your personal archive.</small>
                </span>
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
                <p>
                  Memory archived. You earned {savedMemory.finalStars} stars.
                </p>
                {achievementResult?.newCards?.length > 0 && (
                  <p>
                    You unlocked a new collectible card:{' '}
                    <strong>{achievementResult.newCards[0].title}</strong>.
                  </p>
                )}
                <div className="actions">
                  <Button to="/my-archive">My Archive</Button>
                  <Button to={`/artists/${savedMemory.artist_id}`} variant="secondary">
                    Artist Page
                  </Button>
                </div>
              </div>
            )}
          </aside>
          <AchievementToast
            badges={achievementResult?.newBadges || []}
            cards={achievementResult?.newCards || []}
            onClose={() => setAchievementResult(null)}
          />
        </section>
      )}
    </div>
  )
}

export default AddMemoryPage

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AchievementToast from '../../components/AchievementToast/AchievementToast.jsx'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FandomArtistSelector from '../../components/FandomArtistSelector/FandomArtistSelector.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../../context/useAuth.js'
import { memoryActivityTypes, moodOptions } from '../../data/memories.js'
import { becomeFan, getArtistById, getArtists } from '../../services/artistService.js'
import { checkAchievements } from '../../services/achievementService.js'
import { createMemory } from '../../services/memoryService.js'
import { getProofRewardPreview } from '../../services/rewardService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
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
  visibility: 'private',
})

const getFirstSentenceTitle = (text) => {
  const firstSentence = text.replace(/\s+/g, ' ').split(/[.!?\n]/)[0]?.trim() || ''

  if (firstSentence.length >= 8 && firstSentence.length <= 72) {
    return firstSentence
  }

  return ''
}

const getAutoMemoryTitle = ({ activityType, artistName, description, title }) => {
  if (title.trim()) {
    return title.trim()
  }

  const sentenceTitle = getFirstSentenceTitle(description)

  if (sentenceTitle) {
    return sentenceTitle
  }

  if (artistName && activityType === 'Personal Memory') {
    return `${artistName} Fan Memory`
  }

  return `${activityType} Memory`
}

function AddMemoryPage() {
  const [searchParams] = useSearchParams()
  const preselectedArtistId = searchParams.get('artistId') || ''
  const { profile, user } = useAuth()
  const defaultArtistId = preselectedArtistId || profile?.main_artist_id || ''
  const [artists, setArtists] = useState([])
  const [isChangingArtist, setIsChangingArtist] = useState(false)
  const [formData, setFormData] = useState(() =>
    createInitialFormState(defaultArtistId),
  )
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [savedMemory, setSavedMemory] = useState(null)
  const [achievementResult, setAchievementResult] = useState(null)
  const [loadingArtists, setLoadingArtists] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const missingMainFandom = !profile?.main_artist_id

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

  const activeArtistId = isChangingArtist
    ? formData.artistId
    : formData.artistId || defaultArtistId
  const selectedArtist = artists.find((artist) => artist.id === activeArtistId)
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

  const handleFandomSelected = (artist) => {
    setFormData((currentData) => ({
      ...currentData,
      artistId: artist.id,
    }))
    setArtists((currentArtists) =>
      currentArtists.some((currentArtist) => currentArtist.id === artist.id)
        ? currentArtists.map((currentArtist) =>
            currentArtist.id === artist.id ? artist : currentArtist,
          )
        : [artist, ...currentArtists],
    )
    setIsChangingArtist(false)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSavedMemory(null)

    if (!formData.description.trim()) {
      setError('Write the memory you want to preserve.')
      return
    }

    if (isChangingArtist) {
      setError('Choose or create your fandom before archiving a memory.')
      return
    }

    const artistId = formData.artistId || defaultArtistId

    if (!artistId) {
      setError('Choose or create your fandom before archiving a memory.')
      return
    }

    try {
      setSaving(true)
      let artistForMemory = selectedArtist

      try {
        artistForMemory = await getArtistById(artistId)
      } catch (artistError) {
        console.error('Unable to verify memory artist before insert:', artistError)
        setError('This fandom could not be found. Please choose or create it again.')
        return
      }

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
          title: getAutoMemoryTitle({
            activityType: formData.activityType,
            artistName: artistForMemory?.name,
            description: formData.description,
            title: formData.title,
          }),
          artistId,
          activityType: formData.activityType,
          memoryDate: formData.memoryDate,
          mood: formData.mood,
          description: formData.description.trim(),
          proofImageUrl,
          visibility: formData.visibility,
        },
      })

      await becomeFan({ artistId, userId: user.id })
      const achievements = await checkAchievements({ userId: user.id })
      setSavedMemory(memory)
      setAchievementResult(achievements)
      setProofFile(null)
      setProofPreview('')
      setFormData(createInitialFormState(artistId))
    } catch (submitError) {
      console.error('Unable to archive memory:', submitError)
      if (
        submitError?.code === '23503' ||
        submitError?.message?.includes('memories_artist_id_fkey') ||
        submitError?.message?.toLowerCase().includes('foreign key')
      ) {
        setError(
          'This memory could not be archived because the fandom was not found. Please choose or create your fandom again.',
        )
      } else {
        setError(submitError.message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingArtists) {
    return <LoadingState label="Preparing your fan diary" />
  }

  if (missingMainFandom) {
    return (
      <div className="page-shell form-container add-memory-page">
        <EmptyState
          actionLabel="Complete Profile"
          actionTo="/profile"
          description="Your memory needs a fandom archive. Select or create your fandom before adding memories."
          title="Choose your fandom first"
        />
      </div>
    )
  }

  return (
    <div className="page-shell content-container add-memory-page">
      <section className="section-heading">
        <p className="section-kicker">Fan Diary</p>
        <h1>Write a Fan Memory</h1>
        <p>Preserve what happened, how it felt, and why it mattered.</p>
      </section>

      <section className="add-memory-page__layout">
        <form className="add-memory-page__form glass-panel" onSubmit={handleSubmit}>
          <FormMessage type="error">{error}</FormMessage>

          <label className="add-memory-page__memory-field">
            <span>What do you want to remember?</span>
            <textarea
              name="description"
              onChange={handleChange}
              placeholder="Write the moment you want to remember..."
              required
              rows="10"
              value={formData.description}
            ></textarea>
          </label>

          <label>
            <span>Memory title optional</span>
            <input
              name="title"
              onChange={handleChange}
              placeholder="Leave blank to auto-title this memory"
              type="text"
              value={formData.title}
            />
          </label>

          <div className="add-memory-page__quick-details">
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
          </div>

          <div className="add-memory-page__artist-box">
            <div>
              <span>Artist / Fandom</span>
              <strong>{selectedArtist?.name || 'Choose your fandom'}</strong>
            </div>
            <button
              onClick={() => {
                if (!isChangingArtist) {
                  setFormData((currentData) => ({
                    ...currentData,
                    artistId: '',
                  }))
                }
                setIsChangingArtist((isChanging) => !isChanging)
              }}
              type="button"
            >
              Change
            </button>
          </div>

          {isChangingArtist && (
            <div className="add-memory-page__artist-search">
              <FandomArtistSelector
                onArtistSelected={handleFandomSelected}
                selectedArtist={selectedArtist}
                userId={user.id}
              />
            </div>
          )}

          <div className="add-memory-page__proof-box">
            <div>
              <h2>Want this memory to shine brighter?</h2>
              <p>Add proof and earn 2x stars.</p>
              <p className="add-memory-page__reward-preview">
                Base reward: {rewardPreview.baseStars} stars / With proof:{' '}
                {rewardPreview.proofStars} stars
              </p>
              {proofFile && (
                <strong className="add-memory-page__proof-active">
                  Proof added. 2x stars activated.
                </strong>
              )}
            </div>
            <label className="add-memory-page__upload-button">
              Upload Proof
              <input
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProofChange}
                type="file"
              />
            </label>
          </div>

          {proofPreview && (
            <img
              alt="Memory proof preview"
              className="add-memory-page__proof-preview"
              src={proofPreview}
            />
          )}

          <fieldset className="add-memory-page__visibility">
            <legend>Visibility</legend>
            <label>
              <input
                checked={formData.visibility === 'private'}
                name="visibility"
                onChange={handleChange}
                type="radio"
                value="private"
              />
              <span>Private</span>
            </label>
            <label>
              <input
                checked={formData.visibility === 'public'}
                name="visibility"
                onChange={handleChange}
                type="radio"
                value="public"
              />
              <span>Public</span>
            </label>
          </fieldset>

          <Button disabled={saving} type="submit">
            {saving ? 'Archiving...' : 'Archive Memory'}
          </Button>
        </form>

        <aside className="add-memory-page__side">
          {savedMemory ? (
            <div className="add-memory-page__success glass-panel" role="status">
              <p className="section-kicker">Archived</p>
              <h2>{savedMemory.title}</h2>
              <p>Memory archived. You earned {savedMemory.finalStars} stars.</p>
              {achievementResult?.newCards?.length > 0 && (
                <p>
                  You unlocked a new collectible card:{' '}
                  <strong>{achievementResult.newCards[0].title}</strong>.
                </p>
              )}
              <div className="actions">
                <Button to="/my-archive">View My Archive</Button>
                <Button to="/explore" variant="secondary">
                  Fandom
                </Button>
              </div>
            </div>
          ) : (
            <div className="add-memory-page__tip glass-panel">
              <p className="section-kicker">Your Fan Archive</p>
              <h2>{selectedArtist?.name || 'Your fandom'} diary</h2>
              <p>
                Start with the feeling. Details can stay simple as long as the
                memory is true to you.
              </p>
            </div>
          )}
        </aside>
        <AchievementToast
          badges={achievementResult?.newBadges || []}
          cards={achievementResult?.newCards || []}
          onClose={() => setAchievementResult(null)}
        />
      </section>
    </div>
  )
}

export default AddMemoryPage

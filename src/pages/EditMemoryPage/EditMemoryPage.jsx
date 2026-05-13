import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../../context/useAuth.js'
import { memoryActivityTypes, moodOptions } from '../../data/memories.js'
import { getArtists } from '../../services/artistService.js'
import { getUserMemoryById, updateMemory } from '../../services/memoryService.js'
import { getProofRewardPreview } from '../../services/rewardService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
import './EditMemoryPage.css'

const createFormData = (memory) => ({
  title: memory.title || '',
  artistId: memory.artist_id || '',
  activityType: memory.activity_type || 'Fan Event',
  memoryDate: memory.memory_date || '',
  mood: memory.mood || 'Excited',
  description: memory.description || '',
  proofImageUrl: memory.proof_image_url || '',
  visibility: memory.visibility || 'public',
})

function EditMemoryPage() {
  const { memoryId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [artists, setArtists] = useState([])
  const [formData, setFormData] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadMemory = async () => {
      try {
        setLoading(true)
        const [memory, artistRows] = await Promise.all([
          getUserMemoryById({ memoryId, userId: user.id }),
          getArtists(),
        ])
        setFormData(createFormData(memory))
        setArtists(artistRows)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadMemory()
  }, [memoryId, user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleProofChange = (event) => {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      setProofFile(null)
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Keep a title and description so this memory remains meaningful.')
      return
    }

    if (!formData.artistId) {
      setError('Choose the artist this memory belongs to.')
      return
    }

    try {
      setSaving(true)
      const uploadedProofUrl = proofFile
        ? await uploadImage({
            bucket: STORAGE_BUCKETS.memoryProofs,
            file: proofFile,
            folder: user.id,
          })
        : ''
      await updateMemory({
        memoryId,
        userId: user.id,
        memory: {
          title: formData.title.trim(),
          artistId: formData.artistId,
          activityType: formData.activityType,
          memoryDate: formData.memoryDate,
          mood: formData.mood,
          description: formData.description.trim(),
          proofImageUrl: uploadedProofUrl || formData.proofImageUrl,
          visibility: formData.visibility,
        },
      })
      setProofFile(null)
      setProofPreview('')
      setMessage('Your memory has been updated.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingState label="Opening memory editor" />
  }

  if (!formData) {
    return (
      <div className="page-shell">
        <EmptyState
          actionLabel="My Archive"
          actionTo="/my-archive"
          description={error || 'This memory could not be opened for editing.'}
          title="Memory not found"
        />
      </div>
    )
  }

  const rewardPreview = getProofRewardPreview(formData.activityType)
  const hasProof = Boolean(proofFile || formData.proofImageUrl)

  return (
    <div className="page-shell form-container edit-memory-page">
      <section className="section-heading">
        <p className="section-kicker">Edit Memory</p>
        <h1>Refine an archived moment</h1>
        <p>
          Update the details, visibility, or artist connection while keeping the
          memory part of your journey.
        </p>
      </section>

      <form className="edit-memory-page__form glass-panel" onSubmit={handleSubmit}>
        <FormMessage type="success">{message}</FormMessage>
        <FormMessage type="error">{error}</FormMessage>

        <label>
          <span>Memory title</span>
          <input
            name="title"
            onChange={handleChange}
            required
            type="text"
            value={formData.title}
          />
        </label>

        <label>
          <span>Artist</span>
          <select
            name="artistId"
            onChange={handleChange}
            required
            value={formData.artistId}
          >
            <option value="">Choose an artist</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        </label>

        <div className="edit-memory-page__form-grid">
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
            required
            rows="6"
            value={formData.description}
          ></textarea>
        </label>

        <div className="edit-memory-page__reward glass-panel">
          <strong>
            {hasProof
              ? `Proof reward: ${rewardPreview.proofStars} stars`
              : `Base reward: ${rewardPreview.baseStars} stars`}
          </strong>
          <span>If you add proof: {rewardPreview.proofStars} stars</span>
          {hasProof && <p>Proof added. 2x stars activated.</p>}
        </div>

        <label className="edit-memory-page__upload">
          <span>Verification Image optional</span>
          <input accept="image/jpeg,image/png,image/webp" onChange={handleProofChange} type="file" />
          <small>
            Add proof to make this memory more authentic and earn 2x stars.
            Optional: upload a ticket, screenshot, event photo, or any proof
            connected to this memory.
          </small>
        </label>

        {(proofPreview || formData.proofImageUrl) && (
          <img
            alt="Memory proof preview"
            className="edit-memory-page__proof-preview"
            src={proofPreview || formData.proofImageUrl}
          />
        )}

        <fieldset>
          <legend>Visibility</legend>
          <label className="edit-memory-page__radio">
            <input
              checked={formData.visibility === 'public'}
              name="visibility"
              onChange={handleChange}
              type="radio"
              value="public"
            />
            <span>Public community memory</span>
          </label>
          <label className="edit-memory-page__radio">
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

        <div className="actions">
          <Button disabled={saving} type="submit">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={() => navigate('/my-archive')} type="button" variant="secondary">
            Back to Archive
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditMemoryPage

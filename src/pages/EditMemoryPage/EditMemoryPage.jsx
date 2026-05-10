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
import './EditMemoryPage.css'

const createFormData = (memory) => ({
  title: memory.title || '',
  artistId: memory.artist_id || '',
  activityType: memory.activity_type || 'Fan Event',
  memoryDate: memory.memory_date || '',
  mood: memory.mood || 'Excited',
  description: memory.description || '',
  stars: String(memory.stars || 0),
  proofImageUrl: memory.proof_image_url || '',
  visibility: memory.visibility || 'public',
})

function EditMemoryPage() {
  const { memoryId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [artists, setArtists] = useState([])
  const [formData, setFormData] = useState(null)
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
          stars: Number(formData.stars) || 0,
          proofImageUrl: formData.proofImageUrl.trim(),
          visibility: formData.visibility,
        },
      })
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

  return (
    <div className="page-shell edit-memory-page">
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

        <div className="edit-memory-page__form-grid">
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
            type="url"
            value={formData.proofImageUrl}
          />
        </label>

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

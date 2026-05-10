import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import { useAuth } from '../../context/useAuth.js'
import { createArtist } from '../../services/artistService.js'
import './CreateArtistPage.css'

const initialFormData = {
  name: '',
  category: '',
  description: '',
  imageUrl: '',
}

function CreateArtistPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState(initialFormData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!formData.name.trim() || !formData.category.trim()) {
      setError('Artist name and category help fans find this archive.')
      return
    }

    if (formData.description.trim().length < 12) {
      setError('Add a short description so this archive feels welcoming.')
      return
    }

    try {
      setLoading(true)
      const artist = await createArtist({
        userId: user.id,
        artist: {
          name: formData.name.trim(),
          category: formData.category.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl.trim(),
        },
      })

      navigate(`/artists/${artist.id}`, {
        state: { message: 'You are the first fan to archive this artist.' },
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell create-artist-page">
      <section className="section-heading">
        <p className="section-kicker">Create Artist</p>
        <h1>Start a new fan archive</h1>
        <p>
          If an artist is not in the universe yet, create their first archive
          and become their first fan here.
        </p>
      </section>

      <form className="create-artist-page__form glass-panel" onSubmit={handleSubmit}>
        <FormMessage type="error">{error}</FormMessage>

        <label>
          <span>Artist name</span>
          <input
            name="name"
            onChange={handleChange}
            placeholder="Luna Ray"
            type="text"
            value={formData.name}
          />
        </label>

        <label>
          <span>Category/type</span>
          <input
            name="category"
            onChange={handleChange}
            placeholder="Solo artist, band, actor, creator..."
            type="text"
            value={formData.category}
          />
        </label>

        <label>
          <span>Description</span>
          <textarea
            name="description"
            onChange={handleChange}
            placeholder="Describe the artist and why this archive belongs in the FanVerse."
            rows="6"
            value={formData.description}
          ></textarea>
        </label>

        <label>
          <span>Image URL optional</span>
          <input
            name="imageUrl"
            onChange={handleChange}
            placeholder="https://example.com/artist.jpg"
            type="url"
            value={formData.imageUrl}
          />
        </label>

        <Button disabled={loading} type="submit">
          {loading ? 'Creating...' : 'Create Artist Archive'}
        </Button>
      </form>
    </div>
  )
}

export default CreateArtistPage

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import { createArtist } from '../../services/artistService.js'
import { useAuth } from '../../context/useAuth.js'
import {
  getProfileCompletedValue,
  updateProfile,
  upsertProfile,
} from '../../services/profileService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
import './CreateArtistPage.css'

const initialFormData = {
  name: '',
  category: '',
  description: '',
}

function CreateArtistPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile, user } = useAuth()
  const [formData, setFormData] = useState(initialFormData)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      setImageFile(null)
      setImagePreview('')
      return
    }

    try {
      validateImageFile(file)
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    } catch (fileError) {
      setImageFile(null)
      setImagePreview('')
      setError(fileError.message)
    }
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
      const imageUrl = imageFile
        ? await uploadImage({
            bucket: STORAGE_BUCKETS.artistImages,
            file: imageFile,
            folder: user.id,
          })
        : ''
      const artist = await createArtist({
        userId: user.id,
        artist: {
          name: formData.name.trim(),
          category: formData.category.trim(),
          description: formData.description.trim(),
          imageUrl,
        },
      })
      const displayName =
        profile?.display_name ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Fan Explorer'
      const nextProfile = {
        ...profile,
        display_name: displayName,
        main_artist_id: artist.id,
      }
      const profilePayload = {
        user_id: user.id,
        email: profile?.email || user.email || '',
        display_name: displayName,
        bio: profile?.bio || '',
        favorite_artist: artist.name,
        favorite_fandom_artist: artist.name,
        main_artist_id: artist.id,
        profile_completed: getProfileCompletedValue(nextProfile),
        avatar_url: profile?.avatar_url || null,
      }

      if (profile) {
        await updateProfile(user.id, profilePayload)
      } else {
        await upsertProfile(profilePayload)
      }

      await refreshProfile(user.id)

      navigate(`/artists/${artist.id}`, {
        state: { message: 'You are the first fan archiver for this fandom.' },
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell form-container create-artist-page">
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
            placeholder="Describe the artist and why this archive belongs in Fan Archive."
            rows="6"
            value={formData.description}
          ></textarea>
        </label>

        <label>
          <span>Artist image optional</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            type="file"
          />
        </label>

        {imagePreview && (
          <img
            alt="Artist preview"
            className="create-artist-page__preview"
            src={imagePreview}
          />
        )}

        <Button disabled={loading} type="submit">
          {loading ? 'Uploading...' : 'Create Artist Archive'}
        </Button>
      </form>
    </div>
  )
}

export default CreateArtistPage

import { useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import { useAuth } from '../../context/useAuth.js'
import { updateProfile, upsertProfile } from '../../services/profileService.js'
import './ProfilePage.css'

function ProfilePage() {
  const { profile, refreshProfile, user } = useAuth()
  const [formData, setFormData] = useState(() => ({
    display_name: profile?.display_name || user?.user_metadata?.display_name || '',
    bio: profile?.bio || '',
    favorite_artist: profile?.favorite_artist || '',
    avatar_url: profile?.avatar_url || '',
  }))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!formData.display_name.trim()) {
      setError('Your fan profile needs a display name.')
      return
    }

    try {
      setSaving(true)
      const payload = {
        user_id: user.id,
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        favorite_artist: formData.favorite_artist.trim(),
        avatar_url: formData.avatar_url.trim() || null,
      }

      if (profile) {
        await updateProfile(user.id, payload)
      } else {
        await upsertProfile(payload)
      }

      await refreshProfile(user.id)
      setMessage('Your fan profile has been updated.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-shell profile-page">
      <section className="profile-page__header">
        <div className="section-heading">
          <p className="section-kicker">Profile</p>
          <h1>Your fan identity</h1>
          <p>
            Create a gentle profile around your fandom, favorite artist, and the
            memories you want to preserve.
          </p>
        </div>
      </section>

      <section className="profile-page__layout">
        <form className="profile-page__form glass-panel" onSubmit={handleSubmit}>
          <FormMessage type="success">{message}</FormMessage>
          <FormMessage type="error">{error}</FormMessage>

          <label>
            <span>Display name</span>
            <input
              name="display_name"
              onChange={handleChange}
              placeholder="Fan Explorer"
              type="text"
              value={formData.display_name}
            />
          </label>

          <label>
            <span>Bio</span>
            <textarea
              name="bio"
              onChange={handleChange}
              placeholder="Tell the FanVerse a little about your support journey."
              rows="5"
              value={formData.bio}
            ></textarea>
          </label>

          <label>
            <span>Favorite artist</span>
            <input
              name="favorite_artist"
              onChange={handleChange}
              placeholder="Luna Ray"
              type="text"
              value={formData.favorite_artist}
            />
          </label>

          <label>
            <span>Avatar URL optional</span>
            <input
              name="avatar_url"
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              type="url"
              value={formData.avatar_url}
            />
          </label>

          <Button disabled={saving} type="submit">
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>

        <aside className="profile-page__preview glass-panel">
          <div className="profile-page__avatar">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="" />
            ) : (
              <span>{formData.display_name.slice(0, 2).toUpperCase() || 'FV'}</span>
            )}
          </div>
          <h2>{formData.display_name || 'Fan Explorer'}</h2>
          <p>{formData.bio || 'Archive your journey and celebrate every memory.'}</p>
          <strong>{formData.favorite_artist || 'Favorite artist not set yet'}</strong>
        </aside>
      </section>
    </div>
  )
}

export default ProfilePage

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import { useAuth } from '../../context/useAuth.js'
import { updateProfile, upsertProfile } from '../../services/profileService.js'
import { signOut } from '../../services/authService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
import './ProfilePage.css'

const adminLinks = [
  { label: 'Main Admin Dashboard', to: '/admin' },
  { label: 'Manage Collectible Cards', to: '/admin/collectibles' },
  { label: 'Manage Premium Stories / Character Fragments', to: '/admin/stories' },
  { label: 'Manage Users', to: '/admin/users' },
  { label: 'Manage Memories', to: '/admin/memories' },
  { label: 'Manage Badges', to: '/admin/badges' },
]

function ProfilePage() {
  const navigate = useNavigate()
  const { profile, refreshProfile, user } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.is_admin
  const [formData, setFormData] = useState(() => ({
    display_name: profile?.display_name || user?.user_metadata?.display_name || '',
    bio: profile?.bio || '',
    favorite_artist: profile?.favorite_artist || '',
    avatar_url: profile?.avatar_url || '',
  }))
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      setAvatarFile(null)
      setAvatarPreview('')
      return
    }

    try {
      validateImageFile(file)
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    } catch (fileError) {
      setAvatarFile(null)
      setAvatarPreview('')
      setError(fileError.message)
    }
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
      const avatarUrl = avatarFile
        ? await uploadImage({
            bucket: STORAGE_BUCKETS.avatars,
            file: avatarFile,
            folder: user.id,
          })
        : formData.avatar_url
      const payload = {
        user_id: user.id,
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        favorite_artist: formData.favorite_artist.trim(),
        avatar_url: avatarUrl || null,
      }

      if (profile) {
        await updateProfile(user.id, payload)
      } else {
        await upsertProfile(payload)
      }

      await refreshProfile(user.id)
      setFormData((currentData) => ({
        ...currentData,
        avatar_url: avatarUrl || '',
      }))
      setAvatarFile(null)
      setAvatarPreview('')
      setMessage('Your fan profile has been updated.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
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
        <aside className="profile-page__preview glass-panel">
          <div className="profile-page__avatar">
            {avatarPreview || formData.avatar_url ? (
              <img src={avatarPreview || formData.avatar_url} alt="" />
            ) : (
              <span>{formData.display_name.slice(0, 2).toUpperCase() || 'FV'}</span>
            )}
          </div>
          <h2>{formData.display_name || 'Fan Explorer'}</h2>
          <p>{formData.bio || 'Archive your journey and celebrate every memory.'}</p>
          <strong>{formData.favorite_artist || 'Favorite artist not set yet'}</strong>
          <button
            className="profile-page__actions-toggle"
            onClick={() => setShowMobileActions((isOpen) => !isOpen)}
            type="button"
          >
            Profile Actions
          </button>
          <div
            className={`profile-page__links ${
              showMobileActions ? 'profile-page__links--open' : ''
            }`}
          >
            <Button to="/my-archive" variant="secondary">
              My Archive
            </Button>
            <Button to="/collectibles" variant="secondary">
              Collectibles
            </Button>
            <Button to="/universe" variant="ghost">
              Badges
            </Button>
            <Button onClick={handleSignOut} type="button" variant="ghost">
              Sign Out
            </Button>
          </div>
        </aside>

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
            <span>Avatar image optional</span>
            <input accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} type="file" />
          </label>

          <Button disabled={saving} type="submit">
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </section>

      {isAdmin && (
        <section className="profile-page__admin-panel glass-panel">
          <div>
            <p className="section-kicker">Admin Panel</p>
            <h2>Admin Panel</h2>
            <p>
              Jump into user, memory, badge, collectible, and story management
              without typing routes by hand.
            </p>
          </div>
          <div className="profile-page__admin-links">
            {adminLinks.map((link) => (
              <Button key={link.to} to={link.to} variant="secondary">
                {link.label}
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProfilePage

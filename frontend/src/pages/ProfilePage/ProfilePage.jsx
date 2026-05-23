import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import FandomArtistSelector from '../../components/FandomArtistSelector/FandomArtistSelector.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import { useAuth } from '../../context/useAuth.js'
import { getArtistById } from '../../services/artistService.js'
import { signOut } from '../../services/authService.js'
import {
  getMainFandomName,
  getProfileCompletedValue,
  shouldShowProfileCompletion,
  updateProfile,
  upsertProfile,
} from '../../services/profileService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
import './ProfilePage.css'

const adminLinks = [
  { label: 'Main Admin Dashboard', to: '/admin' },
  { label: 'Manage Characters', to: '/admin/characters' },
  { label: 'Manage Collectible Cards', to: '/admin/collectibles' },
  { label: 'Manage Premium Stories / Character Fragments', to: '/admin/stories' },
  { label: 'Manage Users', to: '/admin/users' },
  { label: 'Manage Memories', to: '/admin/memories' },
  { label: 'Manage Badges', to: '/admin/badges' },
]

const getInitialFormData = ({ profile, user }) => ({
  display_name: profile?.display_name || user?.user_metadata?.display_name || '',
  bio: profile?.bio || '',
  favorite_artist: profile?.favorite_artist || '',
  favorite_fandom_artist: getMainFandomName(profile),
  main_artist_id: profile?.main_artist_id || '',
  avatar_url: profile?.avatar_url || '',
})

function ProfilePage() {
  const navigate = useNavigate()
  const { profile, refreshProfile, user } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.is_admin
  const [formData, setFormData] = useState(() => getInitialFormData({ profile, user }))
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    if (!formData.main_artist_id) {
      return undefined
    }

    const loadSelectedArtist = async () => {
      try {
        const artist = await getArtistById(formData.main_artist_id)

        if (!cancelled) {
          setSelectedArtist(artist)
        }
      } catch {
        if (!cancelled) {
          setSelectedArtist(null)
        }
      }
    }

    loadSelectedArtist()

    return () => {
      cancelled = true
    }
  }, [formData.main_artist_id])

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

  const handleFandomSelected = async (artist, result) => {
    setSelectedArtist(artist)
    setFormData((currentData) => ({
      ...currentData,
      favorite_artist: artist.name,
      favorite_fandom_artist: artist.name,
      main_artist_id: artist.id,
    }))
    setError('')

    const displayName =
      formData.display_name.trim() ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'Fan Explorer'
    const nextProfile = {
      ...profile,
      display_name: displayName,
      main_artist_id: artist.id,
    }
    const payload = {
      user_id: user.id,
      email: profile?.email || user.email || '',
      display_name: displayName,
      bio: formData.bio.trim(),
      favorite_artist: artist.name,
      favorite_fandom_artist: artist.name,
      main_artist_id: artist.id,
      profile_completed: getProfileCompletedValue(nextProfile),
      avatar_url: formData.avatar_url || null,
    }

    try {
      if (profile) {
        await updateProfile(user.id, payload)
      } else {
        await upsertProfile(payload)
      }

      await refreshProfile(user.id)
      setMessage(
        payload.profile_completed ? 'Your fan profile is ready.' : result.message,
      )
    } catch (saveError) {
      setError(saveError.message)
      throw saveError
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
      const fandomName =
        selectedArtist?.name ||
        formData.favorite_fandom_artist.trim() ||
        formData.favorite_artist.trim()
      const nextProfile = {
        ...profile,
        display_name: formData.display_name.trim(),
        main_artist_id: formData.main_artist_id || null,
      }
      const payload = {
        user_id: user.id,
        email: profile?.email || user.email || '',
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        favorite_artist: fandomName,
        favorite_fandom_artist: fandomName,
        main_artist_id: formData.main_artist_id || null,
        profile_completed: getProfileCompletedValue(nextProfile),
        avatar_url: avatarUrl || null,
      }
      const wasIncomplete = shouldShowProfileCompletion(profile)

      if (profile) {
        await updateProfile(user.id, payload)
      } else {
        await upsertProfile(payload)
      }

      await refreshProfile(user.id)
      setFormData((currentData) => ({
        ...currentData,
        avatar_url: avatarUrl || '',
        favorite_artist: fandomName,
        favorite_fandom_artist: fandomName,
        main_artist_id: formData.main_artist_id || '',
      }))
      setAvatarFile(null)
      setAvatarPreview('')
      setMessage(
        wasIncomplete && payload.profile_completed
          ? 'Your fan profile is ready.'
          : 'Your fan profile has been updated.',
      )
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
    <div className="page-shell form-container profile-page">
      <section className="profile-page__header">
        <div className="section-heading">
          <p className="section-kicker">Profile</p>
          <h1>Your fan identity</h1>
          <p>
            Create a gentle profile around your fan diary. A favorite fandom can
            personalize the experience, but it does not limit your memories.
          </p>
        </div>
      </section>

      {shouldShowProfileCompletion(profile) && (
        <div className="profile-page__inline-helper" role="status">
          Complete your fan profile by adding your display name. Favorite fandom is optional.
        </div>
      )}

      <section className="profile-page__layout">
        <aside className="profile-page__preview glass-panel">
          <div className="profile-page__avatar">
            {avatarPreview || formData.avatar_url ? (
              <img src={avatarPreview || formData.avatar_url} alt="" />
            ) : (
              <span>{formData.display_name.slice(0, 2).toUpperCase() || 'FA'}</span>
            )}
          </div>
          <h2>{formData.display_name || 'Fan Explorer'}</h2>
          <p>{formData.bio || 'Archive your journey and celebrate every memory.'}</p>
          <strong>
            {selectedArtist?.name ||
              formData.favorite_fandom_artist ||
              'Favorite fandom not set yet'}
          </strong>
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

        <form
          className="profile-page__form glass-panel"
          id="fan-profile-form"
          onSubmit={handleSubmit}
        >
          <FormMessage type="success">{message}</FormMessage>
          <FormMessage type="error">{error}</FormMessage>

          <label
            className={
              !formData.display_name.trim() ? 'profile-page__field--missing' : ''
            }
          >
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
              placeholder="Tell Fan Archive a little about your support journey."
              rows="5"
              value={formData.bio}
            ></textarea>
          </label>

          <FandomArtistSelector
            defaultValue={formData.favorite_fandom_artist}
            helperText="Optional: used as a profile detail and the default memory tag."
            label="Favorite Fandom / Artist"
            onArtistSelected={handleFandomSelected}
            placeholder="Search or create a favorite fandom"
            selectedArtist={selectedArtist}
            selectedLabel="Your favorite fandom"
            userId={user.id}
          />

          <label>
            <span>Avatar image optional</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              type="file"
            />
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
              Jump into user, memory, badge, character, collectible, and story
              management without typing routes by hand.
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

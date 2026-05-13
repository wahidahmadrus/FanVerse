import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FandomArtistSelector from '../../components/FandomArtistSelector/FandomArtistSelector.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import InviteFansCard from '../../components/InviteFansCard/InviteFansCard.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import ProfileCompletionBanner from '../../components/ProfileCompletionBanner/ProfileCompletionBanner.jsx'
import { useAuth } from '../../context/useAuth.js'
import { getArtistById } from '../../services/artistService.js'
import { getPublicMemories } from '../../services/memoryService.js'
import {
  getProfileCompletedValue,
  shouldShowProfileCompletion,
  updateProfile,
  upsertProfile,
} from '../../services/profileService.js'
import './ExplorePage.css'

function ExplorePage() {
  const { profile, refreshProfile, user } = useAuth()
  const [artist, setArtist] = useState(null)
  const [memories, setMemories] = useState([])
  const [otherMemories, setOtherMemories] = useState([])
  const [savingFandom, setSavingFandom] = useState(false)
  const [loading, setLoading] = useState(Boolean(user))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const profileIncomplete = shouldShowProfileCompletion(profile)

  useEffect(() => {
    let cancelled = false

    const loadFandom = async () => {
      if (!user || profileIncomplete) {
        setArtist(null)
        setMemories([])
        setOtherMemories([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const artistId = profile.main_artist_id
        const [artistRow, publicRows, otherRows] = await Promise.all([
          getArtistById(artistId),
          getPublicMemories({ artistId, limit: 12 }),
          getPublicMemories({ artistId, excludeUserId: user.id, limit: 4 }),
        ])

        if (!cancelled) {
          setArtist(artistRow)
          setMemories(publicRows)
          setOtherMemories(otherRows)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFandom()

    return () => {
      cancelled = true
    }
  }, [profile, profileIncomplete, user])

  const handleFandomSelected = async (selectedArtist) => {
    if (!user) {
      return
    }

    try {
      setSavingFandom(true)
      setError('')
      const displayName =
        profile?.display_name ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Fan Explorer'
      const nextProfile = {
        ...profile,
        display_name: displayName,
        main_artist_id: selectedArtist.id,
      }
      const payload = {
        user_id: user.id,
        email: profile?.email || user.email || '',
        display_name: displayName,
        bio: profile?.bio || '',
        favorite_artist: selectedArtist.name,
        favorite_fandom_artist: selectedArtist.name,
        main_artist_id: selectedArtist.id,
        profile_completed: getProfileCompletedValue(nextProfile),
        avatar_url: profile?.avatar_url || null,
      }

      if (profile) {
        await updateProfile(user.id, payload)
      } else {
        await upsertProfile(payload)
      }

      await refreshProfile(user.id)
      setMessage('Your fan profile is ready.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingFandom(false)
    }
  }

  if (loading) {
    return <LoadingState label="Opening your fandom space" />
  }

  if (!user) {
    return (
      <div className="page-shell content-container explore-page">
        <section className="explore-page__hero">
          <div>
            <p className="section-kicker">Fandom</p>
            <h1>Choose your fandom first</h1>
            <p>
              FanVerse Archive focuses on one Main Fandom / Artist for each fan
              profile.
            </p>
          </div>
          <div className="actions">
            <Button to="/signup">Create Profile</Button>
            <Button to="/signin" variant="secondary">
              Sign In
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-shell wide-container explore-page">
      <FormMessage type="success">{message}</FormMessage>
      <FormMessage type="error">{error}</FormMessage>

      {profileIncomplete ? (
        <>
          <ProfileCompletionBanner />
          <section className="explore-page__setup glass-panel">
            <div className="section-heading">
              <p className="section-kicker">Choose Your Fandom</p>
              <h1>Your fandom space starts here</h1>
              <p>
                Pick one Main Fandom / Artist to focus your dashboard,
                memories, and community view.
              </p>
            </div>
            <FandomArtistSelector
              autoFocus
              onArtistSelected={handleFandomSelected}
              userId={user.id}
            />
            {savingFandom && (
              <p className="explore-page__saving">Saving your fandom space...</p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="explore-page__hero">
            <div>
              <p className="section-kicker">Fandom</p>
              <h1>{artist?.name} fandom space</h1>
              <p>
                Public memories, fan count, and invite tools for your selected
                Main Fandom / Artist.
              </p>
            </div>
            <div className="actions">
              <Button to="/add-memory">Write a Fan Memory</Button>
              <Button to="/profile" variant="secondary">
                Change Fandom
              </Button>
            </div>
          </section>

          <section className="explore-page__fandom-card glass-panel">
            <div className="explore-page__fandom-image">
              {artist?.image_url ? (
                <img src={artist.image_url} alt="" />
              ) : (
                <span>{artist?.name?.slice(0, 2).toUpperCase() || 'FV'}</span>
              )}
            </div>
            <div>
              <p className="section-kicker">{artist?.category || 'Fandom'}</p>
              <h2>{artist?.name}</h2>
              <p>{artist?.description || 'Your fandom space is growing memory by memory.'}</p>
              <div className="explore-page__stats">
                <span>{artist?.fanCount || 0} fans</span>
                <span>{artist?.memoryCount || 0} memories</span>
                <span>{memories.length} public entries</span>
              </div>
            </div>
          </section>

          {(otherMemories.length === 0 || memories.length <= 2) && (
            <InviteFansCard artistName={artist?.name || 'this fandom'} />
          )}

          <section className="page-section">
            <div className="section-heading">
              <p className="section-kicker">Community Memories</p>
              <h2>Public memories from this fandom</h2>
              <p>
                Only memories connected to your selected fandom appear here.
              </p>
            </div>

            <div className="explore-page__memory-list">
              {memories.length > 0 ? (
                memories.map((memory) => <MemoryCard compact key={memory.id} memory={memory} />)
              ) : (
                <EmptyState
                  actionLabel="Write a Fan Memory"
                  actionTo="/add-memory"
                  description="Be the first to write a memory."
                  title="No memories have been archived for this fandom yet."
                />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default ExplorePage

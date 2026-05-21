import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import InviteFansCard from '../../components/InviteFansCard/InviteFansCard.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import ProfileCompletionBanner from '../../components/ProfileCompletionBanner/ProfileCompletionBanner.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import { checkAchievements } from '../../services/achievementService.js'
import { getArtistById } from '../../services/artistService.js'
import { getUserCollectibleCards } from '../../services/collectibleService.js'
import { getPublicMemories, getUserMemories } from '../../services/memoryService.js'
import { shouldShowProfileCompletion } from '../../services/profileService.js'
import './DashboardPage.css'

function DashboardPage() {
  const { profile, user } = useAuth()
  const [mainArtist, setMainArtist] = useState(null)
  const [artistMemories, setArtistMemories] = useState([])
  const [publicMemories, setPublicMemories] = useState([])
  const [otherPublicMemories, setOtherPublicMemories] = useState([])
  const [cards, setCards] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const profileIncomplete = shouldShowProfileCompletion(profile)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      if (profileIncomplete) {
        setMainArtist(null)
        setArtistMemories([])
        setPublicMemories([])
        setOtherPublicMemories([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const artistId = profile.main_artist_id
        const [
          artistRow,
          memoryRows,
          publicRows,
          otherPublicRows,
          achievements,
          cardRows,
        ] = await Promise.all([
          getArtistById(artistId),
          getUserMemories({ artistId, userId: user.id }),
          getPublicMemories({ artistId, limit: 6 }),
          getPublicMemories({ artistId, excludeUserId: user.id, limit: 4 }),
          checkAchievements({ userId: user.id }),
          getUserCollectibleCards(user.id),
        ])

        if (!cancelled) {
          setMainArtist(artistRow)
          setArtistMemories(memoryRows)
          setPublicMemories(publicRows)
          setOtherPublicMemories(otherPublicRows)
          setBadges(achievements.badges)
          setCards(cardRows)
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

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [profile, profileIncomplete, user])

  const totalStars = useMemo(
    () =>
      artistMemories.reduce(
        (total, memory) => total + Number(memory.final_stars || memory.stars || 0),
        0,
      ),
    [artistMemories],
  )
  const proofCount = artistMemories.filter((memory) => memory.has_proof).length
  const publicOwnCount = artistMemories.filter(
    (memory) => memory.visibility === 'public',
  ).length
  const unlockedCards = cards.filter((card) => card.unlocked)
  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const latestReward = unlockedCards[0] || unlockedBadges[0]
  const displayName =
    profile?.display_name || user?.user_metadata?.display_name || 'Fan explorer'
  const shouldInvite =
    Boolean(mainArtist) &&
    (otherPublicMemories.length === 0 ||
      publicMemories.length <= 2 ||
      (mainArtist.fanCount || 0) <= 1)

  if (loading) {
    return <LoadingState label="Opening your fandom space" />
  }

  return (
    <div className="page-shell wide-container dashboard-page">
      {profileIncomplete && <ProfileCompletionBanner />}

      <section className="dashboard-page__hero">
        <div>
          <p className="section-kicker">Your Fan Archive</p>
          <h1>Welcome back, {displayName}</h1>
          <p>
            {profileIncomplete
              ? 'Choose your fandom to unlock a focused dashboard for your fan archive.'
              : `Your ${mainArtist?.name || 'fandom'} space is ready for the next memory.`}
          </p>
        </div>
        {!profileIncomplete && (
          <div className="actions">
            <Button to="/add-memory">Write a Fan Memory</Button>
            <Button to="/my-archive" variant="secondary">
              View My Archive
            </Button>
          </div>
        )}
      </section>

      <FormMessage type="error">{error}</FormMessage>

      {profileIncomplete ? (
        <EmptyState
          actionLabel="Complete Profile"
          actionTo="/profile"
          description="Choosing one Main Fandom / Artist gives your dashboard a home, a memory feed, and a fandom space."
          title="Choose your fandom first"
        />
      ) : (
        <>
          <section className="dashboard-page__fandom-card glass-panel">
            <div className="dashboard-page__fandom-avatar">
              {mainArtist?.image_url ? (
                <img src={mainArtist.image_url} alt="" />
              ) : (
                <span>{mainArtist?.name?.slice(0, 2).toUpperCase() || 'FA'}</span>
              )}
            </div>
            <div>
              <p className="section-kicker">Main Fandom / Artist</p>
              <h2>{mainArtist?.name}</h2>
              <p>{mainArtist?.description || 'Your fandom space is taking shape.'}</p>
              <div className="dashboard-page__fandom-meta">
                <span>{mainArtist?.fanCount || 0} fans</span>
                <span>{mainArtist?.memoryCount || 0} memories</span>
              </div>
            </div>
          </section>

          <section className="grid grid--4 dashboard-page__stats" aria-label="Fandom memory stats">
            <StatCard label="Memories" tone="purple" value={artistMemories.length} />
            <StatCard label="Stars" tone="gold" value={totalStars} />
            <StatCard label="Proof Added" tone="blue" value={proofCount} />
            <StatCard label="Public Entries" tone="pink" value={publicOwnCount} />
          </section>

          <section className="dashboard-page__content">
            <div>
              <div className="dashboard-page__section-title">
                <div>
                  <p className="section-kicker">Recent Memories</p>
                  <h2>Your latest {mainArtist?.name} entries</h2>
                </div>
                <Button to="/my-archive" variant="ghost">
                  View My Archive
                </Button>
              </div>

              <div className="dashboard-page__memory-list">
                {artistMemories.length > 0 ? (
                  artistMemories
                    .slice(0, 3)
                    .map((memory) => <MemoryCard compact key={memory.id} memory={memory} />)
                ) : (
                  <EmptyState
                    actionLabel="Write a Fan Memory"
                    actionTo="/add-memory"
                    description={`Start your ${mainArtist?.name} fan archive with one moment that mattered.`}
                    title="Your archive is ready"
                  />
                )}
              </div>

              <div className="dashboard-page__section-title dashboard-page__section-title--spaced">
                <div>
                  <p className="section-kicker">Fandom Memories</p>
                  <h2>Public memories from this fandom</h2>
                </div>
                <Button to="/explore" variant="ghost">
                  Fandom
                </Button>
              </div>

              <div className="dashboard-page__memory-list">
                {publicMemories.length > 0 ? (
                  publicMemories
                    .slice(0, 4)
                    .map((memory) => <MemoryCard compact key={memory.id} memory={memory} />)
                ) : (
                  <EmptyState
                    actionLabel="Write a Fan Memory"
                    actionTo="/add-memory"
                    description="Be the first to write a memory. Invite other fans to add theirs too."
                    title="No memories have been archived for this fandom yet."
                  />
                )}
              </div>
            </div>

            <aside className="dashboard-page__side">
              {shouldInvite && <InviteFansCard artistName={mainArtist.name} />}
              {otherPublicMemories.length === 0 && (
                <div className="dashboard-page__quiet glass-panel">
                  <h2>You are one of the first fans building this archive.</h2>
                  <p>Invite other fans to add their memories.</p>
                </div>
              )}
              <div className="dashboard-page__reward glass-panel">
                <p className="section-kicker">Latest Reward</p>
                {latestReward ? (
                  <>
                    <h2>{latestReward.title}</h2>
                    <p>
                      {'rarity' in latestReward
                        ? `${latestReward.rarity} collectible`
                        : 'Badge unlocked'}
                    </p>
                  </>
                ) : (
                  <>
                    <h2>Your first reward is waiting</h2>
                    <p>Archive a memory to begin unlocking badges and cards.</p>
                  </>
                )}
              </div>
              <div className="dashboard-page__quick-links">
                <Button to="/add-memory" variant="secondary">
                  Write a Fan Memory
                </Button>
                <Button to="/collectibles" variant="secondary">
                  Collectibles
                </Button>
                {shouldInvite && (
                  <Button to="/explore" variant="ghost">
                    Invite Fans
                  </Button>
                )}
              </div>
            </aside>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardPage

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
  const [personalMemories, setPersonalMemories] = useState([])
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
      try {
        setLoading(true)
        setError('')

        const artistId = profile?.main_artist_id
        const [
          artistRow,
          memoryRows,
          publicRows,
          otherPublicRows,
          achievements,
          cardRows,
        ] = await Promise.all([
          artistId ? getArtistById(artistId) : Promise.resolve(null),
          getUserMemories({ userId: user.id }),
          getPublicMemories({ limit: 6 }),
          getPublicMemories({ excludeUserId: user.id, limit: 4 }),
          checkAchievements({ userId: user.id }),
          getUserCollectibleCards(user.id),
        ])

        if (!cancelled) {
          setMainArtist(artistRow)
          setPersonalMemories(memoryRows)
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
  }, [profile, user])

  const totalStars = useMemo(
    () =>
      personalMemories.reduce(
        (total, memory) => total + Number(memory.final_stars || memory.stars || 0),
        0,
      ),
    [personalMemories],
  )
  const proofCount = personalMemories.filter((memory) => memory.has_proof).length
  const publicOwnCount = personalMemories.filter(
    (memory) => memory.visibility === 'public',
  ).length
  const unlockedCards = cards.filter((card) => card.unlocked)
  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const latestReward = unlockedCards[0] || unlockedBadges[0]
  const displayName =
    profile?.display_name || user?.user_metadata?.display_name || 'Fan explorer'
  const shouldInvite = Boolean(mainArtist) && (mainArtist.fanCount || 0) <= 1

  if (loading) {
    return <LoadingState label="Opening your fan diary" />
  }

  return (
    <div className="page-shell wide-container dashboard-page">
      {profileIncomplete && <ProfileCompletionBanner />}

      <section className="dashboard-page__hero">
        <div>
          <p className="section-kicker">Your Fan Archive</p>
          <h1>Welcome back, {displayName}</h1>
          <p>
            {mainArtist
              ? `Your favorite fandom is ${mainArtist.name}. It can default new memories, but your diary can hold any fan moment.`
              : 'Your fan diary can hold memories from any artist or fandom. Add a favorite fandom to personalize your profile.'}
          </p>
        </div>
        <div className="actions">
          <Button to="/add-memory">Write a Fan Memory</Button>
          <Button to="/my-archive" variant="secondary">
            View My Archive
          </Button>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="dashboard-page__fandom-card glass-panel">
        <div className="dashboard-page__fandom-avatar">
          {mainArtist?.image_url ? (
            <img src={mainArtist.image_url} alt="" />
          ) : (
            <span>{mainArtist?.name?.slice(0, 2).toUpperCase() || 'FA'}</span>
          )}
        </div>
        <div>
          <p className="section-kicker">Your Favorite Fandom</p>
          <h2>{mainArtist?.name || 'No favorite fandom selected'}</h2>
          <p>
            {mainArtist?.description ||
              'Add a favorite fandom to personalize your profile and default the artist/fandom field when adding memories.'}
          </p>
          <div className="dashboard-page__fandom-meta">
            {mainArtist ? (
              <>
                <span>{mainArtist.fanCount || 0} fans</span>
                <span>{mainArtist.memoryCount || 0} memories</span>
              </>
            ) : (
              <span>Optional profile preference</span>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid--4 dashboard-page__stats" aria-label="Personal fan diary stats">
        <StatCard label="Memories" tone="purple" value={personalMemories.length} />
        <StatCard label="Stars" tone="gold" value={totalStars} />
        <StatCard label="Proof Added" tone="blue" value={proofCount} />
        <StatCard label="Public Entries" tone="pink" value={publicOwnCount} />
      </section>

      <section className="dashboard-page__content">
        <div>
          <div className="dashboard-page__section-title">
            <div>
              <p className="section-kicker">Recent Memories</p>
              <h2>Your latest fan diary entries</h2>
            </div>
            <Button to="/my-archive" variant="ghost">
              View My Archive
            </Button>
          </div>

          <div className="dashboard-page__memory-list">
            {personalMemories.length > 0 ? (
              personalMemories
                .slice(0, 3)
                .map((memory) => <MemoryCard compact key={memory.id} memory={memory} />)
            ) : (
              <EmptyState
                actionLabel="Write a Fan Memory"
                actionTo="/add-memory"
                description="Archive any concert, stream, fan event, artwork, or personal moment that matters to you."
                title="Your fan diary is waiting for its first memory."
              />
            )}
          </div>

          <div className="dashboard-page__section-title dashboard-page__section-title--spaced">
            <div>
              <p className="section-kicker">Fandom</p>
              <h2>Recent public fan memories</h2>
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
                description="Be the first to archive a fan memory."
                title="No public fan memories yet."
              />
            )}
          </div>
        </div>

        <aside className="dashboard-page__side">
          {shouldInvite && <InviteFansCard artistName={mainArtist.name} />}
          {otherPublicMemories.length === 0 && (
            <div className="dashboard-page__quiet glass-panel">
              <h2>The public fan archive is just getting started.</h2>
              <p>Share a public memory so other fans have something to discover.</p>
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
            <Button to="/explore" variant="ghost">
              Fandom
            </Button>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default DashboardPage

import { useEffect, useMemo, useState } from 'react'
import ArtistCard from '../../components/ArtistCard/ArtistCard.jsx'
import BadgeCard from '../../components/BadgeCard/BadgeCard.jsx'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import WeeklyRecap from '../../components/WeeklyRecap/WeeklyRecap.jsx'
import { useAuth } from '../../context/useAuth.js'
import { getArtists, getSupportedArtists } from '../../services/artistService.js'
import { syncUserBadges } from '../../services/badgeService.js'
import { getUserMemories } from '../../services/memoryService.js'
import './DashboardPage.css'

function DashboardPage() {
  const { profile, user } = useAuth()
  const [memories, setMemories] = useState([])
  const [badges, setBadges] = useState([])
  const [supportedArtists, setSupportedArtists] = useState([])
  const [suggestedArtists, setSuggestedArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const [memoryRows, supportedArtistRows, artistRows] = await Promise.all([
          getUserMemories({ userId: user.id, limit: 8 }),
          getSupportedArtists(user.id),
          getArtists({ limit: 6 }),
        ])

        setMemories(memoryRows)
        setSupportedArtists(supportedArtistRows)
        setSuggestedArtists(
          artistRows.filter(
            (artist) =>
              !supportedArtistRows.some(
                (supportedArtist) => supportedArtist.id === artist.id,
              ),
          ),
        )
        setBadges(
          await syncUserBadges({
            userId: user.id,
            memories: memoryRows,
            supportedArtists: supportedArtistRows,
          }),
        )
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  const totalStars = useMemo(
    () => memories.reduce((total, memory) => total + Number(memory.stars || 0), 0),
    [memories],
  )
  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const displayName =
    profile?.display_name || user?.user_metadata?.display_name || 'Fan explorer'

  if (loading) {
    return <LoadingState label="Building your dashboard" />
  }

  return (
    <div className="page-shell dashboard-page">
      <section className="dashboard-page__hero">
        <div>
          <p className="section-kicker">Dashboard</p>
          <h1>Welcome back, {displayName}</h1>
          <p>
            Your personal archive, supported artists, stars, and badges are all
            gathered here with room to grow.
          </p>
        </div>
        <div className="actions">
          <Button to="/add-memory">Add Memory</Button>
          <Button to="/artists" variant="secondary">
            Explore Artists
          </Button>
          <Button to="/create-artist" variant="ghost">
            Create Artist
          </Button>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="grid grid--4 dashboard-page__stats" aria-label="Archive stats">
        <StatCard
          detail="personal timeline"
          label="Total Memories Archived"
          tone="purple"
          value={memories.length}
        />
        <StatCard
          detail="collected gently"
          label="Total Stars Collected"
          tone="gold"
          value={totalStars}
        />
        <StatCard
          detail="fan communities"
          label="Artists Supported"
          tone="blue"
          value={supportedArtists.length}
        />
        <StatCard
          detail="milestones"
          label="Badges Unlocked"
          tone="pink"
          value={unlockedBadges.length}
        />
      </section>

      <section className="dashboard-page__content">
        <div>
          <div className="dashboard-page__section-title">
            <div>
              <p className="section-kicker">Recent Personal Memories</p>
              <h2>Your latest archive entries</h2>
            </div>
            <Button to="/my-archive" variant="ghost">
              My Archive
            </Button>
          </div>

          <div className="dashboard-page__memory-list">
            {memories.length > 0 ? (
              memories
                .slice(0, 3)
                .map((memory) => <MemoryCard compact key={memory.id} memory={memory} />)
            ) : (
              <EmptyState
                actionLabel="Add Memory"
                actionTo="/add-memory"
                description="Archive your first moment when you are ready."
                title="Your personal archive is waiting"
              />
            )}
          </div>
        </div>

        <aside>
          <div className="dashboard-page__section-title">
            <div>
              <p className="section-kicker">Badges</p>
              <h2>Unlocked</h2>
            </div>
            <Button to="/universe" variant="ghost">
              Universe
            </Button>
          </div>

          <div className="dashboard-page__badge-list">
            {badges.slice(0, 3).map((badge) => (
              <BadgeCard badge={badge} compact key={badge.id} />
            ))}
          </div>
        </aside>
      </section>

      <section className="page-section dashboard-page__suggestions">
        <div className="section-heading">
          <p className="section-kicker">Suggested Artists</p>
          <h2>Find another archive to support</h2>
        </div>
        {suggestedArtists.length > 0 ? (
          <div className="grid grid--3">
            {suggestedArtists.slice(0, 3).map((artist) => (
              <ArtistCard artist={artist} key={artist.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionLabel="Explore Artists"
            actionTo="/artists"
            description="New artist archives will appear here as the community grows."
            title="No suggestions yet"
          />
        )}
      </section>

      <section className="page-section">
        <WeeklyRecap memories={memories} />
      </section>
    </div>
  )
}

export default DashboardPage

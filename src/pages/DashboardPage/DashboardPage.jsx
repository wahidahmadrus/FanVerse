import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import { checkAchievements } from '../../services/achievementService.js'
import { getUserCollectibleCards } from '../../services/collectibleService.js'
import { getUserMemories } from '../../services/memoryService.js'
import './DashboardPage.css'

function DashboardPage() {
  const { profile, user } = useAuth()
  const [memories, setMemories] = useState([])
  const [cards, setCards] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const [memoryRows, achievements] = await Promise.all([
          getUserMemories({ userId: user.id, limit: 8 }),
          checkAchievements({ userId: user.id }),
        ])
        const cardRows = await getUserCollectibleCards(user.id)

        setMemories(memoryRows)
        setCards(cardRows)
        setBadges(achievements.badges)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  const totalStars = useMemo(
    () =>
      memories.reduce(
        (total, memory) => total + Number(memory.final_stars || memory.stars || 0),
        0,
      ),
    [memories],
  )
  const proofCount = memories.filter((memory) => memory.has_proof).length
  const unlockedCards = cards.filter((card) => card.unlocked)
  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const latestReward = unlockedCards[0] || unlockedBadges[0]
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
            Fans don&apos;t end, nor do their stories. Keep the next memory
            close and archive it when it feels right.
          </p>
        </div>
        <div className="actions">
          <Button to="/add-memory">Add Memory</Button>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="grid grid--4 dashboard-page__stats" aria-label="Archive stats">
        <StatCard label="Memories" tone="purple" value={memories.length} />
        <StatCard label="Stars" tone="gold" value={totalStars} />
        <StatCard label="Proof Added" tone="blue" value={proofCount} />
        <StatCard label="Cards" tone="pink" value={unlockedCards.length} />
      </section>

      <section className="dashboard-page__content">
        <div>
          <div className="dashboard-page__section-title">
            <div>
              <p className="section-kicker">Recent Memories</p>
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
                description="Your universe is waiting for its first star."
                title="Your archive is ready"
              />
            )}
          </div>
        </div>

        <aside className="dashboard-page__side">
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
            <Button to="/universe" variant="secondary">
              Universe
            </Button>
            <Button to="/collectibles" variant="secondary">
              Collectibles
            </Button>
            <Button to="/my-archive" variant="ghost">
              My Archive
            </Button>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default DashboardPage

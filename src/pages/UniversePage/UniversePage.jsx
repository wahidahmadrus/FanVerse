import { useEffect, useState } from 'react'
import BadgeCard from '../../components/BadgeCard/BadgeCard.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import UniverseMap from '../../components/UniverseMap/UniverseMap.jsx'
import { useAuth } from '../../context/useAuth.js'
import { getSupportedArtists } from '../../services/artistService.js'
import { syncUserBadges } from '../../services/badgeService.js'
import { getUserMemories } from '../../services/memoryService.js'
import './UniversePage.css'

function UniversePage() {
  const { user } = useAuth()
  const [memories, setMemories] = useState([])
  const [badges, setBadges] = useState([])
  const [badgeSearch, setBadgeSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUniverse = async () => {
      try {
        setLoading(true)
        const [memoryRows, supportedArtists] = await Promise.all([
          getUserMemories({ userId: user.id }),
          getSupportedArtists(user.id),
        ])
        setMemories(memoryRows)
        setBadges(
          await syncUserBadges({
            userId: user.id,
            memories: memoryRows,
            supportedArtists,
          }),
        )
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadUniverse()
  }, [user])

  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const filteredBadges = badges.filter((badge) => {
    const query = badgeSearch.trim().toLowerCase()

    if (!query) {
      return true
    }

    return [badge.title, badge.description, badge.condition_type]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
  const totalStars = memories.reduce(
    (total, memory) => total + Number(memory.final_stars || memory.stars || 0),
    0,
  )
  const proofMemories = memories.filter((memory) => memory.has_proof)
  const specialMemories = memories.filter((memory) =>
    ['Concert', 'Fan Meet', 'Special Moment'].includes(memory.activity_type),
  )

  if (loading) {
    return <LoadingState label="Mapping your fan universe" />
  }

  return (
    <div className="page-shell wide-container universe-page">
      <section className="universe-page__header">
        <div className="section-heading">
          <p className="section-kicker">Universe</p>
          <h1>Your Fan Universe</h1>
          <p>
            Your memories become stars, your badges become planets, and your
            support journey grows at your own pace.
          </p>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <section className="grid grid--4 universe-page__stats">
        <StatCard label="Total Stars" tone="gold" value={totalStars} />
        <StatCard label="Memories" tone="purple" value={memories.length} />
        <StatCard label="Proof Added" tone="blue" value={proofMemories.length} />
        <StatCard label="Badges" tone="pink" value={unlockedBadges.length} />
      </section>

      <section className="universe-page__galaxies">
        <UniverseMap memories={memories} title="Recent Memories Galaxy" />
        <UniverseMap memories={proofMemories} title="Verified Memories Galaxy" />
        <UniverseMap memories={specialMemories} title="Special Moments Galaxy" />
      </section>

      <section className="page-section universe-page__badges">
        <div className="section-heading">
          <p className="section-kicker">Badges</p>
          <h2>Milestones for meaningful memories</h2>
          <p>
            Badges are gentle celebrations of moments you have chosen to save.
          </p>
        </div>
        <div className="universe-page__badge-search glass-panel">
          <input
            onChange={(event) => setBadgeSearch(event.target.value)}
            placeholder="Search badges..."
            type="search"
            value={badgeSearch}
          />
        </div>

        <div className="grid grid--3">
          {filteredBadges.map((badge) => (
            <BadgeCard badge={badge} key={badge.id} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default UniversePage

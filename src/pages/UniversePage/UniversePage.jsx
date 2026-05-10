import { useEffect, useState } from 'react'
import BadgeCard from '../../components/BadgeCard/BadgeCard.jsx'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
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

  if (loading) {
    return <LoadingState label="Mapping your fan universe" />
  }

  return (
    <div className="page-shell universe-page">
      <section className="universe-page__header">
        <div className="section-heading">
          <p className="section-kicker">Universe</p>
          <h1>Your Fan Universe</h1>
          <p>
            Your memories become stars, your badges become planets, and your
            support journey grows at your own pace.
          </p>
        </div>
        <div className="universe-page__summary glass-panel">
          <strong>{unlockedBadges.length}</strong>
          <span>badges unlocked</span>
          <Button to="/add-memory" variant="secondary">
            Add Memory
          </Button>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>

      <UniverseMap badges={badges} memories={memories} />

      <section className="page-section universe-page__badges">
        <div className="section-heading">
          <p className="section-kicker">Badges</p>
          <h2>Milestones for meaningful memories</h2>
          <p>
            Badges are gentle celebrations of moments you have chosen to save.
          </p>
        </div>

        <div className="grid grid--3">
          {badges.map((badge) => (
            <BadgeCard badge={badge} key={badge.id} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default UniversePage

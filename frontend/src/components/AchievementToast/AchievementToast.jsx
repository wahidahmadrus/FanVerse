import Button from '../Button/Button.jsx'
import './AchievementToast.css'

function AchievementToast({ cards = [], badges = [], onClose }) {
  if (cards.length === 0 && badges.length === 0) {
    return null
  }

  const firstCard = cards[0]
  const firstBadge = badges[0]

  return (
    <aside className="achievement-toast" role="status">
      <p className="section-kicker">Milestone</p>
      {firstCard ? (
        <>
          <h2>You unlocked a new collectible card: {firstCard.title}</h2>
          <p>{firstCard.description}</p>
        </>
      ) : (
        <>
          <h2>You unlocked a badge: {firstBadge.title}</h2>
          <p>{firstBadge.description}</p>
        </>
      )}
      <div className="achievement-toast__actions">
        {cards.length > 0 && (
          <Button to="/collectibles" variant="secondary">
            View Cards
          </Button>
        )}
        <Button onClick={onClose} type="button" variant="ghost">
          Close
        </Button>
      </div>
    </aside>
  )
}

export default AchievementToast

import ShareButton from '../ShareButton/ShareButton.jsx'
import './BadgeCard.css'

function BadgeCard({ badge, compact = false }) {
  return (
    <article
      className={`badge-card badge-card--${badge.glow} ${
        badge.unlocked ? 'badge-card--unlocked' : 'badge-card--locked'
      } ${compact ? 'badge-card--compact' : ''}`}
    >
      <div className="badge-card__icon" aria-hidden="true">
        {badge.icon}
      </div>
      <div>
        <div className="badge-card__header">
          <h3>{badge.title}</h3>
          <span>{badge.unlocked ? 'Unlocked' : 'Locked'}</span>
        </div>
        <p>{badge.description}</p>
        {badge.unlocked && !compact && (
          <ShareButton
            text={`I just unlocked '${badge.title}' on FanVerse Archive. My fan journey keeps growing.`}
            title={badge.title}
          >
            Share Badge
          </ShareButton>
        )}
      </div>
    </article>
  )
}

export default BadgeCard

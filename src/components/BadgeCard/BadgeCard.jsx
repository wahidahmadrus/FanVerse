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
      </div>
    </article>
  )
}

export default BadgeCard

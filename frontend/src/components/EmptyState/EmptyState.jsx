import Button from '../Button/Button.jsx'
import './EmptyState.css'

function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="empty-state">
      <div className="empty-state__star" aria-hidden="true"></div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionTo && (
        <Button to={actionTo} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState

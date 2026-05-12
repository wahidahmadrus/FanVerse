import './StoryFragmentCard.css'

function StoryFragmentCard({ children, locked = false, title }) {
  return (
    <article
      className={`story-fragment-card ${
        locked ? 'story-fragment-card--locked' : 'story-fragment-card--unlocked'
      }`}
    >
      <span>{locked ? 'Locked Fragment' : 'Unlocked Fragment'}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  )
}

export default StoryFragmentCard

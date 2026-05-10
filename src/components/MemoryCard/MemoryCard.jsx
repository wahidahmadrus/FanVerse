import './MemoryCard.css'

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

function MemoryCard({ memory, compact = false, actions = null }) {
  const activityType = memory.activity_type || memory.type
  const memoryDate = memory.memory_date || memory.date
  const artistName =
    memory.artistName ||
    memory.artist?.name ||
    (typeof memory.artist === 'string' ? memory.artist : 'Unknown artist')
  const imageUrl = memory.proof_image_url || memory.proofImageUrl || memory.imageUrl
  const visibility = memory.visibility || 'public'
  const authorName = memory.authorName || memory.profile?.display_name

  return (
    <article className={`memory-card ${compact ? 'memory-card--compact' : ''}`}>
      <div className="memory-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt="" />
        ) : (
          <div className="memory-card__placeholder" aria-hidden="true">
            <span></span>
          </div>
        )}
      </div>

      <div className="memory-card__content">
        <div className="memory-card__topline">
          <span>{activityType}</span>
          <span>{visibility === 'private' ? 'Private Memory' : 'Public Memory'}</span>
        </div>
        <h3>{memory.title}</h3>
        <p className="memory-card__artist">{artistName}</p>
        <p className="memory-card__description">{memory.description}</p>
        <div className="memory-card__meta">
          {memoryDate && <span>{formatDate(memoryDate)}</span>}
          <span>{memory.mood}</span>
          <strong>{memory.stars} stars</strong>
          {authorName && <span>By {authorName}</span>}
        </div>
        {actions && <div className="memory-card__actions">{actions}</div>}
      </div>
    </article>
  )
}

export default MemoryCard

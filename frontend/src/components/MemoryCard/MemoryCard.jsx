import './MemoryCard.css'

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

const getMemoryDescription = (memory) =>
  memory.memory_text || memory.description || memory.content || memory.text || ''

const getPreview = (text) => {
  const normalizedText = String(text).replace(/\s+/g, ' ').trim()

  if (!normalizedText) {
    return 'No memory text added.'
  }

  if (normalizedText.length <= 170) {
    return normalizedText
  }

  return `${normalizedText.slice(0, 170).trim()}...`
}

function MemoryCard({ memory, compact = false, actions = null }) {
  const activityType = memory.activity_type || memory.type
  const memoryDate = memory.memory_date || memory.date
  const artistName =
    memory.artistName ||
    memory.artist?.name ||
    (typeof memory.artist === 'string' ? memory.artist : 'Unknown fandom')
  const imageUrl = memory.proof_image_url || memory.proofImageUrl || memory.imageUrl
  const visibility = memory.visibility || 'public'
  const authorName = memory.authorName || memory.profile?.display_name
  const hasProof = memory.has_proof || memory.hasProof || Boolean(imageUrl)
  const baseStars = memory.base_stars || memory.baseStars || memory.stars
  const finalStars = memory.final_stars || memory.finalStars || memory.stars
  const memoryDescription = getPreview(getMemoryDescription(memory))

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
          <span>{hasProof ? 'Proof Added' : 'Memory Only'}</span>
        </div>
        <h3>{memory.title}</h3>
        <p className="memory-card__artist">{artistName}</p>
        <p className="memory-card__description">{memoryDescription}</p>
        <div className="memory-card__meta">
          {memoryDate && <span>{formatDate(memoryDate)}</span>}
          <span>{memory.mood}</span>
          <strong>{finalStars} stars</strong>
          {hasProof && <strong>2x Stars Applied</strong>}
          {authorName && <span>By {authorName}</span>}
        </div>
        {hasProof && (
          <p className="memory-card__proof-note">
            Base reward {baseStars} stars with proof bonus applied.
          </p>
        )}
        {actions && <div className="memory-card__actions">{actions}</div>}
      </div>
    </article>
  )
}

export default MemoryCard

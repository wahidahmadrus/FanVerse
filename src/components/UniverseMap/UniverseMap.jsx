import { useState } from 'react'
import './UniverseMap.css'

const getStarSize = (stars) => {
  if (stars >= 50) return 'large'
  if (stars >= 25) return 'medium'
  return 'small'
}

const getActivityClass = (activityType) =>
  (activityType || 'Personal Memory').toLowerCase().replaceAll(' ', '-')

const starPositions = [
  { x: 10, y: 22 },
  { x: 25, y: 55 },
  { x: 42, y: 28 },
  { x: 68, y: 18 },
  { x: 82, y: 62 },
  { x: 57, y: 72 },
  { x: 16, y: 76 },
  { x: 76, y: 38 },
  { x: 34, y: 78 },
  { x: 51, y: 48 },
  { x: 90, y: 24 },
  { x: 6, y: 52 },
  { x: 63, y: 58 },
  { x: 44, y: 86 },
  { x: 30, y: 18 },
  { x: 88, y: 82 },
]

const globePosition = { x: 50, y: 50 }

function UniverseMap({ memories, title = 'Recent Memories Galaxy' }) {
  const [selectedMemory, setSelectedMemory] = useState(null)
  const memoryStars = memories.slice(0, 16)
  const activeMemory = selectedMemory || memoryStars[0]

  return (
    <section className="universe-map" aria-label={title}>
      <header className="universe-map__header">
        <p className="section-kicker">Galaxy</p>
        <h2>{title}</h2>
      </header>

      <div className="universe-map__space">
        {memoryStars.length > 0 && (
          <svg
            aria-hidden="true"
            className="universe-map__lines"
            height="100%"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
            width="100%"
          >
            {memoryStars.map((memory, index) => {
              const position = starPositions[index % starPositions.length]
              const hasProof = memory.has_proof || Boolean(memory.proof_image_url)

              return (
                <line
                  className={`universe-map__line ${
                    hasProof ? 'universe-map__line--proof' : ''
                  }`}
                  key={memory.id}
                  x1={`${globePosition.x}%`}
                  x2={`${position.x}%`}
                  y1={`${globePosition.y}%`}
                  y2={`${position.y}%`}
                />
              )
            })}
          </svg>
        )}
        <div
          className="universe-map__planet"
          aria-hidden="true"
          style={{ left: `${globePosition.x}%`, top: `${globePosition.y}%` }}
        >
          <span></span>
        </div>
        {memoryStars.map((memory, index) => {
          const stars = Number(memory.final_stars || memory.stars || 0)
          const hasProof = memory.has_proof || Boolean(memory.proof_image_url)
          const artistName = memory.artistName || memory.artist?.name || 'Unknown artist'
          const position = starPositions[index % starPositions.length]

          return (
            <button
              aria-label={`${memory.title} memory star`}
              className={`universe-map__star universe-map__star--${getStarSize(stars)} universe-map__star--${getActivityClass(memory.activity_type || memory.type)} ${hasProof ? 'universe-map__star--proof' : ''}`}
              key={memory.id}
              onClick={() => setSelectedMemory(memory)}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={`${memory.title} / ${artistName} / ${stars} stars`}
              type="button"
            ></button>
          )
        })}

        {memoryStars.length === 0 && (
          <div className="universe-map__empty">
            <strong>Your universe is waiting for its first star.</strong>
            <span>Add a memory to light it up.</span>
          </div>
        )}

        {activeMemory && (
          <aside className="universe-map__details">
            <button
              aria-label="Close star details"
              onClick={() => setSelectedMemory(null)}
              type="button"
            >
              Close
            </button>
            <strong>{activeMemory.title}</strong>
            <span>{activeMemory.artistName || activeMemory.artist?.name || 'Unknown artist'}</span>
            <p className="universe-map__details-meta">
              <span className="universe-map__details-activity">
                {activeMemory.activity_type || activeMemory.type || 'Memory'}
              </span>
              <span>{activeMemory.final_stars || activeMemory.stars || 0} stars</span>
              <span>
                {activeMemory.has_proof || activeMemory.proof_image_url
                  ? 'Proof Added'
                  : 'Memory Only'}
              </span>
            </p>
          </aside>
        )}
      </div>
    </section>
  )
}

export default UniverseMap

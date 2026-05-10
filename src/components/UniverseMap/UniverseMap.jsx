import './UniverseMap.css'

function UniverseMap({ memories, badges }) {
  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const memoryStars = memories.slice(0, 12)

  return (
    <section className="universe-map" aria-label="Fan universe visual map">
      <div className="universe-map__orbit universe-map__orbit--outer"></div>
      <div className="universe-map__orbit universe-map__orbit--middle"></div>
      <div className="universe-map__orbit universe-map__orbit--inner"></div>
      <div className="universe-map__core">
        <span>FanVerse</span>
        <strong>{memories.length}</strong>
        <span>memories</span>
      </div>

      {memoryStars.map((memory, index) => (
        <span
          aria-label={`${memory.title} memory star`}
          className={`universe-map__star universe-map__star--${(index % 12) + 1}`}
          key={memory.id}
          title={memory.title}
        ></span>
      ))}

      {unlockedBadges.slice(0, 6).map((badge, index) => (
        <span
          aria-label={`${badge.title} badge planet`}
          className={`universe-map__planet universe-map__planet--${(index % 6) + 1}`}
          key={badge.id}
          title={badge.title}
        >
          {badge.icon}
        </span>
      ))}
    </section>
  )
}

export default UniverseMap

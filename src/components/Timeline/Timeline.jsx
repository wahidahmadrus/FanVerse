import MemoryCard from '../MemoryCard/MemoryCard.jsx'
import './Timeline.css'

function Timeline({ memories, renderActions }) {
  if (memories.length === 0) {
    return (
      <div className="timeline-empty">
        <h2>No memories match this view yet.</h2>
        <p>Archive a moment when it feels right, then it will appear here.</p>
      </div>
    )
  }

  return (
    <div className="timeline">
      {memories.map((memory) => (
        <div className="timeline__item" key={memory.id}>
          <div className="timeline__marker" aria-hidden="true"></div>
          <MemoryCard
            actions={renderActions ? renderActions(memory) : null}
            memory={memory}
          />
        </div>
      ))}
    </div>
  )
}

export default Timeline

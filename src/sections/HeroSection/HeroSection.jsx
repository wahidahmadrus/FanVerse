import Button from '../../components/Button/Button.jsx'
import './HeroSection.css'

function HeroSection({ memories }) {
  const totalStars = memories.reduce(
    (stars, memory) => stars + Number(memory.stars || 0),
    0,
  )

  return (
    <section className="hero-section">
      <div className="hero-section__content">
        <p className="section-kicker">FanVerse Archive</p>
        <h1>Archive Your Fan Journey</h1>
        <p>
          Save your memories, celebrate your support, and build your own
          universe as a fan. Fans don&apos;t end, nor do their stories.
        </p>
        <div className="actions hero-section__actions">
          <Button to="/signup">Start Your Archive</Button>
          <Button to="/explore" variant="secondary">
            Explore Demo
          </Button>
        </div>
      </div>

      <aside className="hero-section__preview" aria-label="Fan archive preview">
        <div className="hero-section__planet" aria-hidden="true"></div>
        <div className="hero-section__preview-header">
          <span>Luna Ray Archive</span>
          <strong>{totalStars} stars</strong>
        </div>
        <div className="hero-section__preview-stat">
          <span>Memories</span>
          <strong>{memories.length}</strong>
        </div>
        <div className="hero-section__preview-list">
          {memories.slice(0, 3).map((memory) => (
            <div key={memory.id}>
              <span>{memory.type}</span>
              <p>{memory.title}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  )
}

export default HeroSection

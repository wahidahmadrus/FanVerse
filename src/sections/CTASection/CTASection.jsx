import Button from '../../components/Button/Button.jsx'
import './CTASection.css'

function CTASection() {
  return (
    <section className="page-section cta-section">
      <p className="section-kicker">Begin Your Archive</p>
      <h2>Celebrate your journey, one memory at a time</h2>
      <p>
        Build your fan universe with moments that feel meaningful to you.
      </p>
      <div className="actions cta-section__actions">
        <Button to="/signup">Start Your Archive</Button>
        <Button to="/explore" variant="secondary">
          Explore Artists
        </Button>
      </div>
    </section>
  )
}

export default CTASection

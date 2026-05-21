import './HowItWorksSection.css'

const steps = [
  'Add your fan memories',
  'Track your support journey',
  'Earn stars and badges',
  'Build your personal fan universe',
]

function HowItWorksSection() {
  return (
    <section className="page-section how-section">
      <div className="section-heading">
        <p className="section-kicker">How It Works</p>
        <h2>Turn moments into a lasting archive</h2>
        <p>
          Fan Archive keeps the experience gentle: save what matters, look
          back with pride, and let your universe grow naturally.
        </p>
      </div>

      <div className="how-section__steps">
        {steps.map((step, index) => (
          <article className="how-section__step" key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{step}</h3>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HowItWorksSection

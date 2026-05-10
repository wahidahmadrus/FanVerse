import FeatureCard from '../../components/FeatureCard/FeatureCard.jsx'
import { features } from '../../data/features.js'
import './FeaturesSection.css'

function FeaturesSection() {
  return (
    <section className="page-section features-section">
      <div className="section-heading">
        <p className="section-kicker">Features</p>
        <h2>Everything a personal fan archive needs</h2>
        <p>
          The MVP shows how memories, identity, milestones, and reflection can
          fit together in one calm space.
        </p>
      </div>

      <div className="grid grid--3">
        {features.map((feature) => (
          <FeatureCard feature={feature} key={feature.id} />
        ))}
      </div>
    </section>
  )
}

export default FeaturesSection

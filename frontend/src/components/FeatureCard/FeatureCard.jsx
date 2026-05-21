import './FeatureCard.css'

function FeatureCard({ feature }) {
  return (
    <article className="feature-card">
      <div className="feature-card__icon" aria-hidden="true">
        {feature.icon}
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </article>
  )
}

export default FeatureCard

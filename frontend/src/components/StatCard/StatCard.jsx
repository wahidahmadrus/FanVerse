import './StatCard.css'

function StatCard({ label, value, detail, tone = 'purple' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </article>
  )
}

export default StatCard

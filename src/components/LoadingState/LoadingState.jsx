import './LoadingState.css'

function LoadingState({ label = 'Loading' }) {
  return (
    <div className="loading-state" role="status">
      <span aria-hidden="true"></span>
      <p>{label}</p>
    </div>
  )
}

export default LoadingState

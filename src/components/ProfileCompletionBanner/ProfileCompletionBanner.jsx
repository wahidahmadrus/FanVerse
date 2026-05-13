import Button from '../Button/Button.jsx'
import './ProfileCompletionBanner.css'

function ProfileCompletionBanner({ className = '' }) {
  return (
    <section className={`profile-completion-banner ${className}`.trim()}>
      <div>
        <p className="section-kicker">Profile Setup</p>
        <h2>Complete your fan profile</h2>
        <p>Choose your fandom, add your name, and start building your archive.</p>
      </div>
      <Button to="/profile">Complete Profile</Button>
    </section>
  )
}

export default ProfileCompletionBanner

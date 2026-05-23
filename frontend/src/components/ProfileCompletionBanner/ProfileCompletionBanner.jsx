import Button from '../Button/Button.jsx'
import './ProfileCompletionBanner.css'

function ProfileCompletionBanner({ className = '' }) {
  return (
    <section className={`profile-completion-banner ${className}`.trim()}>
      <div>
        <p className="section-kicker">Profile Setup</p>
        <h2>Complete your fan profile</h2>
        <p>Add your display name and an optional favorite fandom to personalize your archive.</p>
      </div>
      <Button to="/profile">Complete Profile</Button>
    </section>
  )
}

export default ProfileCompletionBanner

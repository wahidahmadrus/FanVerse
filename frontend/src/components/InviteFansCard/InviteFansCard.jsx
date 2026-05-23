import ShareButton from '../ShareButton/ShareButton.jsx'
import './InviteFansCard.css'

function InviteFansCard({ artistName }) {
  const inviteText = artistName
    ? `I'm adding fan memories for ${artistName} on Fan Archive. Join and add yours too.`
    : "I'm building a fan diary on Fan Archive. Join and add your memories too."

  return (
    <section className="invite-fans-card">
      <div>
        <p className="section-kicker">Invite Fans</p>
        <h2>Invite fans to add memories</h2>
        <p>Help the public fan archive grow by inviting others to preserve their moments.</p>
      </div>
      <ShareButton
        mode="invite"
        text={inviteText}
        title={artistName ? `Fan Archive: ${artistName}` : 'Fan Archive'}
        url={window.location.origin}
        variant="bright"
      >
        Invite Fans
      </ShareButton>
    </section>
  )
}

export default InviteFansCard

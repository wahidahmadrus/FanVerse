import ShareButton from '../ShareButton/ShareButton.jsx'
import './InviteFansCard.css'

function InviteFansCard({ artistName }) {
  const inviteText = `I'm building a fan archive for ${artistName} on Fan Archive. Join and add your memories.`

  return (
    <section className="invite-fans-card">
      <div>
        <p className="section-kicker">Invite Fans</p>
        <h2>Invite fans to this archive</h2>
        <p>Help this fandom grow by inviting others to preserve their memories.</p>
      </div>
      <ShareButton
        mode="invite"
        text={inviteText}
        title={`Fan Archive: ${artistName}`}
        url={window.location.origin}
        variant="bright"
      >
        Invite Fans
      </ShareButton>
    </section>
  )
}

export default InviteFansCard

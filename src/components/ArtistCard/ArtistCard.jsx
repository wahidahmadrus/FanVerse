import Button from '../Button/Button.jsx'
import './ArtistCard.css'

function ArtistCard({ artist }) {
  return (
    <article className="artist-card">
      <div className="artist-card__image">
        {artist.image_url ? (
          <img src={artist.image_url} alt="" />
        ) : (
          <span aria-hidden="true">{artist.name?.slice(0, 2).toUpperCase()}</span>
        )}
      </div>

      <div className="artist-card__content">
        <div className="artist-card__topline">
          <span>{artist.category}</span>
        </div>
        <h3>{artist.name}</h3>
        <p>{artist.description || 'A growing artist archive in Fan Archive.'}</p>
        <div className="artist-card__stats">
          <span>{artist.fanCount || 0} fans</span>
          <span>{artist.memoryCount || 0} memories</span>
        </div>
        <Button to={`/artists/${artist.id}`} variant="secondary">
          View Artist
        </Button>
      </div>
    </article>
  )
}

export default ArtistCard

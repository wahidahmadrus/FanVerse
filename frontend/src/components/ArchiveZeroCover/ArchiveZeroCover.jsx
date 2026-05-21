import { useState } from 'react'
import './ArchiveZeroCover.css'

const coverImageSrc = '/images/archive-zero-cover.png'
const coverWebpSrc = '/images/archive-zero-cover.webp'

function ArchiveZeroCover() {
  const [hasCoverImage, setHasCoverImage] = useState(true)

  return (
    <section className="archive-zero-cover">
      <div className="archive-zero-cover__media">
        {hasCoverImage ? (
          <picture>
            <source srcSet={coverWebpSrc} type="image/webp" />
            <img
              alt="Archive Zero characters"
              decoding="async"
              onError={() => setHasCoverImage(false)}
              src={coverImageSrc}
            />
          </picture>
        ) : (
          <div className="archive-zero-cover__placeholder" aria-hidden="true">
            <span>En</span>
            <span>Uan</span>
            <span>On</span>
            <span>Yal</span>
          </div>
        )}
      </div>
      <div className="archive-zero-cover__content">
        <p className="section-kicker">Archive Zero</p>
        <h1>Archive Zero Collectibles</h1>
        <p>Choose, unlock, and collect story fragments from the fan universe.</p>
        <span>Every card reveals a piece of the archive.</span>
      </div>
    </section>
  )
}

export default ArchiveZeroCover

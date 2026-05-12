import { useState } from 'react'
import './ArchiveZeroCover.css'

const coverImageSrc = '/images/archive-zero-cover.png'

function ArchiveZeroCover() {
  const [hasCoverImage, setHasCoverImage] = useState(true)

  return (
    <section className="archive-zero-cover">
      <div className="archive-zero-cover__media">
        {hasCoverImage ? (
          <img
            alt="Archive Zero characters"
            onError={() => setHasCoverImage(false)}
            src={coverImageSrc}
          />
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

import { useState } from 'react'
import { shareAchievement } from '../../services/shareService.js'
import './ShareButton.css'

function ShareButton({ title, text, children = 'Share', variant = 'subtle' }) {
  const [message, setMessage] = useState('')

  const handleShare = async () => {
    try {
      const nextMessage = await shareAchievement({ title, text })
      setMessage(nextMessage)
      window.setTimeout(() => setMessage(''), 2400)
    } catch {
      setMessage('Sharing was cancelled.')
      window.setTimeout(() => setMessage(''), 1800)
    }
  }

  return (
    <span className="share-button-wrap">
      <button
        className={`share-button share-button--${variant}`}
        onClick={handleShare}
        type="button"
      >
        {children}
      </button>
      {message && <span className="share-button__message">{message}</span>}
    </span>
  )
}

export default ShareButton

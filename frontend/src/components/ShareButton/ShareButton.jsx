import { useState } from 'react'
import { shareAchievement } from '../../services/shareService.js'
import { shareImage, shareText } from '../../utils/shareUtils.js'
import './ShareButton.css'

const getMessageForStatus = (status, mode) => {
  if (status === 'cancelled' || status === 'shared') {
    return ''
  }

  if (status === 'copied') {
    if (mode === 'invite') {
      return 'Invite text copied.'
    }

    return mode === 'image'
      ? 'Sharing is not supported on this browser. The card text was copied instead.'
      : 'Share text copied.'
  }

  if (status === 'unsupported') {
    return 'Sharing is not supported on this browser.'
  }

  return 'Sharing is not supported on this browser. The card text was copied instead.'
}

function ShareButton({
  children = 'Share',
  fileName,
  imageUrl,
  mode = 'text',
  text,
  title,
  url,
  variant = 'subtle',
}) {
  const [message, setMessage] = useState('')

  const handleShare = async () => {
    const status =
      mode === 'image'
        ? await shareImage({ fileName, imageUrl, text, title })
        : mode === 'invite'
          ? await shareText({ text, title, url })
          : await shareAchievement({ text, title, url })
    const nextMessage = getMessageForStatus(status, mode)

    if (nextMessage) {
      setMessage(nextMessage)
      window.setTimeout(() => setMessage(''), 2800)
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

const isAbortError = (error) =>
  error?.name === 'AbortError' ||
  error?.name === 'NotAllowedError' ||
  error?.message?.toLowerCase().includes('cancel')

const getSharePayload = ({ text, title, url }) => {
  const payload = {
    title: title || '',
    text: text || '',
  }

  if (url) {
    payload.url = url
  }

  return payload
}

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return 'copied'
    }

    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textArea)

    return copied ? 'copied' : 'unsupported'
  } catch {
    return 'failed'
  }
}

export const shareText = async ({ text, title, url }) => {
  const fallbackText = [text, url].filter(Boolean).join(' ')

  try {
    if (navigator.share) {
      await navigator.share(getSharePayload({ text, title, url }))
      return 'shared'
    }
  } catch (shareError) {
    if (isAbortError(shareError)) {
      return 'cancelled'
    }
  }

  const copyStatus = await copyToClipboard(fallbackText || title || '')

  return copyStatus === 'copied' ? 'copied' : 'unsupported'
}

const getSafeFileName = (fileName = 'fan-archive-card.png') =>
  fileName
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'fan-archive-card.png'

export const shareImage = async ({ fileName, imageUrl, text, title }) => {
  const fallbackText = [text, imageUrl].filter(Boolean).join(' ')

  if (imageUrl) {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], getSafeFileName(fileName), {
        type: blob.type || 'image/png',
      })

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          title,
          text,
          files: [file],
        })
        return 'shared'
      }
    } catch (shareError) {
      if (isAbortError(shareError)) {
        return 'cancelled'
      }
    }
  }

  const textShareStatus = await shareText({ title, text, url: imageUrl })

  if (textShareStatus === 'shared' || textShareStatus === 'cancelled') {
    return textShareStatus
  }

  const copyStatus = await copyToClipboard(fallbackText || title || '')

  return copyStatus === 'copied' ? 'copied' : 'unsupported'
}

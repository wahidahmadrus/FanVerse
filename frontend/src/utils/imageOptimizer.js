const DEFAULT_FULL_MAX_WIDTH = 1200
const DEFAULT_THUMBNAIL_MAX_WIDTH = 400
const DEFAULT_WEBP_QUALITY = 0.82
const DEFAULT_THUMBNAIL_QUALITY = 0.78

const getFileBaseName = (fileName = 'image') =>
  fileName.replace(/\.[^/.]+$/, '') || 'image'

const getExtensionForType = (mimeType) => {
  if (mimeType === 'image/webp') {
    return 'webp'
  }

  if (mimeType === 'image/png') {
    return 'png'
  }

  return 'jpg'
}

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error('The selected image could not be loaded.'))
    }

    image.src = imageUrl
  })

const canvasToBlob = ({ canvas, quality, type }) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('The selected image could not be optimized.'))
          return
        }

        resolve(blob)
      },
      type,
      quality,
    )
  })

const getTargetSize = ({ height, maxWidth, width }) => {
  const safeMaxWidth =
    Number.isFinite(maxWidth) && maxWidth > 0 ? maxWidth : width
  const scale = Math.min(1, safeMaxWidth / width)

  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  }
}

const createOptimizedFile = ({ blob, originalFile, suffix }) => {
  const extension = getExtensionForType(blob.type)
  const baseName = getFileBaseName(originalFile.name)

  return new File([blob], `${baseName}-${suffix}.${extension}`, {
    lastModified: Date.now(),
    type: blob.type,
  })
}

export const resizeImage = async (
  file,
  maxWidth = DEFAULT_FULL_MAX_WIDTH,
  quality = DEFAULT_WEBP_QUALITY,
  suffix = 'optimized',
) => {
  if (!file) {
    return null
  }

  const image = await loadImageFromFile(file)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const targetSize = getTargetSize({
    height: sourceHeight,
    maxWidth,
    width: sourceWidth,
  })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Image optimization is not available in this browser.')
  }

  canvas.width = targetSize.width
  canvas.height = targetSize.height
  context.drawImage(image, 0, 0, targetSize.width, targetSize.height)

  let blob = await canvasToBlob({
    canvas,
    quality,
    type: 'image/webp',
  })

  if (blob.type !== 'image/webp') {
    blob = await canvasToBlob({
      canvas,
      quality,
      type: file.type || 'image/jpeg',
    })
  }

  return createOptimizedFile({
    blob,
    originalFile: file,
    suffix,
  })
}

export const convertToWebP = (file, quality = DEFAULT_WEBP_QUALITY) =>
  resizeImage(file, Number.POSITIVE_INFINITY, quality, 'webp')

export const createThumbnail = (file, quality = DEFAULT_THUMBNAIL_QUALITY) =>
  resizeImage(file, DEFAULT_THUMBNAIL_MAX_WIDTH, quality, 'thumbnail')

export const createOptimizedCollectibleImages = async (file) => {
  const [fullImage, thumbnailImage] = await Promise.all([
    resizeImage(file, DEFAULT_FULL_MAX_WIDTH, DEFAULT_WEBP_QUALITY, 'full'),
    createThumbnail(file),
  ])

  return {
    fullImage,
    thumbnailImage,
  }
}

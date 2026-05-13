import { requireSupabase } from './supabaseClient.js'
import { createOptimizedCollectibleImages } from '../utils/imageOptimizer.js'

export const STORAGE_BUCKETS = {
  memoryProofs: 'memory-proofs',
  avatars: 'avatars',
  artistImages: 'artist-images',
  characterImages: 'character-images',
  collectibleCards: 'collectible-cards',
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_COLLECTIBLE_SOURCE_IMAGE_SIZE = 15 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const getFileExtension = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension || 'jpg'
}

export const validateImageFile = (
  file,
  { maxSize = MAX_IMAGE_SIZE, maxSizeLabel = '5MB' } = {},
) => {
  if (!file) {
    return
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Upload a JPG, PNG, or WEBP image.')
  }

  if (file.size > maxSize) {
    throw new Error(`Image uploads can be up to ${maxSizeLabel}.`)
  }
}

export const validateCollectibleImageFile = (file) =>
  validateImageFile(file, {
    maxSize: MAX_COLLECTIBLE_SOURCE_IMAGE_SIZE,
    maxSizeLabel: '15MB before optimization',
  })

export const uploadImage = async ({
  bucket,
  cacheControl = '3600',
  file,
  folder = 'uploads',
}) => {
  validateImageFile(file)

  if (!file) {
    return ''
  }

  const client = requireSupabase()
  const extension = getFileExtension(file)
  const filePath = `${folder}/${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from(bucket).upload(filePath, file, {
    cacheControl,
    upsert: false,
  })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(filePath)

  return publicUrl
}

export const uploadOptimizedCollectibleImages = async ({ file, folder = 'cards' }) => {
  validateCollectibleImageFile(file)

  if (!file) {
    return {
      imageUrl: '',
      thumbnailUrl: '',
    }
  }

  const { fullImage, thumbnailImage } = await createOptimizedCollectibleImages(file)
  const [imageUrl, thumbnailUrl] = await Promise.all([
    uploadImage({
      bucket: STORAGE_BUCKETS.collectibleCards,
      cacheControl: '31536000',
      file: fullImage,
      folder: `${folder}/full`,
    }),
    uploadImage({
      bucket: STORAGE_BUCKETS.collectibleCards,
      cacheControl: '31536000',
      file: thumbnailImage,
      folder: `${folder}/thumbnails`,
    }),
  ])

  return {
    imageUrl,
    thumbnailUrl,
  }
}

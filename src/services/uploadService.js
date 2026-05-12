import { requireSupabase } from './supabaseClient.js'

export const STORAGE_BUCKETS = {
  memoryProofs: 'memory-proofs',
  avatars: 'avatars',
  artistImages: 'artist-images',
  collectibleCards: 'collectible-cards',
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const getFileExtension = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension || 'jpg'
}

export const validateImageFile = (file) => {
  if (!file) {
    return
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Upload a JPG, PNG, or WEBP image.')
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image uploads can be up to 5MB.')
  }
}

export const uploadImage = async ({ bucket, file, folder = 'uploads' }) => {
  validateImageFile(file)

  if (!file) {
    return ''
  }

  const client = requireSupabase()
  const extension = getFileExtension(file)
  const filePath = `${folder}/${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
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

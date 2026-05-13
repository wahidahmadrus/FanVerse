import {
  archiveCharacters,
  getArchiveCharacterById,
} from '../data/archiveCharacters.js'
import { requireSupabase, supabase } from './supabaseClient.js'

const isMissingCharactersTableError = (error) =>
  error?.code === '42P01' ||
  error?.code === '42703' ||
  error?.message?.toLowerCase().includes('characters') ||
  error?.message?.toLowerCase().includes('schema cache') ||
  error?.message?.toLowerCase().includes('relation')

const slugifyCharacterId = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getStorageImageUrl = (imageValue) => {
  if (!imageValue) {
    return ''
  }

  if (
    /^https?:\/\//i.test(imageValue) ||
    imageValue.startsWith('/') ||
    imageValue.startsWith('data:image/') ||
    !supabase
  ) {
    return imageValue
  }

  const storagePath = imageValue.startsWith('character-images/')
    ? imageValue.replace('character-images/', '')
    : imageValue
  const {
    data: { publicUrl },
  } = supabase.storage.from('character-images').getPublicUrl(storagePath)

  return publicUrl
}

export const normalizeCharacter = (character = {}) => {
  const id = String(character.id || '').trim()
  const localCharacter =
    getArchiveCharacterById(id) ||
    archiveCharacters.find(
      (fallbackCharacter) =>
        fallbackCharacter.name.toLowerCase() ===
        String(character.name || '').trim().toLowerCase(),
    ) ||
    {}
  const imageUrl = getStorageImageUrl(
    character.image_url || character.imageUrl || localCharacter.imageUrl || '',
  )
  const title = character.title || localCharacter.fullTitle || localCharacter.title || ''
  const description =
    character.description ||
    localCharacter.shortDescription ||
    localCharacter.storyPreview ||
    ''

  return {
    ...localCharacter,
    ...character,
    id,
    name: character.name || localCharacter.name || 'Archive Character',
    title,
    fullTitle: title || character.name || localCharacter.name || 'Archive Character',
    gender: character.gender || localCharacter.gender || '',
    quote: character.quote || localCharacter.quote || '',
    shortDescription: description,
    storyPreview:
      character.description || localCharacter.storyPreview || description,
    emotionalMeaning:
      character.description ||
      localCharacter.emotionalMeaning ||
      'A Premium Character Fragment from Archive Zero.',
    image_url: imageUrl,
    imageUrl,
    cardImageUrl: imageUrl || localCharacter.cardImageUrl || '',
    coverImageUrl: imageUrl || localCharacter.coverImageUrl || '',
    personalityTags: localCharacter.personalityTags || [],
    role: localCharacter.role || title || 'Archive Zero character',
    themeColor: character.theme_color || localCharacter.themeColor || 'purple-blue',
    theme_color: character.theme_color || localCharacter.themeColor || 'purple-blue',
    rarityType: localCharacter.rarityType || 'Premium Character Fragment',
    is_active: character.is_active !== false,
  }
}

const getCharacters = async ({ includeInactive = false } = {}) => {
  const client = requireSupabase()
  let query = client
    .from('characters')
    .select('*')
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingCharactersTableError(error)) {
      return archiveCharacters.map(normalizeCharacter)
    }

    throw error
  }

  return (data || []).map(normalizeCharacter)
}

export const getActiveCharacters = () => getCharacters({ includeInactive: false })

export const getAdminCharacters = () => getCharacters({ includeInactive: true })

export const getCharacterById = async (characterId) => {
  if (!characterId) {
    return null
  }

  const client = requireSupabase()
  const { data, error } = await client
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .maybeSingle()

  if (error) {
    if (isMissingCharactersTableError(error)) {
      const localCharacter = getArchiveCharacterById(characterId)
      return localCharacter ? normalizeCharacter(localCharacter) : null
    }

    throw error
  }

  return data ? normalizeCharacter(data) : null
}

export const createCharacter = async (character) => {
  const client = requireSupabase()
  const id = slugifyCharacterId(character.name || '')

  if (!id) {
    throw new Error('Add a character name before saving.')
  }

  const { data, error } = await client
    .from('characters')
    .insert({
      id,
      name: character.name.trim(),
      title: character.title?.trim() || '',
      description: character.description?.trim() || '',
      quote: character.quote?.trim() || '',
      gender: character.gender?.trim() || '',
      image_url: character.image_url || null,
      theme_color: character.theme_color?.trim() || 'purple-blue',
      is_active: character.is_active !== false,
    })
    .select()
    .single()

  if (error?.code === '23505') {
    throw new Error('A character with this name already exists.')
  }

  if (error) {
    throw error
  }

  return normalizeCharacter(data)
}

export const updateCharacter = async ({ characterId, updates }) => {
  const client = requireSupabase()
  const payload = {
    name: updates.name?.trim() || 'Archive Character',
    title: updates.title?.trim() || '',
    description: updates.description?.trim() || '',
    quote: updates.quote?.trim() || '',
    gender: updates.gender?.trim() || '',
    image_url: updates.image_url || null,
    theme_color: updates.theme_color?.trim() || 'purple-blue',
    is_active: updates.is_active !== false,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client
    .from('characters')
    .update(payload)
    .eq('id', characterId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return normalizeCharacter(data)
}

export const deleteCharacter = async (characterId) => {
  const client = requireSupabase()
  const { error } = await client.from('characters').delete().eq('id', characterId)

  if (error) {
    throw error
  }
}

export const getCharacterName = (characters, characterId) =>
  characters.find((character) => character.id === characterId)?.name ||
  getArchiveCharacterById(characterId)?.name ||
  'No character'

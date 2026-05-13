import { requireSupabase } from './supabaseClient.js'

const isMissingStoryFragmentTableError = (error) =>
  error?.code === '42P01' ||
  error?.code === '42703' ||
  error?.message?.toLowerCase().includes('character_story_fragments') ||
  error?.message?.toLowerCase().includes('schema cache') ||
  error?.message?.toLowerCase().includes('relation')

export const unlockRuleOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Chosen Character', value: 'chosen_character' },
  { label: 'Premium Fragment', value: 'premium_fragment' },
  { label: 'Locked', value: 'locked' },
]

export const normalizeStoryFragment = (fragment) => ({
  ...fragment,
  character_id: fragment.character_id || '',
  title: fragment.title || 'Untitled Fragment',
  content: fragment.content || '',
  fragment_order: Number(fragment.fragment_order || 1),
  required_memories: Math.max(0, Number(fragment.required_memories || 0)),
  unlock_rule: fragment.unlock_rule || 'locked',
  is_active: fragment.is_active !== false,
})

const getStoryFragments = async ({ includeInactive = false } = {}) => {
  const client = requireSupabase()
  let query = client
    .from('character_story_fragments')
    .select('*')
    .order('character_id', { ascending: true })
    .order('fragment_order', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingStoryFragmentTableError(error)) {
      return []
    }

    throw error
  }

  return (data || []).map(normalizeStoryFragment)
}

export const getActiveCharacterStoryFragments = () =>
  getStoryFragments({ includeInactive: false })

export const getAdminCharacterStoryFragments = () =>
  getStoryFragments({ includeInactive: true })

export const createCharacterStoryFragment = async (fragment) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('character_story_fragments')
    .insert(fragment)
    .select()
    .single()

  if (error) {
    throw error
  }

  return normalizeStoryFragment(data)
}

export const updateCharacterStoryFragment = async ({ fragmentId, updates }) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('character_story_fragments')
    .update(updates)
    .eq('id', fragmentId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return normalizeStoryFragment(data)
}

export const deleteCharacterStoryFragment = async (fragmentId) => {
  const client = requireSupabase()
  const { error } = await client
    .from('character_story_fragments')
    .delete()
    .eq('id', fragmentId)

  if (error) {
    throw error
  }
}

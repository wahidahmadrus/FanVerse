import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import {
  getAdminCharacters,
  getCharacterName,
} from '../../services/characterService.js'
import {
  createCharacterStoryFragment,
  deleteCharacterStoryFragment,
  getAdminCharacterStoryFragments,
  updateCharacterStoryFragment,
} from '../../services/storyFragmentService.js'
import './AdminStoriesPage.css'

const emptyForm = {
  character_id: '',
  title: '',
  content: '',
  fragment_order: '1',
  required_memories: '0',
  is_active: true,
}

const getEmptyFormForCharacters = (characters = []) => ({
  ...emptyForm,
  character_id:
    characters.find((character) => character.is_active !== false)?.id || '',
})

function AdminStoriesPage() {
  const [fragments, setFragments] = useState([])
  const [characters, setCharacters] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const formRef = useRef(null)

  const loadFragments = async () => {
    try {
      setLoading(true)
      setError('')
      const [nextFragments, nextCharacters] = await Promise.all([
        getAdminCharacterStoryFragments(),
        getAdminCharacters(),
      ])
      setFragments(nextFragments)
      setCharacters(nextCharacters)
      setFormData((currentData) =>
        editingId ? currentData : getEmptyFormForCharacters(nextCharacters),
      )
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialFragments = async () => {
      try {
        const [nextFragments, nextCharacters] = await Promise.all([
          getAdminCharacterStoryFragments(),
          getAdminCharacters(),
        ])

        if (!cancelled) {
          setFragments(nextFragments)
          setCharacters(nextCharacters)
          setFormData(getEmptyFormForCharacters(nextCharacters))
          setError('')
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialFragments()

    return () => {
      cancelled = true
    }
  }, [])

  const charactersById = useMemo(
    () => new Map(characters.map((character) => [character.id, character])),
    [characters],
  )
  const activeCharacters = useMemo(
    () => characters.filter((character) => character.is_active !== false),
    [characters],
  )
  const characterOptions = useMemo(() => {
    const selectedCharacter = charactersById.get(formData.character_id)

    if (
      !selectedCharacter ||
      activeCharacters.some((character) => character.id === selectedCharacter.id)
    ) {
      return activeCharacters
    }

    return [selectedCharacter, ...activeCharacters]
  }, [activeCharacters, charactersById, formData.character_id])
  const characterFilters = useMemo(
    () => ['All', ...characters.map((character) => character.id)],
    [characters],
  )

  const filteredFragments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return fragments.filter((fragment) => {
      const character = charactersById.get(fragment.character_id)
      const searchMatches =
        !query ||
        [
          fragment.title,
          fragment.content,
          fragment.required_memories,
          character?.name,
          character?.fullTitle,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      const characterMatches =
        selectedCharacter === 'All' || fragment.character_id === selectedCharacter

      return searchMatches && characterMatches
    })
  }, [charactersById, fragments, search, selectedCharacter])

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setEditingId('')
    setFormData(getEmptyFormForCharacters(activeCharacters))
  }

  const handleEdit = (fragment) => {
    setEditingId(fragment.id)
    setFormData({
      character_id: fragment.character_id,
      title: fragment.title,
      content: fragment.content,
      fragment_order: String(fragment.fragment_order || 1),
      required_memories: String(fragment.required_memories || 0),
      is_active: fragment.is_active !== false,
    })
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Add a fragment title and story content.')
      return
    }

    if (!formData.character_id) {
      setError('Choose a character before saving this story fragment.')
      return
    }

    try {
      setSaving(true)
      const requiredMemories = Math.max(
        0,
        Number(formData.required_memories) || 0,
      )
      const payload = {
        character_id: formData.character_id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        fragment_order: Number(formData.fragment_order) || 1,
        required_memories: requiredMemories,
        unlock_rule: requiredMemories === 0 ? 'default' : 'locked',
        is_active: formData.is_active,
      }

      if (editingId) {
        const updatedFragment = await updateCharacterStoryFragment({
          fragmentId: editingId,
          updates: payload,
        })
        setFragments((currentFragments) =>
          currentFragments.map((fragment) =>
            fragment.id === editingId ? updatedFragment : fragment,
          ),
        )
        setMessage('Story fragment updated.')
      } else {
        const createdFragment = await createCharacterStoryFragment(payload)
        setFragments((currentFragments) => [...currentFragments, createdFragment])
        setMessage('Story fragment created.')
      }

      resetForm()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (fragment) => {
    const confirmed = window.confirm(`Delete "${fragment.title}"?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteCharacterStoryFragment(fragment.id)
      setFragments((currentFragments) =>
        currentFragments.filter((currentFragment) => currentFragment.id !== fragment.id),
      )
      setMessage('Story fragment deleted.')
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  if (loading) {
    return <LoadingState label="Loading character story admin" />
  }

  return (
    <div className="page-shell wide-container admin-stories-page">
      <section className="admin-stories-page__header">
        <div className="section-heading">
          <p className="section-kicker">Admin</p>
          <h1>Manage Premium Story Fragments</h1>
          <p>
            Add, edit, reorder, and retire Archive Zero fragments for any
            active character.
          </p>
        </div>
        <div className="actions">
          <Button onClick={loadFragments} type="button" variant="secondary">
            Refresh
          </Button>
          <Button to="/admin/characters" variant="ghost">
            Manage Characters
          </Button>
          <Button to="/admin" variant="ghost">
            Admin Dashboard
          </Button>
        </div>
      </section>

      <FormMessage type="success">{message}</FormMessage>
      <FormMessage type="error">{error}</FormMessage>

      <section className="admin-stories-page__layout">
        <form
          className="admin-stories-page__form glass-panel"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <h2>{editingId ? 'Edit Fragment' : 'Add Fragment'}</h2>
          <div className="admin-stories-page__grid">
            <label>
              <span>Character</span>
              <select
                name="character_id"
                onChange={handleChange}
                value={formData.character_id}
              >
                {characterOptions.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
              {activeCharacters.length === 0 && (
                <small className="admin-stories-page__field-note">
                  No characters found. Create a character first.
                  <Button to="/admin/characters" variant="ghost">
                    Create Character
                  </Button>
                </small>
              )}
            </label>
            <label>
              <span>Fragment order</span>
              <input
                min="1"
                name="fragment_order"
                onChange={handleChange}
                type="number"
                value={formData.fragment_order}
              />
            </label>
            <label>
              <span>Required memories</span>
              <input
                min="0"
                name="required_memories"
                onChange={handleChange}
                type="number"
                value={formData.required_memories}
              />
            </label>
          </div>
          <label>
            <span>Fragment title</span>
            <input name="title" onChange={handleChange} value={formData.title} />
          </label>
          <label>
            <span>Story content</span>
            <textarea
              name="content"
              onChange={handleChange}
              rows="8"
              value={formData.content}
            ></textarea>
          </label>
          <label className="admin-stories-page__toggle">
            <input
              checked={formData.is_active}
              name="is_active"
              onChange={handleChange}
              type="checkbox"
            />
            <span>Active fragment</span>
          </label>
          <div className="actions">
            <Button disabled={saving} type="submit">
              {saving ? 'Saving...' : editingId ? 'Save Fragment' : 'Create Fragment'}
            </Button>
            {editingId && (
              <Button onClick={resetForm} type="button" variant="secondary">
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="admin-stories-page__list">
          <div className="admin-stories-page__filters glass-panel">
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search fragments by title or content..."
              type="search"
              value={search}
            />
            <select
              onChange={(event) => setSelectedCharacter(event.target.value)}
              value={selectedCharacter}
            >
              {characterFilters.map((characterId) => (
                <option key={characterId} value={characterId}>
                  {characterId === 'All'
                    ? 'All characters'
                    : getCharacterName(characters, characterId)}
                </option>
              ))}
            </select>
          </div>

          {filteredFragments.length > 0 ? (
            <div className="admin-stories-page__items">
              {filteredFragments.map((fragment) => {
                return (
                  <article className="admin-stories-page__item" key={fragment.id}>
                    <div>
                      <h3>{fragment.title}</h3>
                      <p className="admin-stories-page__meta">
                        {getCharacterName(characters, fragment.character_id)} / Order{' '}
                        {fragment.fragment_order} / Requires{' '}
                        {fragment.required_memories || 0} memories /{' '}
                        {fragment.is_active ? 'Active' : 'Inactive'}
                      </p>
                      <p>{fragment.content}</p>
                    </div>
                    <div className="admin-stories-page__actions">
                      <Button
                        onClick={() => handleEdit(fragment)}
                        type="button"
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(fragment)}
                        type="button"
                        variant="ghost"
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState
              description="Create fragments here, or the app will keep using the local fallback stories."
              title="No story fragments found"
            />
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminStoriesPage

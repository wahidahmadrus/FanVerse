import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { archiveCharacters, getArchiveCharacterById } from '../../data/archiveCharacters.js'
import {
  createCharacterStoryFragment,
  deleteCharacterStoryFragment,
  getAdminCharacterStoryFragments,
  unlockRuleOptions,
  updateCharacterStoryFragment,
} from '../../services/storyFragmentService.js'
import './AdminStoriesPage.css'

const characterFilters = ['All', ...archiveCharacters.map((character) => character.id)]
const unlockRuleFilters = ['All', ...unlockRuleOptions.map((option) => option.value)]

const emptyForm = {
  character_id: 'en',
  title: '',
  content: '',
  fragment_order: '1',
  unlock_rule: 'default',
  is_active: true,
}

function AdminStoriesPage() {
  const [fragments, setFragments] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState('All')
  const [selectedUnlockRule, setSelectedUnlockRule] = useState('All')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const formRef = useRef(null)

  const loadFragments = async () => {
    try {
      setLoading(true)
      setError('')
      setFragments(await getAdminCharacterStoryFragments())
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
        const nextFragments = await getAdminCharacterStoryFragments()

        if (!cancelled) {
          setFragments(nextFragments)
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

  const filteredFragments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return fragments.filter((fragment) => {
      const character = getArchiveCharacterById(fragment.character_id)
      const searchMatches =
        !query ||
        [
          fragment.title,
          fragment.content,
          fragment.unlock_rule,
          character?.name,
          character?.fullTitle,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      const characterMatches =
        selectedCharacter === 'All' || fragment.character_id === selectedCharacter
      const unlockRuleMatches =
        selectedUnlockRule === 'All' || fragment.unlock_rule === selectedUnlockRule

      return searchMatches && characterMatches && unlockRuleMatches
    })
  }, [fragments, search, selectedCharacter, selectedUnlockRule])

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setEditingId('')
    setFormData(emptyForm)
  }

  const handleEdit = (fragment) => {
    setEditingId(fragment.id)
    setFormData({
      character_id: fragment.character_id,
      title: fragment.title,
      content: fragment.content,
      fragment_order: String(fragment.fragment_order || 1),
      unlock_rule: fragment.unlock_rule || 'locked',
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

    try {
      setSaving(true)
      const payload = {
        character_id: formData.character_id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        fragment_order: Number(formData.fragment_order) || 1,
        unlock_rule: formData.unlock_rule,
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
    <div className="page-shell admin-stories-page">
      <section className="admin-stories-page__header">
        <div className="section-heading">
          <p className="section-kicker">Admin</p>
          <h1>Manage Premium Story Fragments</h1>
          <p>
            Add, edit, reorder, and retire Archive Zero fragments for En, Uan,
            On, and Yal.
          </p>
        </div>
        <div className="actions">
          <Button onClick={loadFragments} type="button" variant="secondary">
            Refresh
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
                {archiveCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
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
          <label>
            <span>Unlock rule</span>
            <select
              name="unlock_rule"
              onChange={handleChange}
              value={formData.unlock_rule}
            >
              {unlockRuleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
                    : getArchiveCharacterById(characterId)?.name}
                </option>
              ))}
            </select>
            <select
              onChange={(event) => setSelectedUnlockRule(event.target.value)}
              value={selectedUnlockRule}
            >
              {unlockRuleFilters.map((unlockRule) => (
                <option key={unlockRule} value={unlockRule}>
                  {unlockRule === 'All'
                    ? 'All unlock rules'
                    : unlockRule.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {filteredFragments.length > 0 ? (
            <div className="admin-stories-page__items">
              {filteredFragments.map((fragment) => {
                const character = getArchiveCharacterById(fragment.character_id)

                return (
                  <article className="admin-stories-page__item" key={fragment.id}>
                    <div>
                      <h3>{fragment.title}</h3>
                      <p className="admin-stories-page__meta">
                        {character?.name || fragment.character_id} / Order{' '}
                        {fragment.fragment_order} /{' '}
                        {fragment.unlock_rule.replaceAll('_', ' ')} /{' '}
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

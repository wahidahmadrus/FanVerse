import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import {
  createCharacter,
  deleteCharacter,
  getAdminCharacters,
  updateCharacter,
} from '../../services/characterService.js'
import {
  STORAGE_BUCKETS,
  uploadImage,
  validateImageFile,
} from '../../services/uploadService.js'
import './AdminCharactersPage.css'

const activeFilters = ['All', 'Active', 'Inactive']

const emptyForm = {
  name: '',
  title: '',
  description: '',
  quote: '',
  gender: '',
  image_url: '',
  theme_color: 'purple-blue',
  is_active: true,
}

function AdminCharactersPage() {
  const [characters, setCharacters] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedActive, setSelectedActive] = useState('All')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const formRef = useRef(null)

  const loadCharacters = async () => {
    try {
      setLoading(true)
      setError('')
      setCharacters(await getAdminCharacters())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialCharacters = async () => {
      try {
        const nextCharacters = await getAdminCharacters()

        if (!cancelled) {
          setCharacters(nextCharacters)
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

    loadInitialCharacters()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase()

    return characters.filter((character) => {
      const searchMatches =
        !query ||
        [
          character.name,
          character.title,
          character.description,
          character.quote,
          character.gender,
          character.theme_color,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      const activeMatches =
        selectedActive === 'All' ||
        (selectedActive === 'Active' ? character.is_active : !character.is_active)

      return searchMatches && activeMatches
    })
  }, [characters, search, selectedActive])

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (name === 'image_url' && !imageFile) {
      setImagePreview(value.trim())
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      setImageFile(null)
      setImagePreview(formData.image_url)
      return
    }

    try {
      validateImageFile(file)
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    } catch (fileError) {
      setImageFile(null)
      setImagePreview('')
      setError(fileError.message)
    }
  }

  const resetForm = () => {
    setEditingId('')
    setFormData(emptyForm)
    setImageFile(null)
    setImagePreview('')
  }

  const handleEdit = (character) => {
    setEditingId(character.id)
    setFormData({
      name: character.name || '',
      title: character.title || character.fullTitle || '',
      description: character.description || character.shortDescription || '',
      quote: character.quote || '',
      gender: character.gender || '',
      image_url: character.image_url || character.imageUrl || '',
      theme_color: character.theme_color || character.themeColor || 'purple-blue',
      is_active: character.is_active !== false,
    })
    setImagePreview(character.image_url || character.imageUrl || '')
    setImageFile(null)
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      formRef.current?.classList.add('admin-characters-page__form--highlight')
      window.setTimeout(() => {
        formRef.current?.classList.remove('admin-characters-page__form--highlight')
      }, 1100)
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!formData.name.trim() || !formData.title.trim()) {
      setError('Add a character name and title.')
      return
    }

    try {
      setSaving(true)
      const imageUrl = imageFile
        ? await uploadImage({
            bucket: STORAGE_BUCKETS.characterImages,
            cacheControl: '31536000',
            file: imageFile,
            folder: 'characters',
          })
        : formData.image_url.trim()
      const payload = {
        ...formData,
        image_url: imageUrl,
      }

      if (editingId) {
        const updatedCharacter = await updateCharacter({
          characterId: editingId,
          updates: payload,
        })
        setCharacters((currentCharacters) =>
          currentCharacters.map((character) =>
            character.id === editingId ? updatedCharacter : character,
          ),
        )
        setMessage('Character updated.')
      } else {
        const createdCharacter = await createCharacter(payload)
        setCharacters((currentCharacters) => [createdCharacter, ...currentCharacters])
        setMessage('Character created.')
      }

      resetForm()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (character) => {
    try {
      setError('')
      setMessage('')
      const updatedCharacter = await updateCharacter({
        characterId: character.id,
        updates: {
          ...character,
          is_active: character.is_active === false,
        },
      })
      setCharacters((currentCharacters) =>
        currentCharacters.map((currentCharacter) =>
          currentCharacter.id === character.id ? updatedCharacter : currentCharacter,
        ),
      )
      setMessage(
        updatedCharacter.is_active
          ? `${updatedCharacter.name} is active.`
          : `${updatedCharacter.name} is inactive.`,
      )
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  const handleDelete = async (character) => {
    const confirmed = window.confirm(
      `Delete ${character.name}? Linked cards will lose this character link and related story fragments may be removed.`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteCharacter(character.id)
      setCharacters((currentCharacters) =>
        currentCharacters.filter(
          (currentCharacter) => currentCharacter.id !== character.id,
        ),
      )
      setMessage('Character deleted.')

      if (editingId === character.id) {
        resetForm()
      }
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  if (loading) {
    return <LoadingState label="Loading character admin" />
  }

  return (
    <div className="page-shell wide-container admin-characters-page">
      <section className="admin-characters-page__header">
        <div className="section-heading">
          <p className="section-kicker">Admin</p>
          <h1>Manage Characters</h1>
          <p>
            Create and maintain Archive Zero characters for premium fragment
            cards and story histories.
          </p>
        </div>
        <div className="actions">
          <Button onClick={loadCharacters} type="button" variant="secondary">
            Refresh
          </Button>
          <Button to="/admin/collectibles" variant="ghost">
            Manage Collectible Cards
          </Button>
          <Button to="/admin/stories" variant="ghost">
            Manage Stories
          </Button>
        </div>
      </section>

      <FormMessage type="success">{message}</FormMessage>
      <FormMessage type="error">{error}</FormMessage>

      <section className="admin-characters-page__layout">
        <form
          className="admin-characters-page__form glass-panel"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <h2>{editingId ? 'Edit Character' : 'Add Character'}</h2>
          <div className="admin-characters-page__grid">
            <label>
              <span>Character name</span>
              <input name="name" onChange={handleChange} value={formData.name} />
            </label>
            <label>
              <span>Character title</span>
              <input name="title" onChange={handleChange} value={formData.title} />
            </label>
          </div>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              onChange={handleChange}
              rows="4"
              value={formData.description}
            ></textarea>
          </label>
          <label>
            <span>Quote optional</span>
            <input name="quote" onChange={handleChange} value={formData.quote} />
          </label>
          <div className="admin-characters-page__grid">
            <label>
              <span>Gender optional</span>
              <input name="gender" onChange={handleChange} value={formData.gender} />
            </label>
            <label>
              <span>Theme color optional</span>
              <input
                name="theme_color"
                onChange={handleChange}
                placeholder="purple-blue"
                value={formData.theme_color}
              />
            </label>
          </div>
          <label>
            <span>Character image URL optional</span>
            <input
              name="image_url"
              onChange={handleChange}
              placeholder="https://... or /images/character.png"
              value={formData.image_url}
            />
          </label>
          <label>
            <span>Character image upload optional</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              type="file"
            />
          </label>

          {imagePreview && (
            <div className="admin-characters-page__preview-frame">
              <img
                alt="Character preview"
                className="admin-characters-page__preview"
                onError={() => setError('The character image preview could not load.')}
                src={imagePreview}
              />
            </div>
          )}

          <label className="admin-characters-page__toggle">
            <input
              checked={formData.is_active}
              name="is_active"
              onChange={handleChange}
              type="checkbox"
            />
            <span>Active character</span>
          </label>
          <div className="actions">
            <Button disabled={saving} type="submit">
              {saving ? 'Saving...' : editingId ? 'Save Character' : 'Create Character'}
            </Button>
            {editingId && (
              <Button onClick={resetForm} type="button" variant="secondary">
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="admin-characters-page__list">
          <div className="admin-characters-page__filters glass-panel">
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search characters..."
              type="search"
              value={search}
            />
            <select
              onChange={(event) => setSelectedActive(event.target.value)}
              value={selectedActive}
            >
              {activeFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </div>

          {filteredCharacters.length > 0 ? (
            <div className="admin-characters-page__items">
              {filteredCharacters.map((character) => (
                <article className="admin-characters-page__item" key={character.id}>
                  <div
                    className={
                      character.imageUrl
                        ? 'admin-characters-page__portrait admin-characters-page__portrait--image'
                        : 'admin-characters-page__portrait'
                    }
                  >
                    {character.imageUrl ? (
                      <img alt={`${character.name} character`} src={character.imageUrl} />
                    ) : (
                      <span>{character.name}</span>
                    )}
                  </div>
                  <div className="admin-characters-page__item-body">
                    <h3>{character.name}</h3>
                    <p className="admin-characters-page__meta">
                      {character.title || 'No title'} /{' '}
                      {character.is_active ? 'Active' : 'Inactive'} / {character.id}
                    </p>
                    <p>{character.description || 'No description yet.'}</p>
                    {character.quote && <blockquote>{character.quote}</blockquote>}
                    <div className="admin-characters-page__actions">
                      <Button
                        onClick={() => handleEdit(character)}
                        type="button"
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(character)}
                        type="button"
                        variant="ghost"
                      >
                        {character.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                      <Button
                        onClick={() => handleDelete(character)}
                        type="button"
                        variant="ghost"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Create a character to link premium fragment cards and story histories."
              title="No characters found"
            />
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminCharactersPage

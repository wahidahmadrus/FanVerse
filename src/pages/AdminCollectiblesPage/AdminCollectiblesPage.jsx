import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import { archiveCharacters, getArchiveCharacterById } from '../../data/archiveCharacters.js'
import {
  createCollectibleCard,
  deleteCollectibleCard,
  getAdminCollectibleCards,
  getCollectibleImageUrl,
  updateCollectibleCard,
} from '../../services/collectibleService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
import './AdminCollectiblesPage.css'

const rarityOptions = ['Common', 'Rare', 'Epic', 'Legendary', 'Monthly Special']
const activeFilters = ['All', 'Active', 'Inactive']
const cardTypeOptions = [
  { label: 'Normal Reward', value: 'normal_reward' },
  { label: 'Achievement', value: 'achievement' },
  { label: 'Character Story', value: 'character_story' },
  { label: 'Monthly Premium', value: 'monthly_premium' },
]
const conditionOptions = [
  'first_archive_card',
  'first_memory',
  'total_memories',
  'total_stars',
  'proof_memories',
  'concert_memories',
  'fan_meet_memories',
  'fan_art_memories',
  'streaming_memories',
  'voting_memories',
  'social_support_memories',
  'merch_memories',
  'special_moment_memories',
  'monthly_active',
  'weekly_active',
  'artist_support_count',
  'same_artist_memories',
  'golden_memory',
  'cosmic_proof',
  'proof_special_moment',
  'detailed_memories',
]

const emptyForm = {
  title: '',
  description: '',
  rarity: 'Common',
  card_type: 'normal_reward',
  character_id: '',
  story_fragment: '',
  unlock_condition_type: 'first_memory',
  unlock_condition_value: '1',
  image_url: '',
  is_active: true,
}

const isValidImageReference = (imageValue) => {
  if (!imageValue.trim()) {
    return true
  }

  return (
    /^https?:\/\//i.test(imageValue) ||
    imageValue.startsWith('/') ||
    imageValue.startsWith('data:image/')
  )
}

function AdminCollectiblesPage() {
  const [cards, setCards] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('All')
  const [selectedActive, setSelectedActive] = useState('All')
  const [selectedCardType, setSelectedCardType] = useState('All')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const loadInitialCards = async () => {
      try {
        const cardRows = await getAdminCollectibleCards()

        if (!cancelled) {
          setCards(cardRows)
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

    loadInitialCards()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase()

    return cards.filter((card) => {
      const searchMatches =
        !query ||
        [
          card.title,
          card.description,
          card.rarity,
          card.unlock_condition_type,
          card.card_type,
          card.character_id,
          card.story_fragment,
          getArchiveCharacterById(card.character_id)?.name,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      const rarityMatches =
        selectedRarity === 'All' || card.rarity === selectedRarity
      const cardTypeMatches =
        selectedCardType === 'All' ||
        (card.card_type || 'normal_reward') === selectedCardType
      const activeMatches =
        selectedActive === 'All' ||
        (selectedActive === 'Active' ? card.is_active : !card.is_active)

      return searchMatches && rarityMatches && cardTypeMatches && activeMatches
    })
  }, [cards, search, selectedActive, selectedCardType, selectedRarity])

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

  const handleEdit = (card) => {
    const imageUrl = getCollectibleImageUrl(card)
    setEditingId(card.id)
    setFormData({
      title: card.title,
      description: card.description,
      rarity: card.rarity,
      card_type: card.card_type || 'normal_reward',
      character_id: card.character_id || '',
      story_fragment: card.story_fragment || '',
      unlock_condition_type: card.unlock_condition_type,
      unlock_condition_value: String(card.unlock_condition_value || 1),
      image_url: imageUrl,
      is_active: card.is_active,
    })
    setImagePreview(imageUrl)
    setImageFile(null)
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      formRef.current?.classList.add('admin-collectibles-page__form--highlight')
      window.setTimeout(() => {
        formRef.current?.classList.remove('admin-collectibles-page__form--highlight')
      }, 1100)
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Add a title and description for this collectible card.')
      return
    }

    if (!imageFile && !isValidImageReference(formData.image_url)) {
      setError('Use a full image URL, a root-relative path, or upload an image.')
      return
    }

    try {
      setSaving(true)
      const imageUrl = imageFile
        ? await uploadImage({
            bucket: STORAGE_BUCKETS.collectibleCards,
            file: imageFile,
            folder: 'cards',
          })
        : formData.image_url
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        rarity: formData.rarity,
        card_type: formData.card_type,
        character_id: formData.character_id || null,
        story_fragment: formData.story_fragment.trim() || null,
        unlock_condition_type: formData.unlock_condition_type,
        unlock_condition_value: Number(formData.unlock_condition_value) || 1,
        image_url: imageUrl || null,
        is_active: formData.is_active,
      }

      if (editingId) {
        const updatedCard = await updateCollectibleCard({
          cardId: editingId,
          updates: payload,
        })
        setCards((currentCards) =>
          currentCards.map((card) => (card.id === editingId ? updatedCard : card)),
        )
        setMessage('Collectible card updated.')
      } else {
        const createdCard = await createCollectibleCard(payload)
        setCards((currentCards) => [createdCard, ...currentCards])
        setMessage('Collectible card created.')
      }

      resetForm()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (card) => {
    const confirmed = window.confirm(`Delete "${card.title}"?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteCollectibleCard(card.id)
      setCards((currentCards) =>
        currentCards.filter((currentCard) => currentCard.id !== card.id),
      )
      setMessage('Collectible card deleted.')
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  if (loading) {
    return <LoadingState label="Loading collectible card admin" />
  }

  return (
    <div className="page-shell admin-collectibles-page">
      <section className="section-heading">
        <p className="section-kicker">Admin</p>
        <h1>Manage Collectible Cards</h1>
        <p>Create, edit, activate, and retire visual reward cards.</p>
      </section>

      <FormMessage type="success">{message}</FormMessage>
      <FormMessage type="error">{error}</FormMessage>

      <section className="admin-collectibles-page__layout">
        <form
          className="admin-collectibles-page__form glass-panel"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <h2>{editingId ? 'Edit Collectible Card' : 'Create Collectible Card'}</h2>

          <label>
            <span>Card title</span>
            <input name="title" onChange={handleChange} value={formData.title} />
          </label>

          <label>
            <span>Description</span>
            <textarea
              name="description"
              onChange={handleChange}
              rows="4"
              value={formData.description}
            ></textarea>
          </label>

          <div className="admin-collectibles-page__grid">
            <label>
              <span>Rarity</span>
              <select name="rarity" onChange={handleChange} value={formData.rarity}>
                {rarityOptions.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Card Type</span>
              <select
                name="card_type"
                onChange={handleChange}
                value={formData.card_type}
              >
                {cardTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-collectibles-page__grid">
            <label>
              <span>Linked Character</span>
              <select
                name="character_id"
                onChange={handleChange}
                value={formData.character_id}
              >
                <option value="">None</option>
                {archiveCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Condition value</span>
              <input
                min="1"
                name="unlock_condition_value"
                onChange={handleChange}
                type="number"
                value={formData.unlock_condition_value}
              />
            </label>
          </div>

          <label>
            <span>Story Fragment</span>
            <textarea
              name="story_fragment"
              onChange={handleChange}
              placeholder="Optional story text for character story or monthly premium cards."
              rows="4"
              value={formData.story_fragment}
            ></textarea>
          </label>

          <label>
            <span>Unlock condition</span>
            <select
              name="unlock_condition_type"
              onChange={handleChange}
              value={formData.unlock_condition_type}
            >
              {conditionOptions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Card image URL optional</span>
            <input
              name="image_url"
              onChange={handleChange}
              placeholder="https://... or /images/card.png"
              type="text"
              value={formData.image_url}
            />
          </label>

          <label>
            <span>Card image</span>
            <input accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} type="file" />
          </label>

          {imagePreview && (
            <div className="admin-collectibles-page__preview-frame">
              <img
                alt="Collectible preview"
                className="admin-collectibles-page__preview"
                onError={() => setError('The collectible image preview could not load.')}
                src={imagePreview}
              />
            </div>
          )}

          <label className="admin-collectibles-page__toggle">
            <input
              checked={formData.is_active}
              name="is_active"
              onChange={handleChange}
              type="checkbox"
            />
            <span>Active card</span>
          </label>

          <div className="actions">
            <Button disabled={saving} type="submit">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Card'}
            </Button>
            {editingId && (
              <Button onClick={resetForm} type="button" variant="secondary">
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="admin-collectibles-page__list">
          <div className="admin-collectibles-page__filters glass-panel">
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cards by title, rarity, condition..."
              type="search"
              value={search}
            />
            <select
              onChange={(event) => setSelectedRarity(event.target.value)}
              value={selectedRarity}
            >
              <option value="All">All rarity</option>
              {rarityOptions.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
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
            <select
              onChange={(event) => setSelectedCardType(event.target.value)}
              value={selectedCardType}
            >
              <option value="All">All types</option>
              {cardTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {filteredCards.map((card) => {
            const cardImageUrl = getCollectibleImageUrl(card)

            return (
              <article className="admin-collectibles-page__item" key={card.id}>
                <div className="admin-collectibles-page__item-image">
                  {cardImageUrl ? (
                    <img
                      alt={`${card.title} collectible preview`}
                      src={cardImageUrl}
                    />
                  ) : (
                    <div className="admin-collectibles-page__placeholder">
                      <span>No Image Yet</span>
                    </div>
                  )}
                </div>
                <div className="admin-collectibles-page__item-body">
                  <h3>{card.title}</h3>
                  <p className="admin-collectibles-page__item-meta">
                    {card.rarity} / {(card.card_type || 'normal_reward').replaceAll('_', ' ')} /{' '}
                    {getArchiveCharacterById(card.character_id)?.name || 'No character'} /{' '}
                    {card.is_active ? 'Active' : 'Inactive'}
                  </p>
                  <p>{card.description}</p>
                  {card.story_fragment && <p>{card.story_fragment}</p>}
                  <div className="admin-collectibles-page__card-actions">
                    <Button onClick={() => handleEdit(card)} type="button" variant="secondary">
                      Edit
                    </Button>
                    <Button onClick={() => handleDelete(card)} type="button" variant="ghost">
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AdminCollectiblesPage

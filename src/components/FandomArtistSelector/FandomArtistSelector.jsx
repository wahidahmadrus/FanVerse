import { useEffect, useState } from 'react'
import Button from '../Button/Button.jsx'
import FormMessage from '../FormMessage/FormMessage.jsx'
import { becomeFan, createArtist, getArtists } from '../../services/artistService.js'
import { STORAGE_BUCKETS, uploadImage, validateImageFile } from '../../services/uploadService.js'
import './FandomArtistSelector.css'

function FandomArtistSelector({
  autoFocus = false,
  className = '',
  defaultValue = '',
  onArtistSelected,
  onMessage,
  selectedArtist = null,
  userId,
}) {
  const [query, setQuery] = useState(selectedArtist?.name || defaultValue)
  const [suggestions, setSuggestions] = useState([])
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [lastSearchTerm, setLastSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedArtist?.name) {
      const timeoutId = window.setTimeout(() => setQuery(selectedArtist.name), 0)
      return () => window.clearTimeout(timeoutId)
    }

    return undefined
  }, [selectedArtist])

  useEffect(() => {
    let cancelled = false
    const searchTerm = query.trim()

    if (searchTerm.length < 2 || selectedArtist?.name === searchTerm) {
      return undefined
    }

    const loadSuggestions = async () => {
      try {
        setLoading(true)
        setError('')
        const artistRows = await getArtists({ search: searchTerm, limit: 6 })

        if (!cancelled) {
          setSuggestions(artistRows)
          setLastSearchTerm(searchTerm)
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

    const timeoutId = window.setTimeout(loadSuggestions, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [query, selectedArtist])

  const cleanQuery = query.trim()
  const canCreate =
    cleanQuery.length >= 2 &&
    selectedArtist?.name !== cleanQuery &&
    !loading &&
    lastSearchTerm === cleanQuery &&
    suggestions.length === 0

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      setImageFile(null)
      setImagePreview('')
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

  const handleSelectArtist = async (artist) => {
    if (!userId) {
      setError('Sign in before choosing your fandom.')
      return
    }

    try {
      setWorking(true)
      setError('')
      setSuccess('')
      await becomeFan({ artistId: artist.id, userId })
      setQuery(artist.name)
      setSuggestions([])
      await onArtistSelected?.(artist, {
        message: 'You joined this fandom archive.',
        status: 'joined',
      })
      setSuccess('You joined this fandom archive.')
      onMessage?.('You joined this fandom archive.')
    } catch (selectError) {
      setError(selectError.message)
    } finally {
      setWorking(false)
    }
  }

  const handleCreateArtist = async () => {
    const name = query.trim()

    if (!userId || !name) {
      return
    }

    try {
      setWorking(true)
      setError('')
      setSuccess('')
      const artist = await createArtist({
        userId,
        artist: {
          name,
          category: category.trim() || 'Fandom',
          description:
            description.trim() || `A fan archive for ${name}, built one memory at a time.`,
          imageUrl: imageFile
            ? await uploadImage({
                bucket: STORAGE_BUCKETS.artistImages,
                file: imageFile,
                folder: userId,
              })
            : '',
        },
      })
      setQuery(artist.name)
      setSuggestions([])
      setCategory('')
      setDescription('')
      setImageFile(null)
      setImagePreview('')
      await onArtistSelected?.(artist, {
        message: 'You are the first fan archiver for this fandom.',
        status: 'created',
      })
      setSuccess('You are the first fan archiver for this fandom.')
      onMessage?.('You are the first fan archiver for this fandom.')
    } catch (createError) {
      setError(createError.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className={`fandom-artist-selector ${className}`.trim()}>
      <label>
        <span>Main Fandom / Artist</span>
        <input
          autoFocus={autoFocus}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            setSuccess('')
            if (nextQuery.trim().length < 2) {
              setSuggestions([])
              setLastSearchTerm('')
            }
          }}
          placeholder="Choose your fandom"
          type="search"
          value={query}
        />
      </label>

      <FormMessage type="error">{error}</FormMessage>
      <FormMessage type="success">{success}</FormMessage>

      {selectedArtist && (
        <div className="fandom-artist-selector__selected">
          <span>Your fandom space</span>
          <strong>{selectedArtist.name}</strong>
          <small>{selectedArtist.category}</small>
        </div>
      )}

      {loading && <p className="fandom-artist-selector__hint">Searching the archive...</p>}

      {suggestions.length > 0 && (
        <div className="fandom-artist-selector__suggestions" role="listbox">
          {suggestions.map((artist) => (
            <button
              disabled={working}
              key={artist.id}
              onClick={() => handleSelectArtist(artist)}
              type="button"
            >
              <span className="fandom-artist-selector__avatar">
                {artist.image_url ? (
                  <img src={artist.image_url} alt="" />
                ) : (
                  artist.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <span>
                <strong>{artist.name}</strong>
                <small>{artist.category}</small>
              </span>
              <em>{artist.fanCount || 0} fans</em>
            </button>
          ))}
        </div>
      )}

      {canCreate && (
        <div className="fandom-artist-selector__create">
          <p>This fandom is not in the archive yet.</p>
          <div className="fandom-artist-selector__create-fields">
            <label>
              <span>Category optional</span>
              <input
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Solo artist, band, creator..."
                type="text"
                value={category}
              />
            </label>
            <label>
              <span>Description optional</span>
              <textarea
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short note for this fandom space."
                rows="3"
                value={description}
              ></textarea>
            </label>
            <label>
              <span>Image optional</span>
              <input
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                type="file"
              />
            </label>
            {imagePreview && (
              <img
                alt="New fandom preview"
                className="fandom-artist-selector__image-preview"
                src={imagePreview}
              />
            )}
          </div>
          <Button disabled={working} onClick={handleCreateArtist} type="button" variant="secondary">
            {working ? 'Creating...' : 'Create this Fandom'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default FandomArtistSelector

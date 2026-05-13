import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import {
  createBadgeAdmin,
  deleteArtistAdmin,
  deleteBadgeAdmin,
  deleteMemoryAdmin,
  deleteUserAdmin,
  getAdminDashboard,
  updateBadgeAdmin,
  updateMemoryAdmin,
  updateProfileAdmin,
} from '../../services/adminService.js'
import './AdminPage.css'

const panels = ['Overview', 'Users', 'Artists', 'Memories', 'Badges']
const panelRoutes = {
  Overview: '/admin',
  Users: '/admin/users',
  Artists: '/admin/artists',
  Memories: '/admin/memories',
  Badges: '/admin/badges',
}
const routePanels = Object.fromEntries(
  Object.entries(panelRoutes).map(([panel, route]) => [route, panel]),
)
const emptyBadgeForm = {
  id: '',
  title: '',
  description: '',
  icon: '',
  condition_type: '',
  condition_value: '1',
  glow: 'purple',
}
const proofFilters = ['All', 'Proof Added', 'Memory Only']
const visibilityFilters = ['All', 'public', 'private']
const badgeConditionExamples = [
  {
    type: 'first_memory',
    text: 'Unlocks when the user archives their first memory. Condition value can be 1 or left as 1.',
  },
  {
    type: 'total_memories',
    text: 'Unlocks when the user reaches a number of memories. Example value: 10.',
  },
  {
    type: 'total_stars',
    text: 'Unlocks when the user reaches a number of stars. Example value: 100.',
  },
  {
    type: 'proof_memories',
    text: 'Unlocks when the user adds proof to a number of memories. Example value: 5.',
  },
  {
    type: 'concert_memories',
    text: 'Unlocks when the user archives concert memories. Example value: 1.',
  },
  {
    type: 'fan_art_memories',
    text: 'Unlocks when the user archives fan art memories. Example value: 1.',
  },
  {
    type: 'streaming_memories',
    text: 'Unlocks when the user archives streaming memories. Example value: 5.',
  },
  {
    type: 'voting_memories',
    text: 'Unlocks when the user archives voting memories. Example value: 5.',
  },
]

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'Date not available'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function AdminMemoryModal({ memory, onClose }) {
  if (!memory) {
    return null
  }

  const hasProof = memory.has_proof || memory.hasProof || Boolean(memory.proof_image_url)
  const proofImage = memory.proofImageUrl || memory.proof_image_url

  return (
    <div className="admin-page__modal-overlay" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby={`admin-memory-${memory.id}`}
        aria-modal="true"
        className="admin-page__memory-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          className="admin-page__modal-close"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
        <div>
          <p className="section-kicker">Memory Details</p>
          <h2 id={`admin-memory-${memory.id}`}>{memory.title}</h2>
          <p>{memory.description}</p>
        </div>
        <dl className="admin-page__memory-details">
          <div>
            <dt>Artist</dt>
            <dd>{memory.artistName || memory.artist?.name || 'Unknown artist'}</dd>
          </div>
          <div>
            <dt>User</dt>
            <dd>
              {memory.authorName || memory.profile?.display_name || 'Fan explorer'}
              <span>{memory.authorEmail || memory.profile?.email || 'Email not available'}</span>
            </dd>
          </div>
          <div>
            <dt>Activity</dt>
            <dd>{memory.activity_type || memory.type || 'Memory'}</dd>
          </div>
          <div>
            <dt>Mood</dt>
            <dd>{memory.mood || 'Not set'}</dd>
          </div>
          <div>
            <dt>Base stars</dt>
            <dd>{memory.base_stars || memory.baseStars || memory.stars || 0}</dd>
          </div>
          <div>
            <dt>Final stars</dt>
            <dd>{memory.final_stars || memory.finalStars || memory.stars || 0}</dd>
          </div>
          <div>
            <dt>Proof</dt>
            <dd>{hasProof ? 'Proof Added' : 'Memory Only'}</dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>{memory.visibility}</dd>
          </div>
          <div>
            <dt>Memory date</dt>
            <dd>{formatDate(memory.memory_date || memory.date)}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(memory.created_at)}</dd>
          </div>
        </dl>
        {proofImage && (
          <div className="admin-page__proof-preview">
            <img alt={`${memory.title} proof`} src={proofImage} />
          </div>
        )}
      </section>
    </div>
  )
}

function AdminUserModal({
  artists,
  draft,
  isSelf,
  onClose,
  onDraftChange,
  onRequestDelete,
  onSave,
  profile,
  stats,
  workingId,
}) {
  if (!profile) {
    return null
  }

  return (
    <div className="admin-page__modal-overlay" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby={`admin-user-${profile.id}`}
        aria-modal="true"
        className="admin-page__user-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button className="admin-page__modal-close" onClick={onClose} type="button">
          Close
        </button>

        <div>
          <p className="section-kicker">User Details</p>
          <h2 id={`admin-user-${profile.id}`}>
            {profile.display_name || 'Fan Explorer'}
          </h2>
          <p>{profile.email || 'Email not available'}</p>
        </div>

        <dl className="admin-page__user-stats">
          <div>
            <dt>Total memories</dt>
            <dd>{stats.totalMemories}</dd>
          </div>
          <div>
            <dt>Total stars</dt>
            <dd>{stats.totalStars}</dd>
          </div>
          <div>
            <dt>Cards unlocked</dt>
            <dd>{stats.cardsUnlocked}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatDate(profile.created_at)}</dd>
          </div>
        </dl>

        <div className="admin-page__user-form">
          <label>
            <span>Display name</span>
            <input
              onChange={(event) => onDraftChange(profile, 'display_name', event.target.value)}
              value={draft.display_name}
            />
          </label>
          <label>
            <span>Email display field</span>
            <input
              onChange={(event) => onDraftChange(profile, 'email', event.target.value)}
              value={draft.email}
            />
          </label>
          <label>
            <span>Favorite Fandom / Artist</span>
            <input
              onChange={(event) =>
                onDraftChange(profile, 'favorite_fandom_artist', event.target.value)
              }
              value={draft.favorite_fandom_artist}
            />
          </label>
          <label>
            <span>Main artist</span>
            <select
              onChange={(event) => onDraftChange(profile, 'main_artist_id', event.target.value)}
              value={draft.main_artist_id}
            >
              <option value="">No main fandom selected</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-page__user-form--wide">
            <span>Bio</span>
            <textarea
              onChange={(event) => onDraftChange(profile, 'bio', event.target.value)}
              rows="4"
              value={draft.bio}
            ></textarea>
          </label>
          <label>
            <span>Admin access</span>
            <select
              onChange={(event) =>
                onDraftChange(profile, 'is_admin', event.target.value === 'true')
              }
              value={String(draft.is_admin)}
            >
              <option value="false">user</option>
              <option value="true">admin</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              onChange={(event) => onDraftChange(profile, 'status', event.target.value)}
              value={draft.status}
            >
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
          </label>
        </div>

        <div className="actions">
          <Button
            disabled={workingId === profile.id}
            onClick={() => onSave(profile)}
            type="button"
          >
            {workingId === profile.id ? 'Saving...' : 'Save User'}
          </Button>
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
        </div>

        <section className="admin-page__danger-zone">
          <div>
            <h3>Danger Zone</h3>
            <p>
              Permanently delete this user account and its related archive data
              through the secure delete-user Edge Function.
            </p>
            {isSelf && (
              <p>
                You cannot permanently delete your own account from this admin
                action.
              </p>
            )}
          </div>
          <Button
            className="admin-page__danger-button"
            disabled={isSelf}
            onClick={() => onRequestDelete(profile)}
            type="button"
            variant="ghost"
          >
            Permanently Delete User
          </Button>
        </section>
      </section>
    </div>
  )
}

function DeleteUserConfirmModal({
  deleting,
  error,
  onClose,
  onConfirm,
  profile,
}) {
  const [confirmation, setConfirmation] = useState('')

  if (!profile) {
    return null
  }

  const canDelete = confirmation.trim() === 'DELETE'

  return (
    <div className="admin-page__modal-overlay" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby={`delete-user-${profile.id}`}
        aria-modal="true"
        className="admin-page__delete-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button className="admin-page__modal-close" onClick={onClose} type="button">
          Close
        </button>

        <div>
          <p className="section-kicker">Permanent Delete</p>
          <h2 id={`delete-user-${profile.id}`}>
            Delete {profile.display_name || 'this user'}?
          </h2>
          <p className="admin-page__delete-warning">
            This will permanently delete this user account, profile, memories,
            card unlocks, and related data. This action cannot be undone.
          </p>
        </div>

        <label className="admin-page__delete-confirm">
          <span>Type DELETE to confirm</span>
          <input
            autoFocus
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="DELETE"
            value={confirmation}
          />
        </label>

        <FormMessage type="error">{error}</FormMessage>

        <div className="actions">
          <Button
            disabled={!canDelete || deleting}
            className="admin-page__danger-button"
            onClick={() => onConfirm(profile)}
            type="button"
            variant="ghost"
          >
            {deleting ? 'Deleting...' : 'Permanently Delete User'}
          </Button>
          <Button disabled={deleting} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </section>
    </div>
  )
}

function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const activePanel = routePanels[location.pathname] || 'Overview'
  const [dashboard, setDashboard] = useState({
    profiles: [],
    artists: [],
    memories: [],
    badges: [],
    fanLinks: [],
    userBadges: [],
    userCards: [],
  })
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [artistSearch, setArtistSearch] = useState('')
  const [memorySearch, setMemorySearch] = useState('')
  const [memoryArtistFilter, setMemoryArtistFilter] = useState('All')
  const [memoryUserFilter, setMemoryUserFilter] = useState('All')
  const [memoryProofFilter, setMemoryProofFilter] = useState('All')
  const [memoryVisibilityFilter, setMemoryVisibilityFilter] = useState('All')
  const [badgeSearch, setBadgeSearch] = useState('')
  const [badgeForm, setBadgeForm] = useState(emptyBadgeForm)
  const [editingBadgeId, setEditingBadgeId] = useState('')
  const [editingProfiles, setEditingProfiles] = useState({})
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deletingUserId, setDeletingUserId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError('')
      setDashboard(await getAdminDashboard())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialDashboard = async () => {
      try {
        const nextDashboard = await getAdminDashboard()

        if (!cancelled) {
          setDashboard(nextDashboard)
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

    loadInitialDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(
    () => ({
      users: dashboard.profiles.length,
      artists: dashboard.artists.length,
      memories: dashboard.memories.length,
      fanLinks: dashboard.fanLinks.length,
      badges: dashboard.badges.length,
      userBadges: dashboard.userBadges.length,
      privateMemories: dashboard.memories.filter(
        (memory) => memory.visibility === 'private',
      ).length,
    }),
    [dashboard],
  )

  const artistsById = useMemo(
    () =>
      new Map(
        dashboard.artists.map((artist) => [
          artist.id,
          artist,
        ]),
      ),
    [dashboard.artists],
  )

  const userStatsById = useMemo(() => {
    const nextStats = new Map()

    dashboard.profiles.forEach((profile) => {
      const userMemories = dashboard.memories.filter(
        (memory) => memory.user_id === profile.user_id,
      )
      nextStats.set(profile.user_id, {
        cardsUnlocked: dashboard.userCards.filter(
          (card) => card.user_id === profile.user_id,
        ).length,
        totalMemories: userMemories.length,
        totalStars: userMemories.reduce(
          (total, memory) => total + Number(memory.final_stars || memory.stars || 0),
          0,
        ),
      })
    })

    return nextStats
  }, [dashboard.memories, dashboard.profiles, dashboard.userCards])

  const filteredProfiles = useMemo(() => {
    const query = userSearch.trim().toLowerCase()

    if (!query) {
      return dashboard.profiles
    }

    return dashboard.profiles.filter((profile) =>
      [
        profile.display_name,
        profile.email,
        profile.bio,
        profile.favorite_artist,
        profile.favorite_fandom_artist,
        artistsById.get(profile.main_artist_id)?.name,
        profile.role,
        profile.status,
        profile.user_id,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [artistsById, dashboard.profiles, userSearch])

  const filteredArtists = useMemo(() => {
    const query = artistSearch.trim().toLowerCase()

    if (!query) {
      return dashboard.artists
    }

    return dashboard.artists.filter((artist) =>
      [artist.name, artist.category, artist.description]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [artistSearch, dashboard.artists])

  const uniqueMemoryArtists = useMemo(
    () =>
      Array.from(
        new Set(
          dashboard.memories
            .map((memory) => memory.artistName || memory.artist?.name)
            .filter(Boolean),
        ),
      ),
    [dashboard.memories],
  )

  const uniqueMemoryUsers = useMemo(
    () =>
      Array.from(
        new Set(
          dashboard.memories
            .map((memory) => memory.authorName || memory.profile?.display_name)
            .concat(
              dashboard.memories.map((memory) => memory.authorEmail || memory.profile?.email),
            )
            .filter(Boolean),
        ),
      ),
    [dashboard.memories],
  )

  const filteredMemories = useMemo(() => {
    const query = memorySearch.trim().toLowerCase()

    return dashboard.memories.filter((memory) => {
      const artistName = memory.artistName || memory.artist?.name || ''
      const authorName = memory.authorName || memory.profile?.display_name || ''
      const authorEmail = memory.authorEmail || memory.profile?.email || ''
      const hasProof = memory.has_proof || Boolean(memory.proof_image_url)
      const searchMatches =
        !query ||
        [
          memory.title,
          artistName,
          authorName,
          authorEmail,
          memory.activity_type,
          memory.mood,
          memory.description,
          memory.visibility,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      const artistMatches =
        memoryArtistFilter === 'All' || artistName === memoryArtistFilter
      const userMatches =
        memoryUserFilter === 'All' ||
        authorName === memoryUserFilter ||
        authorEmail === memoryUserFilter
      const proofMatches =
        memoryProofFilter === 'All' ||
        (memoryProofFilter === 'Proof Added' ? hasProof : !hasProof)
      const visibilityMatches =
        memoryVisibilityFilter === 'All' ||
        memory.visibility === memoryVisibilityFilter

      return (
        searchMatches &&
        artistMatches &&
        userMatches &&
        proofMatches &&
        visibilityMatches
      )
    })
  }, [
    dashboard.memories,
    memoryArtistFilter,
    memoryProofFilter,
    memorySearch,
    memoryUserFilter,
    memoryVisibilityFilter,
  ])

  const filteredBadges = useMemo(() => {
    const query = badgeSearch.trim().toLowerCase()

    if (!query) {
      return dashboard.badges
    }

    return dashboard.badges.filter((badge) =>
      [
        badge.title,
        badge.description,
        badge.icon,
        badge.condition_type,
        badge.condition_value,
        badge.glow,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [badgeSearch, dashboard.badges])

  const runAdminAction = async ({ id, successMessage, action }) => {
    try {
      setWorkingId(id)
      setError('')
      setMessage('')
      await action()
      setMessage(successMessage)
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setWorkingId('')
    }
  }

  const getProfileDraft = (profile) =>
    editingProfiles[profile.id] || {
      display_name: profile.display_name || '',
      email: profile.email || '',
      bio: profile.bio || '',
      favorite_artist: profile.favorite_artist || '',
      favorite_fandom_artist:
        profile.favorite_fandom_artist || profile.favorite_artist || '',
      is_admin: Boolean(profile.is_admin || profile.role === 'admin'),
      main_artist_id: profile.main_artist_id || '',
      status: profile.status || 'active',
    }

  const handleProfileDraftChange = (profile, field, value) => {
    setEditingProfiles((currentProfiles) => ({
      ...currentProfiles,
      [profile.id]: {
        ...getProfileDraft(profile),
        [field]: value,
      },
    }))
  }

  const handleSaveProfile = async (profile) => {
    const draft = getProfileDraft(profile)
    const fandomName =
      draft.favorite_fandom_artist.trim() ||
      artistsById.get(draft.main_artist_id)?.name ||
      draft.favorite_artist.trim()

    await runAdminAction({
      id: profile.id,
      successMessage: `${draft.display_name || profile.display_name} was updated.`,
      action: async () => {
        const updatedProfile = await updateProfileAdmin({
          profileId: profile.id,
          updates: {
            display_name: draft.display_name.trim() || 'Fan Explorer',
            email: draft.email.trim(),
            bio: draft.bio.trim(),
            favorite_artist: fandomName,
            favorite_fandom_artist: fandomName,
            main_artist_id: draft.main_artist_id || null,
            profile_completed: Boolean(
              draft.display_name.trim() && draft.main_artist_id,
            ),
            role: draft.is_admin ? 'admin' : 'user',
            status: draft.status,
          },
        })
        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          profiles: currentDashboard.profiles.map((currentProfile) =>
            currentProfile.id === profile.id ? updatedProfile : currentProfile,
          ),
        }))
        setSelectedProfile(updatedProfile)
        setEditingProfiles((currentProfiles) => {
          const nextProfiles = { ...currentProfiles }
          delete nextProfiles[profile.id]
          return nextProfiles
        })
      },
    })
  }

  const handleProfileStatus = async (profile, status) => {
    await runAdminAction({
      id: profile.id,
      successMessage:
        status === 'disabled'
          ? `${profile.display_name || 'This user'} was disabled.`
          : `${profile.display_name || 'This user'} was reactivated.`,
      action: async () => {
        const updatedProfile = await updateProfileAdmin({
          profileId: profile.id,
          updates: { status },
        })
        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          profiles: currentDashboard.profiles.map((currentProfile) =>
            currentProfile.id === profile.id ? updatedProfile : currentProfile,
          ),
        }))
        if (selectedProfile?.id === profile.id) {
          setSelectedProfile(updatedProfile)
        }
      },
    })
  }

  const handleOpenDeleteUser = (profile) => {
    setDeleteCandidate(profile)
    setDeleteError('')
  }

  const handlePermanentDeleteUser = async (profile) => {
    try {
      setDeletingUserId(profile.id)
      setDeleteError('')
      setError('')
      setMessage('')
      await deleteUserAdmin({ userId: profile.user_id })
      setDashboard((currentDashboard) => ({
        ...currentDashboard,
        fanLinks: currentDashboard.fanLinks.filter(
          (fanLink) => fanLink.user_id !== profile.user_id,
        ),
        memories: currentDashboard.memories.filter(
          (memory) => memory.user_id !== profile.user_id,
        ),
        profiles: currentDashboard.profiles.filter(
          (currentProfile) => currentProfile.user_id !== profile.user_id,
        ),
        userBadges: currentDashboard.userBadges.filter(
          (badge) => badge.user_id !== profile.user_id,
        ),
        userCards: currentDashboard.userCards.filter(
          (card) => card.user_id !== profile.user_id,
        ),
      }))
      setEditingProfiles((currentProfiles) => {
        const nextProfiles = { ...currentProfiles }
        delete nextProfiles[profile.id]
        return nextProfiles
      })
      setSelectedProfile(null)
      setDeleteCandidate(null)
      setMessage('User permanently deleted.')
    } catch (deleteUserError) {
      setDeleteError(
        deleteUserError.message || 'This user could not be permanently deleted.',
      )
    } finally {
      setDeletingUserId('')
    }
  }

  const handleDeleteArtist = async (artist) => {
    const confirmed = window.confirm(
      `Delete ${artist.name}? This also removes related fan links and memories.`,
    )

    if (!confirmed) {
      return
    }

    await runAdminAction({
      id: artist.id,
      successMessage: `${artist.name} was removed from FanVerse.`,
      action: async () => {
        await deleteArtistAdmin(artist.id)
        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          artists: currentDashboard.artists.filter(
            (currentArtist) => currentArtist.id !== artist.id,
          ),
          memories: currentDashboard.memories.filter(
            (memory) => memory.artist_id !== artist.id,
          ),
        }))
      },
    })
  }

  const handleMemoryVisibility = async (memory, visibility) => {
    await runAdminAction({
      id: memory.id,
      successMessage: `${memory.title} is now ${visibility}.`,
      action: async () => {
        const updatedMemory = await updateMemoryAdmin({
          memoryId: memory.id,
          updates: { visibility },
        })
        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          memories: currentDashboard.memories.map((currentMemory) =>
            currentMemory.id === memory.id ? updatedMemory : currentMemory,
          ),
        }))
      },
    })
  }

  const handleDeleteMemory = async (memory) => {
    const confirmed = window.confirm(`Delete "${memory.title}" permanently?`)

    if (!confirmed) {
      return
    }

    await runAdminAction({
      id: memory.id,
      successMessage: `${memory.title} was removed.`,
      action: async () => {
        await deleteMemoryAdmin(memory.id)
        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          memories: currentDashboard.memories.filter(
            (currentMemory) => currentMemory.id !== memory.id,
          ),
        }))
      },
    })
  }

  const handleDeleteBadge = async (badge) => {
    const confirmed = window.confirm(`Delete the ${badge.title} badge?`)

    if (!confirmed) {
      return
    }

    await runAdminAction({
      id: badge.id,
      successMessage: `${badge.title} was removed.`,
      action: async () => {
        await deleteBadgeAdmin(badge.id)
        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          badges: currentDashboard.badges.filter(
            (currentBadge) => currentBadge.id !== badge.id,
          ),
        }))
      },
    })
  }

  const resetBadgeForm = () => {
    setBadgeForm(emptyBadgeForm)
    setEditingBadgeId('')
  }

  const handleBadgeFormChange = (event) => {
    const { name, value } = event.target
    setBadgeForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleEditBadge = (badge) => {
    setEditingBadgeId(badge.id)
    setBadgeForm({
      id: badge.id,
      title: badge.title || '',
      description: badge.description || '',
      icon: badge.icon || '',
      condition_type: badge.condition_type || '',
      condition_value: String(badge.condition_value || 1),
      glow: badge.glow || 'purple',
    })
  }

  const handleSaveBadge = async (event) => {
    event.preventDefault()

    if (
      !badgeForm.id.trim() ||
      !badgeForm.title.trim() ||
      !badgeForm.description.trim() ||
      !badgeForm.condition_type.trim()
    ) {
      setError('Badge id, title, description, and condition type are required.')
      return
    }

    await runAdminAction({
      id: editingBadgeId || badgeForm.id,
      successMessage: editingBadgeId ? 'Badge updated.' : 'Badge created.',
      action: async () => {
        const payload = {
          id: badgeForm.id.trim().toLowerCase().replaceAll(' ', '-'),
          title: badgeForm.title.trim(),
          description: badgeForm.description.trim(),
          icon: badgeForm.icon.trim() || 'Badge',
          condition_type: badgeForm.condition_type.trim(),
          condition_value: Number(badgeForm.condition_value) || 1,
          glow: badgeForm.glow,
        }
        const savedBadge = editingBadgeId
          ? await updateBadgeAdmin({
              badgeId: editingBadgeId,
              updates: {
                title: payload.title,
                description: payload.description,
                icon: payload.icon,
                condition_type: payload.condition_type,
                condition_value: payload.condition_value,
                glow: payload.glow,
              },
            })
          : await createBadgeAdmin(payload)

        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          badges: editingBadgeId
            ? currentDashboard.badges.map((badge) =>
                badge.id === editingBadgeId ? savedBadge : badge,
              )
            : [savedBadge, ...currentDashboard.badges],
        }))
        resetBadgeForm()
      },
    })
  }

  if (loading) {
    return <LoadingState label="Loading admin command center" />
  }

  return (
    <div className="page-shell wide-container admin-page">
      <section className="admin-page__header">
        <div className="section-heading">
          <p className="section-kicker">Admin</p>
          <h1>FanVerse Control Center</h1>
          <p>
            Manage users, artists, characters, memories, badges, and moderation
            from one protected admin space.
          </p>
        </div>
        <div className="actions">
          <Button onClick={loadDashboard} type="button" variant="secondary">
            Refresh
          </Button>
          <Button to="/admin/characters" variant="ghost">
            Manage Characters
          </Button>
          <Button to="/admin/collectibles" variant="ghost">
            Manage Collectible Cards
          </Button>
          <Button to="/admin/stories" variant="ghost">
            Manage Stories
          </Button>
        </div>
      </section>

      <FormMessage type="error">{error}</FormMessage>
      <FormMessage type="success">{message}</FormMessage>

      <nav className="admin-page__tabs" aria-label="Admin panels">
        {panels.map((panel) => (
          <button
            className={
              activePanel === panel
                ? 'admin-page__tab admin-page__tab--active'
                : 'admin-page__tab'
            }
            key={panel}
            onClick={() => navigate(panelRoutes[panel])}
            type="button"
          >
            {panel}
          </button>
        ))}
      </nav>

      {activePanel === 'Overview' && (
        <section className="admin-page__panel">
          <div className="grid grid--4">
            <StatCard label="Users" tone="purple" value={stats.users} />
            <StatCard label="Artists" tone="blue" value={stats.artists} />
            <StatCard label="Memories" tone="pink" value={stats.memories} />
            <StatCard label="Fan Links" tone="gold" value={stats.fanLinks} />
          </div>
          <div className="grid grid--3 admin-page__secondary-stats">
            <StatCard
              detail="visible only to owners and admins"
              label="Private Memories"
              tone="purple"
              value={stats.privateMemories}
            />
            <StatCard label="Badges" tone="blue" value={stats.badges} />
            <StatCard
              label="Badge Unlocks"
              tone="gold"
              value={stats.userBadges}
            />
          </div>
        </section>
      )}

      {activePanel === 'Users' && (
        <section className="admin-page__panel">
          <div className="admin-page__filters glass-panel">
            <input
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search users by name, email, fandom, role, status..."
              type="search"
              value={userSearch}
            />
          </div>
          <div className="admin-page__user-list">
            {filteredProfiles.map((profile) => {
              const mainArtist = artistsById.get(profile.main_artist_id)
              const isDisabled = profile.status === 'disabled'
              const roleLabel =
                profile.is_admin || profile.role === 'admin' ? 'admin' : 'user'

              return (
                <article className="admin-page__user-row" key={profile.id}>
                  <div className="admin-page__user-identity">
                    <strong>{profile.display_name || 'Fan Explorer'}</strong>
                    <span>{profile.email || 'Email not available'}</span>
                  </div>
                  <div>
                    <span>
                      {mainArtist?.name ||
                        profile.favorite_fandom_artist ||
                        profile.favorite_artist ||
                        'Main fandom not set'}
                    </span>
                    <span>Main Fandom / Artist</span>
                  </div>
                  <div>
                    <span>{roleLabel}</span>
                    <span>{isDisabled ? 'disabled' : 'active'}</span>
                  </div>
                  <div>
                    <span>{formatDate(profile.created_at)}</span>
                    <span>Joined</span>
                  </div>
                  <div className="admin-page__user-actions">
                    <Button
                      onClick={() => setSelectedProfile(profile)}
                      type="button"
                      variant="secondary"
                    >
                      Details
                    </Button>
                    <Button
                      disabled={workingId === profile.id}
                      onClick={() =>
                        handleProfileStatus(profile, isDisabled ? 'active' : 'disabled')
                      }
                      type="button"
                      variant="ghost"
                    >
                      {workingId === profile.id
                        ? 'Working...'
                        : isDisabled
                          ? 'Reactivate'
                          : 'Disable'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="admin-page__safe-delete-note">
            Permanent deletion runs through the secure delete-user Edge Function.
            The service role key is never exposed in the frontend.
          </p>
        </section>
      )}

      {activePanel === 'Artists' && (
        <section className="admin-page__panel">
          <div className="admin-page__filters glass-panel">
            <input
              onChange={(event) => setArtistSearch(event.target.value)}
              placeholder="Search artists..."
              type="search"
              value={artistSearch}
            />
          </div>
          {filteredArtists.length > 0 ? (
            <div className="admin-page__table">
              {filteredArtists.map((artist) => (
                <article className="admin-page__row" key={artist.id}>
                  <div>
                    <strong>{artist.name}</strong>
                    <span>{artist.category}</span>
                  </div>
                  <div>
                    <span>
                      {artist.fanCount || 0} fans / {artist.memoryCount || 0}{' '}
                      memories
                    </span>
                  </div>
                  <div className="admin-page__actions">
                    <Button to={`/artists/${artist.id}`} variant="secondary">
                      View
                    </Button>
                    <Button
                      disabled={workingId === artist.id}
                      onClick={() => handleDeleteArtist(artist)}
                      type="button"
                      variant="ghost"
                    >
                      {workingId === artist.id ? 'Removing...' : 'Delete'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              description="No artists have been created yet."
              title="No artists"
            />
          )}
        </section>
      )}

      {activePanel === 'Memories' && (
        <section className="admin-page__panel">
          <div className="admin-page__filters admin-page__filters--memory glass-panel">
            <input
              onChange={(event) => setMemorySearch(event.target.value)}
              placeholder="Search memories, artists, users..."
              type="search"
              value={memorySearch}
            />
            <select
              onChange={(event) => setMemoryArtistFilter(event.target.value)}
              value={memoryArtistFilter}
            >
              <option value="All">All artists</option>
              {uniqueMemoryArtists.map((artistName) => (
                <option key={artistName} value={artistName}>
                  {artistName}
                </option>
              ))}
            </select>
            <select
              onChange={(event) => setMemoryUserFilter(event.target.value)}
              value={memoryUserFilter}
            >
              <option value="All">All users</option>
              {uniqueMemoryUsers.map((userName) => (
                <option key={userName} value={userName}>
                  {userName}
                </option>
              ))}
            </select>
            <select
              onChange={(event) => setMemoryProofFilter(event.target.value)}
              value={memoryProofFilter}
            >
              {proofFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
            <select
              onChange={(event) => setMemoryVisibilityFilter(event.target.value)}
              value={memoryVisibilityFilter}
            >
              {visibilityFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter === 'All' ? 'All visibility' : filter}
                </option>
              ))}
            </select>
          </div>
          {filteredMemories.length > 0 ? (
            <div className="admin-page__memory-list">
              {filteredMemories.map((memory) => {
                const artistName = memory.artistName || memory.artist?.name || 'Unknown artist'
                const authorName = memory.authorName || memory.profile?.display_name || 'Fan explorer'
                const authorEmail = memory.authorEmail || memory.profile?.email || 'Email not available'
                const hasProof = memory.has_proof || memory.hasProof || Boolean(memory.proof_image_url)

                return (
                  <article className="admin-page__memory-row" key={memory.id}>
                    <div className="admin-page__memory-summary">
                      <h3>{memory.title}</h3>
                      <p>
                        {artistName} / {authorName} / {authorEmail}
                      </p>
                    </div>
                    <div className="admin-page__memory-meta">
                      <span>{memory.activity_type || memory.type || 'Memory'}</span>
                      <span>{memory.final_stars || memory.stars || 0} stars</span>
                      <span>{hasProof ? 'Proof Added' : 'Memory Only'}</span>
                      <span>{memory.visibility}</span>
                      <span>{formatDate(memory.memory_date || memory.date)}</span>
                    </div>
                    <div className="admin-page__memory-actions">
                      <Button
                        onClick={() => setSelectedMemory(memory)}
                        type="button"
                        variant="secondary"
                      >
                        View Details
                      </Button>
                      <select
                        disabled={workingId === memory.id}
                        onChange={(event) =>
                          handleMemoryVisibility(memory, event.target.value)
                        }
                        value={memory.visibility}
                      >
                        <option value="public">public</option>
                        <option value="private">private</option>
                      </select>
                      <Button
                        disabled={workingId === memory.id}
                        onClick={() => handleDeleteMemory(memory)}
                        type="button"
                        variant="ghost"
                      >
                        {workingId === memory.id ? 'Working...' : 'Delete'}
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState
              description="No memories have been archived yet."
              title="No memories"
            />
          )}
        </section>
      )}

      {activePanel === 'Badges' && (
        <section className="admin-page__panel">
          <details className="admin-page__badge-help glass-panel" open>
            <summary>How Badge Conditions Work</summary>
            <p>
              Badges unlock automatically when a user reaches a condition.
              Choose a condition type and value to tell the app when this badge
              should be awarded.
            </p>
            <div className="admin-page__badge-help-grid">
              {badgeConditionExamples.map((example) => (
                <article key={example.type}>
                  <strong>{example.type}</strong>
                  <span>{example.text}</span>
                </article>
              ))}
            </div>
          </details>

          <form className="admin-page__badge-form glass-panel" onSubmit={handleSaveBadge}>
            <h2>{editingBadgeId ? 'Edit Badge' : 'Create Badge'}</h2>
            <div className="admin-page__badge-grid">
              <label>
                <span>Badge id</span>
                <input
                  disabled={Boolean(editingBadgeId)}
                  name="id"
                  onChange={handleBadgeFormChange}
                  placeholder="proof-added"
                  value={badgeForm.id}
                />
              </label>
              <label>
                <span>Title</span>
                <input
                  name="title"
                  onChange={handleBadgeFormChange}
                  placeholder="Proof Added"
                  value={badgeForm.title}
                />
              </label>
              <label>
                <span>Icon</span>
                <input
                  name="icon"
                  onChange={handleBadgeFormChange}
                  placeholder="Proof"
                  value={badgeForm.icon}
                />
              </label>
              <label>
                <span>Glow</span>
                <select name="glow" onChange={handleBadgeFormChange} value={badgeForm.glow}>
                  <option value="purple">purple</option>
                  <option value="blue">blue</option>
                  <option value="pink">pink</option>
                  <option value="gold">gold</option>
                </select>
              </label>
            </div>
            <label>
              <span>Description</span>
              <textarea
                name="description"
                onChange={handleBadgeFormChange}
                placeholder="Describe what this badge celebrates."
                rows="3"
                value={badgeForm.description}
              ></textarea>
            </label>
            <label>
              <span>Condition type</span>
              <input
                name="condition_type"
                onChange={handleBadgeFormChange}
                placeholder="first_memory"
                value={badgeForm.condition_type}
              />
              <small>
                Condition type defines what the app checks. Condition value
                defines how many are required.
              </small>
            </label>
            <label>
              <span>Condition value</span>
              <input
                min="1"
                name="condition_value"
                onChange={handleBadgeFormChange}
                type="number"
                value={badgeForm.condition_value}
              />
              <small>
                Use 1 for first-time conditions, or a higher number for
                milestone badges.
              </small>
            </label>
            <div className="actions">
              <Button disabled={Boolean(workingId)} type="submit">
                {editingBadgeId ? 'Save Badge' : 'Create Badge'}
              </Button>
              {editingBadgeId && (
                <Button onClick={resetBadgeForm} type="button" variant="secondary">
                  Cancel
                </Button>
              )}
            </div>
          </form>
          <div className="admin-page__filters glass-panel">
            <input
              onChange={(event) => setBadgeSearch(event.target.value)}
              placeholder="Search badges..."
              type="search"
              value={badgeSearch}
            />
          </div>
          <div className="admin-page__table">
            {filteredBadges.map((badge) => (
              <article className="admin-page__row" key={badge.id}>
                <div>
                  <strong>{badge.title}</strong>
                  <span>{badge.description}</span>
                </div>
                <div>
                  <span>{badge.condition_type}</span>
                  <span>Required: {badge.condition_value || 1}</span>
                </div>
                <div className="admin-page__actions">
                  <Button
                    onClick={() => handleEditBadge(badge)}
                    type="button"
                    variant="secondary"
                  >
                    Edit
                  </Button>
                  <Button
                    disabled={workingId === badge.id}
                    onClick={() => handleDeleteBadge(badge)}
                    type="button"
                    variant="ghost"
                  >
                    {workingId === badge.id ? 'Removing...' : 'Delete'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <AdminMemoryModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
      <AdminUserModal
        artists={dashboard.artists}
        draft={selectedProfile ? getProfileDraft(selectedProfile) : {}}
        isSelf={Boolean(selectedProfile && user?.id === selectedProfile.user_id)}
        onClose={() => setSelectedProfile(null)}
        onDraftChange={handleProfileDraftChange}
        onRequestDelete={handleOpenDeleteUser}
        onSave={handleSaveProfile}
        profile={selectedProfile}
        stats={
          selectedProfile
            ? userStatsById.get(selectedProfile.user_id) || {
                cardsUnlocked: 0,
                totalMemories: 0,
                totalStars: 0,
              }
            : {
                cardsUnlocked: 0,
                totalMemories: 0,
                totalStars: 0,
              }
        }
        workingId={workingId}
      />
      <DeleteUserConfirmModal
        deleting={deletingUserId === deleteCandidate?.id}
        error={deleteError}
        onClose={() => {
          if (!deletingUserId) {
            setDeleteCandidate(null)
            setDeleteError('')
          }
        }}
        onConfirm={handlePermanentDeleteUser}
        profile={deleteCandidate}
      />
    </div>
  )
}

export default AdminPage

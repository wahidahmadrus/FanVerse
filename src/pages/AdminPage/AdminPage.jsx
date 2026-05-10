import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import LoadingState from '../../components/LoadingState/LoadingState.jsx'
import MemoryCard from '../../components/MemoryCard/MemoryCard.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import {
  deleteArtistAdmin,
  deleteBadgeAdmin,
  deleteMemoryAdmin,
  getAdminDashboard,
  updateMemoryAdmin,
  updateProfileRole,
} from '../../services/adminService.js'
import './AdminPage.css'

const panels = ['Overview', 'Users', 'Artists', 'Memories', 'Badges']

function AdminPage() {
  const { user } = useAuth()
  const [activePanel, setActivePanel] = useState('Overview')
  const [dashboard, setDashboard] = useState({
    profiles: [],
    artists: [],
    memories: [],
    badges: [],
    fanLinks: [],
    userBadges: [],
  })
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
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

  const handleRoleChange = async (profile, role) => {
    const isDemotingSelf = profile.user_id === user.id && role !== 'admin'
    const confirmed =
      !isDemotingSelf ||
      window.confirm('This will remove your admin access after refresh. Continue?')

    if (!confirmed) {
      return
    }

    await runAdminAction({
      id: profile.id,
      successMessage: `${profile.display_name} is now ${role}.`,
      action: async () => {
        const updatedProfile = await updateProfileRole({
          profileId: profile.id,
          role,
        })
        setDashboard((currentDashboard) => ({
          ...currentDashboard,
          profiles: currentDashboard.profiles.map((currentProfile) =>
            currentProfile.id === profile.id ? updatedProfile : currentProfile,
          ),
        }))
      },
    })
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

  if (loading) {
    return <LoadingState label="Loading admin command center" />
  }

  return (
    <div className="page-shell admin-page">
      <section className="admin-page__header">
        <div className="section-heading">
          <p className="section-kicker">Admin</p>
          <h1>FanVerse Control Center</h1>
          <p>
            Manage users, artists, memories, badges, and moderation from one
            protected admin space.
          </p>
        </div>
        <Button onClick={loadDashboard} type="button" variant="secondary">
          Refresh
        </Button>
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
            onClick={() => setActivePanel(panel)}
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
          <div className="admin-page__table">
            {dashboard.profiles.map((profile) => (
              <article className="admin-page__row" key={profile.id}>
                <div>
                  <strong>{profile.display_name}</strong>
                  <span>{profile.user_id}</span>
                </div>
                <div>
                  <span>{profile.favorite_artist || 'No favorite artist'}</span>
                </div>
                <label>
                  <span>Role</span>
                  <select
                    disabled={workingId === profile.id}
                    onChange={(event) =>
                      handleRoleChange(profile, event.target.value)
                    }
                    value={profile.role || 'user'}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
              </article>
            ))}
          </div>
        </section>
      )}

      {activePanel === 'Artists' && (
        <section className="admin-page__panel">
          {dashboard.artists.length > 0 ? (
            <div className="admin-page__table">
              {dashboard.artists.map((artist) => (
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
          {dashboard.memories.length > 0 ? (
            <div className="admin-page__memories">
              {dashboard.memories.map((memory) => (
                <MemoryCard
                  actions={
                    <>
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
                    </>
                  }
                  key={memory.id}
                  memory={memory}
                />
              ))}
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
          <div className="admin-page__table">
            {dashboard.badges.map((badge) => (
              <article className="admin-page__row" key={badge.id}>
                <div>
                  <strong>{badge.title}</strong>
                  <span>{badge.description}</span>
                </div>
                <div>
                  <span>{badge.condition_type}</span>
                </div>
                <Button
                  disabled={workingId === badge.id}
                  onClick={() => handleDeleteBadge(badge)}
                  type="button"
                  variant="ghost"
                >
                  {workingId === badge.id ? 'Removing...' : 'Delete'}
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default AdminPage

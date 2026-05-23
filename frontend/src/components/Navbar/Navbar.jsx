import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { signOut } from '../../services/authService.js'
import './Navbar.css'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Fandom', to: '/explore' },
]

const desktopPrivateLinks = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Fandom', to: '/explore' },
  { label: 'Add Memory', to: '/add-memory' },
  { label: 'Profile', to: '/profile' },
]

function Navbar() {
  const { profile, user } = useAuth()
  const navLinks = user ? desktopPrivateLinks : publicLinks
  const mobileHome = user ? '/dashboard' : '/'
  const mobileProfile = user ? '/profile' : '/signin'
  const initials =
    profile?.display_name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'FA'

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="navbar">
      <NavLink aria-label="Fan Archive home" className="navbar__brand" to="/">
        <img src="/logo.jpeg" className="navbar__mark" alt="Fan Archive logo" />
        <span>
          <strong>Fan</strong>
          <span>Archive</span>
        </span>
      </NavLink>

      <nav className="navbar__links" aria-label="Main navigation">
        {navLinks.map((link) => (
          <NavLink
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
            end={link.to === '/'}
            key={link.to}
            to={link.to}
          >
            {link.label}
          </NavLink>
        ))}
        {user ? (
          <button
            className="navbar__link navbar__link--button"
            onClick={handleSignOut}
            type="button"
          >
            Sign Out
          </button>
        ) : (
          <>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
              }
              to="/signin"
            >
              Sign In
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
              }
              to="/signup"
            >
              Sign Up
            </NavLink>
          </>
        )}
      </nav>
      <NavLink
        aria-label="Open profile"
        className="navbar__avatar"
        to={mobileProfile}
      >
        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initials}
      </NavLink>

      <nav className="navbar__bottom" aria-label="Mobile navigation">
        <NavLink
          className={({ isActive }) =>
            isActive ? 'navbar__bottom-link navbar__bottom-link--active' : 'navbar__bottom-link'
          }
          end={!user}
          to={mobileHome}
        >
          <span>Home</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? 'navbar__bottom-link navbar__bottom-link--active' : 'navbar__bottom-link'
          }
          to="/explore"
        >
          <span>Fandom</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? 'navbar__bottom-link navbar__bottom-link--active' : 'navbar__bottom-link'
          }
          to="/add-memory"
        >
          <span>Add</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? 'navbar__bottom-link navbar__bottom-link--active' : 'navbar__bottom-link'
          }
          to={mobileProfile}
        >
          <span>Profile</span>
        </NavLink>
      </nav>
    </header>
  )
}

export default Navbar

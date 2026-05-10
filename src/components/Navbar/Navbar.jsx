import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { signOut } from '../../services/authService.js'
import './Navbar.css'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/explore' },
  { label: 'Artists', to: '/artists' },
]

const privateLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'My Archive', to: '/my-archive' },
  { label: 'Universe', to: '/universe' },
  { label: 'Add Memory', to: '/add-memory' },
  { label: 'Profile', to: '/profile' },
]

function Navbar() {
  const { profile, user } = useAuth()
  const adminLinks = profile?.role === 'admin' ? [{ label: 'Admin', to: '/admin' }] : []
  const navLinks = user
    ? [...publicLinks, ...privateLinks, ...adminLinks]
    : publicLinks

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="navbar">
      <NavLink aria-label="FanVerse Archive home" className="navbar__brand" to="/">
        <span className="navbar__mark" aria-hidden="true">
          FV
        </span>
        <span>
          <strong>FanVerse</strong>
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
          <button className="navbar__link navbar__link--button" onClick={handleSignOut} type="button">
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
    </header>
  )
}

export default Navbar

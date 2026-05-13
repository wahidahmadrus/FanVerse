import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import { useAuth } from '../../context/useAuth.js'
import { signUp } from '../../services/authService.js'
import './SignUpPage.css'

function SignUpPage() {
  const navigate = useNavigate()
  const { isConfigured } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Choose a display name for your fan profile.')
      return
    }

    if (!formData.email.trim() || formData.password.length < 6) {
      setError('Use a valid email and a password with at least 6 characters.')
      return
    }

    try {
      setLoading(true)
      const data = await signUp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })

      if (data.session) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/signin', {
          replace: true,
          state: { message: 'Check your email to confirm your FanVerse account.' },
        })
      }
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell narrow-container signup-page">
      <section className="signup-page__panel glass-panel">
        <div>
          <p className="section-kicker">Sign Up</p>
          <h1>Create your fan archive</h1>
          <p>
            Choose one Main Fandom / Artist, then keep your memories in a place
            built for them.
          </p>
        </div>

        {!isConfigured && (
          <FormMessage type="error">
            Supabase is not configured yet. Add your Vite environment variables
            before creating accounts.
          </FormMessage>
        )}

        <FormMessage type="error">{error}</FormMessage>

        <form className="signup-page__form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              autoComplete="name"
              name="name"
              onChange={handleChange}
              placeholder="Your display name"
              type="text"
              value={formData.name}
            />
          </label>

          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              onChange={handleChange}
              placeholder="you@example.com"
              type="email"
              value={formData.email}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete="new-password"
              name="password"
              onChange={handleChange}
              placeholder="At least 6 characters"
              type="password"
              value={formData.password}
            />
          </label>

          <Button disabled={loading || !isConfigured} type="submit">
            {loading ? 'Creating...' : 'Start Your Archive'}
          </Button>
        </form>

        <p className="signup-page__footer">
          Already have an archive? <Link to="/signin">Sign in</Link>
        </p>
      </section>
    </div>
  )
}

export default SignUpPage

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import FormMessage from '../../components/FormMessage/FormMessage.jsx'
import { useAuth } from '../../context/useAuth.js'
import { signIn } from '../../services/authService.js'
import './SignInPage.css'

function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isConfigured } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!formData.email.trim() || !formData.password) {
      setError('Add your email and password to enter your archive.')
      return
    }

    try {
      setLoading(true)
      await signIn({
        email: formData.email.trim(),
        password: formData.password,
      })
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell signin-page">
      <section className="signin-page__panel glass-panel">
        <div>
          <p className="section-kicker">Sign In</p>
          <h1>Return to your fan universe</h1>
          <p>
            Continue archiving your journey, supporting artists, and celebrating
            every memory at your own pace.
          </p>
        </div>

        {!isConfigured && (
          <FormMessage type="error">
            Supabase is not configured yet. Add your Vite environment variables
            before signing in.
          </FormMessage>
        )}

        <FormMessage type="error">{error}</FormMessage>
        <FormMessage type="info">{location.state?.message}</FormMessage>

        <form className="signin-page__form" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              name="password"
              onChange={handleChange}
              placeholder="Your password"
              type="password"
              value={formData.password}
            />
          </label>

          <Button disabled={loading || !isConfigured} type="submit">
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <p className="signin-page__footer">
          New to FanVerse? <Link to="/signup">Create your archive</Link>
        </p>
      </section>
    </div>
  )
}

export default SignInPage

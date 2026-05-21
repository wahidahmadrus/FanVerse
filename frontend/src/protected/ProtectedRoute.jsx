import { Navigate, Outlet, useLocation } from 'react-router-dom'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import LoadingState from '../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../context/useAuth.js'

function ProtectedRoute() {
  const { loading, profile, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState label="Opening your fan universe" />
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/signin" />
  }

  if (profile?.status === 'disabled') {
    return (
      <div className="page-shell">
        <EmptyState
          description="Please contact the site owner if you think this should be changed."
          title="Your account has been disabled."
        />
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute

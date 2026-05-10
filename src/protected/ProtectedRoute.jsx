import { Navigate, Outlet, useLocation } from 'react-router-dom'
import LoadingState from '../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../context/useAuth.js'

function ProtectedRoute() {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState label="Opening your fan universe" />
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/signin" />
  }

  return <Outlet />
}

export default ProtectedRoute

import { Navigate, Outlet } from 'react-router-dom'
import LoadingState from '../components/LoadingState/LoadingState.jsx'
import { useAuth } from '../context/useAuth.js'

function AdminRoute() {
  const { loading, profile, user } = useAuth()

  if (loading) {
    return <LoadingState label="Checking admin access" />
  }

  if (!user) {
    return <Navigate replace to="/signin" />
  }

  if (profile?.role !== 'admin') {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet />
}

export default AdminRoute

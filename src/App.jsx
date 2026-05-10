import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import MainLayout from './layouts/MainLayout/MainLayout.jsx'
import AddMemoryPage from './pages/AddMemoryPage/AddMemoryPage.jsx'
import AdminPage from './pages/AdminPage/AdminPage.jsx'
import ArtistDetailPage from './pages/ArtistDetailPage/ArtistDetailPage.jsx'
import ArtistsPage from './pages/ArtistsPage/ArtistsPage.jsx'
import CreateArtistPage from './pages/CreateArtistPage/CreateArtistPage.jsx'
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx'
import EditMemoryPage from './pages/EditMemoryPage/EditMemoryPage.jsx'
import ExplorePage from './pages/ExplorePage/ExplorePage.jsx'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import MyArchivePage from './pages/MyArchivePage/MyArchivePage.jsx'
import ProfilePage from './pages/ProfilePage/ProfilePage.jsx'
import SignInPage from './pages/SignInPage/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage/SignUpPage.jsx'
import UniversePage from './pages/UniversePage/UniversePage.jsx'
import AdminRoute from './protected/AdminRoute.jsx'
import ProtectedRoute from './protected/ProtectedRoute.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/artists/:artistId" element={<ArtistDetailPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/add-memory" element={<AddMemoryPage />} />
              <Route path="/create-artist" element={<CreateArtistPage />} />
              <Route path="/my-archive" element={<MyArchivePage />} />
              <Route path="/memories/:memoryId/edit" element={<EditMemoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/universe" element={<UniversePage />} />
              <Route path="/archive" element={<Navigate replace to="/my-archive" />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

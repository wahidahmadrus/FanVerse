import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar.jsx'
import './MainLayout.css'

function MainLayout() {
  return (
    <div className="main-layout">
      <div className="main-layout__stars" aria-hidden="true"></div>
      <div className="main-layout__glow main-layout__glow--one" aria-hidden="true"></div>
      <div className="main-layout__glow main-layout__glow--two" aria-hidden="true"></div>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout

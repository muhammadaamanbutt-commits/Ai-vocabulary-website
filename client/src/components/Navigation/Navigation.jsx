import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="nav">
      <Link to="/" className="logo">
        <div className="logo-mark"></div>
        <span>Semantic Compass</span>
      </Link>
      <ul className="nav-links">
        <li className={location.pathname === '/exploration' ? 'active' : ''}>Explore</li>
        <li>My Trails</li>
        <li>About</li>
      </ul>
      <div className="nav-right">
        <button className="nav-icon-btn" aria-label="Search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
        </button>
        <div className="profile-icon" aria-label="Profile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 22c0-4 4-7 8-7s8 3 8 7" />
          </svg>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

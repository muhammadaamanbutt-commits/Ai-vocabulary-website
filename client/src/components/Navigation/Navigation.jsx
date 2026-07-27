import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import SearchModal from '../SearchModal/SearchModal'
import './Navigation.css'

function Navigation() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const drawerRef = useRef(null)

  // Body scroll lock when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMenuOpen])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMenuOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const openSearch = () => {
    setIsSearchOpen(true)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
  }

  return (
    <>
      <nav className="nav">
        <Link to="/" className="logo">
          <div className="logo-mark"></div>
          <span className="logo-wordmark">Semantic Compass</span>
        </Link>

        {/* Desktop navigation links */}
        <ul className="nav-links">
          <li className={location.pathname === '/exploration' ? 'active' : ''}>Explore</li>
          <li>My Trails</li>
          <li>About</li>
        </ul>

        <div className="nav-right">
          {/* Hamburger menu button - visible only on mobile */}
          <button 
            className="hamburger-btn" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          <button className="nav-icon-btn" aria-label="Search" onClick={openSearch}>
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

      {/* Overlay */}
      <div 
        className={`menu-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden={!isMenuOpen}
      ></div>

      {/* Mobile slide-in drawer */}
      <div 
        ref={drawerRef}
        className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="Mobile navigation menu"
      >
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button 
            className="drawer-close-btn" 
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <ul className="mobile-nav-links">
          <li 
            className={location.pathname === '/exploration' ? 'active' : ''}
            onClick={closeMenu}
          >
            <Link to="/exploration">Explore</Link>
          </li>
          <li onClick={closeMenu}>
            <Link to="/trails">My Trails</Link>
          </li>
          <li onClick={closeMenu}>
            <Link to="/about">About</Link>
          </li>
        </ul>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  )
}

export default Navigation

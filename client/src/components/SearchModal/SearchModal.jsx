import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchModal.css'

function SearchModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/exploration?word=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm('')
      onClose()
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="search-modal-overlay" onClick={handleOverlayClick}>
      <div className="search-modal">
        {/* Show close button only when input is empty */}
        {!searchTerm.trim() && (
          <button 
            className="search-modal-close" 
            onClick={onClose}
            aria-label="Close search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        
        <form onSubmit={handleSubmit} className="search-modal-form">
          <div className="search-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="enter word to explore"
              className="search-modal-input"
            />
            {/* Show submit button only when there's text */}
            {searchTerm.trim() && (
              <button type="submit" className="search-modal-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default SearchModal

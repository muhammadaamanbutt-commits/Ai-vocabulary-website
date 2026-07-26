import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBox.css'

function SearchBox() {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/exploration?word=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const handleSampleWord = (word) => {
    navigate(`/exploration?word=${word}`)
  }

  return (
    <div className="landing-search-section">
      <form className="search-box" onSubmit={handleSearch}>
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <input 
          className="search-input" 
          placeholder="Enter a node to explore..."
          autoComplete="off"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="map-btn" type="submit">Map it →</button>
      </form>

      <div className="sample-row">
        <div className="sample-pills">
          <button className="sample-pill" onClick={() => handleSampleWord('ephemeral')}>ephemeral</button>
          <button className="sample-pill" onClick={() => handleSampleWord('serendipity')}>serendipity</button>
          <button className="sample-pill" onClick={() => handleSampleWord('ubiquitous')}>ubiquitous</button>
          <button className="sample-pill" onClick={() => handleSampleWord('resilient')}>resilient</button>
        </div>
      </div>
    </div>
  )
}

export default SearchBox

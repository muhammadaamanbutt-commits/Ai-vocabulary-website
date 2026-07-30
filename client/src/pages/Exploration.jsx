import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation/Navigation'
import Sidebar from '../components/Sidebar/Sidebar'
import Canvas from '../components/Canvas/Canvas'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { getMockWordData } from '../mockData'
import './Exploration.css'

function Exploration() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [currentWord, setCurrentWord] = useState('')
  const [wordData, setWordData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trailHistory, setTrailHistory] = useState([])
  const [isFading, setIsFading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('map') // 'map' or 'definition'
  const [clickedWord, setClickedWord] = useState(null)
  const wordDataCache = useRef({}) // Cache to store fetched word data
  
  // Check if we should use mock data (development mode)
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true' || 
                      (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA !== 'false')

  useEffect(() => {
    const word = searchParams.get('word')
    if (word && word !== currentWord) {
      // Start fade out animation
      setIsFading(true)
      setLoading(true)
      
      // Wait for fade out to complete
      setTimeout(async () => {
        setCurrentWord(word)
        
        // Clear old data to show loading state
        setWordData(null)
        
        // Add to trail history
        setTrailHistory(prev => {
          if (!prev.includes(word)) {
            return [...prev, word]
          }
          return prev
        })
        
        // Check if word data is in cache
        if (wordDataCache.current[word]) {
          // Use cached data - still show brief loading for smooth transition
          await new Promise(resolve => setTimeout(resolve, 100))
          setWordData(wordDataCache.current[word])
          setClickedWord(null)
          setLoading(false)
          setIsFading(false)
        } else {
          // Fetch new data
          await fetchWordData(word)
          setClickedWord(null)
          setIsFading(false)
        }
      }, 300) // Wait for fade out to complete
    }
  }, [searchParams, currentWord])

  const fetchWordData = async (word) => {
    setLoading(true)
    try {
      let data;
      
      if (useMockData) {
        // Use mock data in development mode
        console.log('🔧 Using mock data for:', word)
        data = await getMockWordData(word)
      } else {
        // Use real API in production
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const response = await fetch(`${apiUrl}/api/words?term=${encodeURIComponent(word)}`)
        data = await response.json()
      }
      
      setWordData(data)
      // Cache the fetched data
      wordDataCache.current[word] = data
    } catch (error) {
      console.error('Error fetching word data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrailClick = (word) => {
    navigate(`/exploration?word=${encodeURIComponent(word)}`)
    setIsDrawerOpen(false) // Close drawer when navigating
  }

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
  }

  const handleWordClick = (word, position) => {
    // Store the clicked word for the loading state
    setClickedWord(word)
  }

  // Close drawer when switching to Definition tab
  useEffect(() => {
    if (activeTab === 'definition') {
      setIsDrawerOpen(false)
    }
  }, [activeTab])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  return (
    <>
      <Navigation />
      <div className="exploration">
        {/* Mock Data Indicator Badge */}
        {useMockData && (
          <div 
            className="mock-data-badge" 
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Using mock data for local development"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Mock Data
          </div>
        )}
        
        {/* Drawer Trigger Button - Only show when Map tab is active */}
        {activeTab === 'map' && (
          <button 
            className="drawer-trigger" 
            onClick={toggleDrawer}
            aria-label="Toggle Trail Log"
            aria-expanded={isDrawerOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="2" />
              <circle cx="18" cy="6" r="2" />
              <circle cx="12" cy="18" r="2" />
              <line x1="7.5" y1="7.5" x2="10.5" y2="16.5" />
              <line x1="16.5" y1="7.5" x2="13.5" y2="16.5" />
            </svg>
          </button>
        )}

        {/* Drawer Overlay */}
        {isDrawerOpen && (
          <div 
            className="drawer-overlay" 
            onClick={closeDrawer}
            aria-hidden="true"
          />
        )}

        {/* Sidebar as Drawer on mobile/tablet */}
        <div className={`sidebar-wrapper ${isDrawerOpen ? 'open' : ''}`}>
          <button 
            className="drawer-close" 
            onClick={closeDrawer}
            aria-label="Close Trail Log"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <Sidebar trailHistory={trailHistory} currentWord={currentWord} onTrailClick={handleTrailClick} />
        </div>

        {/* Mobile Tab Navigation */}
        <div className="mobile-tabs">
          <button 
            className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
            aria-selected={activeTab === 'map'}
            role="tab"
          >
            Map
          </button>
          <button 
            className={`tab-button ${activeTab === 'definition' ? 'active' : ''}`}
            onClick={() => setActiveTab('definition')}
            aria-selected={activeTab === 'definition'}
            role="tab"
          >
            Definition
          </button>
        </div>

        {/* Content Area */}
        <div className={`content-wrapper ${activeTab === 'definition' ? 'show-definition' : 'show-map'}`}>
          <div className="canvas-container">
            <Canvas 
              wordData={wordData} 
              currentWord={currentWord} 
              isFading={isFading}
              clickedWord={clickedWord}
              onWordClick={handleWordClick}
            />
          </div>
          <div className="detail-container">
            <DetailPanel wordData={wordData} currentWord={currentWord} isFading={isFading} />
          </div>
        </div>
      </div>
    </>
  )
}

export default Exploration

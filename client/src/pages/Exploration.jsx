import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation/Navigation'
import Sidebar from '../components/Sidebar/Sidebar'
import Canvas from '../components/Canvas/Canvas'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import './Exploration.css'

function Exploration() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [currentWord, setCurrentWord] = useState('')
  const [wordData, setWordData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trailHistory, setTrailHistory] = useState([])
  const [isFading, setIsFading] = useState(false)
  const wordDataCache = useRef({}) // Cache to store fetched word data

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
          setLoading(false)
          setIsFading(false)
        } else {
          // Fetch new data
          await fetchWordData(word)
          setIsFading(false)
        }
      }, 300) // Wait for fade out to complete
    }
  }, [searchParams, currentWord])

  const fetchWordData = async (word) => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/words/${word}`)
      const data = await response.json()
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
  }

  return (
    <>
      <Navigation />
      <div className="exploration">
        <Sidebar trailHistory={trailHistory} currentWord={currentWord} onTrailClick={handleTrailClick} />
        <Canvas wordData={wordData} currentWord={currentWord} isFading={isFading} />
        <DetailPanel wordData={wordData} currentWord={currentWord} isFading={isFading} />
      </div>
    </>
  )
}

export default Exploration

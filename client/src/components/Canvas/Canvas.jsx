import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Canvas.css'

function Canvas({ wordData, currentWord, isFading }) {
  const navigate = useNavigate()
  const [animatingWord, setAnimatingWord] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredWord, setHoveredWord] = useState(null)
  
  // Show loading state when data is being fetched
  if (!wordData || !wordData.related_words) {
    return (
      <div className="canvas">
        <div className="canvas-overlay">
          <div className="canvas-label">
            <span className="live-dot"></span>
            <span>LOADING SEMANTIC FIELD</span>
          </div>
        </div>
        
        {/* Loading state - show "Meaning..." text */}
        <div className="central-node">
          <div className="blob-wrapper">
            <svg className="blob-svg" viewBox="0 0 400 400">
              <defs>
                <radialGradient id="blobCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ccff33" stopOpacity="0.25" />
                  <stop offset="30%" stopColor="#ccff33" stopOpacity="0.15" />
                  <stop offset="65%" stopColor="#ccff33" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#ccff33" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="blobInner" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ccff33" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ccff33" stopOpacity="0" />
                </radialGradient>
                <filter id="goo">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
                  <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
                </filter>
              </defs>

              {/* Outer soft halo */}
              <circle cx="200" cy="200" r="180" fill="url(#blobCore)" />

              {/* Organic blob body (gooey merged circles) */}
              <g filter="url(#goo)">
                <circle cx="200" cy="200" r="95" fill="#ccff33" fillOpacity="0.15" />
                <circle cx="155" cy="175" r="50" fill="#ccff33" fillOpacity="0.12" />
                <circle cx="245" cy="180" r="55" fill="#ccff33" fillOpacity="0.12" />
                <circle cx="220" cy="240" r="48" fill="#ccff33" fillOpacity="0.10" />
                <circle cx="170" cy="230" r="42" fill="#ccff33" fillOpacity="0.10" />
                <circle cx="195" cy="150" r="38" fill="#ccff33" fillOpacity="0.08" />
                <circle cx="240" cy="220" r="32" fill="#ccff33" fillOpacity="0.08" />
              </g>

              {/* Inner crisp organic outline */}
              <path 
                d="M 200,90 C 260,82 310,120 325,170 C 340,220 318,275 270,300 C 220,325 155,315 115,280 C 75,245 70,185 95,140 C 120,95 165,88 200,90 Z" 
                fill="url(#blobInner)" 
                stroke="rgba(204,255,51,0.45)"
                strokeWidth="1.2" 
              />

              {/* Inner highlight ring */}
              <path 
                d="M 200,110 C 250,103 290,135 305,175 C 320,215 305,260 265,285 C 220,310 165,300 130,270 C 95,240 90,190 110,155 C 130,120 170,108 200,110 Z" 
                fill="none" 
                stroke="rgba(204,255,51,0.18)" 
                strokeWidth="0.8"
                strokeDasharray="1 3" 
              />
            </svg>
          </div>
          <div className="central-word loading">
            <span className="word loading-text">Meaning...</span>
          </div>
        </div>
      </div>
    )
  }

  const { related_words } = wordData

  const handleWordClick = (word, event) => {
    // Get clicked element position
    const clickedElement = event.currentTarget
    setAnimatingWord(word)
    setIsTransitioning(true)
    
    // Disable pointer events during animation
    const container = clickedElement.parentElement
    if (container) {
      container.style.pointerEvents = 'none'
    }

    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate(`/exploration?word=${encodeURIComponent(word)}`)
      setIsTransitioning(false)
      setAnimatingWord(null)
      if (container) {
        container.style.pointerEvents = 'auto'
      }
    }, 600) // Animation duration
  }

  // Position words in a circular pattern
  const positionWord = (index, total) => {
    const angle = (index / total) * Math.PI * 2
    // Reduced radius to bring words closer - was 35 + (index % 3) * 8
    const radius = 28 + (index % 3) * 5
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    return { left: `${x}%`, top: `${y}%` }
  }

  return (
    <div className={`canvas ${isFading ? 'fading' : ''}`}>
      <div className="canvas-overlay">
        <div className="canvas-label">
          <span className="live-dot"></span>
          <span>LIVE SEMANTIC FIELD</span>
        </div>
      </div>

      {/* Concentric guide rings */}
      <svg className="concentric-rings" width="780" height="780" viewBox="0 0 780 780">
        <circle cx="390" cy="390" r="140" />
        <circle cx="390" cy="390" r="210" className="dashed" />
        <circle cx="390" cy="390" r="290" />
        <circle cx="390" cy="390" r="370" className="dashed" />
      </svg>

      {/* Connection lines SVG */}
      <svg className="connection-lines" width="100%" height="100%">
        {related_words.map((word, index) => {
          const angle = (index / related_words.length) * Math.PI * 2
          const wordRadius = 28 + (index % 3) * 5
          
          // Blob edge (start point) - exactly at the edge of the blob (~18% from center based on blob size)
          const blobRadius = 18
          const x1Percent = 50 + Math.cos(angle) * blobRadius
          const y1Percent = 50 + Math.sin(angle) * blobRadius
          
          // Word position (end point) - exactly at the word position
          const x2Percent = 50 + Math.cos(angle) * wordRadius
          const y2Percent = 50 + Math.sin(angle) * wordRadius
          
          return (
            <line
              key={index}
              x1={`${x1Percent}%`}
              y1={`${y1Percent}%`}
              x2={`${x2Percent}%`}
              y2={`${y2Percent}%`}
            />
          )
        })}
      </svg>

      {/* Central node with organic blob */}
      <div className="central-node">
        <div className="blob-wrapper">
          <svg className="blob-svg" viewBox="0 0 400 400">
            <defs>
              <radialGradient id="blobCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ccff33" stopOpacity="0.25" />
                <stop offset="30%" stopColor="#ccff33" stopOpacity="0.15" />
                <stop offset="65%" stopColor="#ccff33" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#ccff33" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="blobInner" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ccff33" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ccff33" stopOpacity="0" />
              </radialGradient>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
                <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
              </filter>
            </defs>

            {/* Outer soft halo */}
            <circle cx="200" cy="200" r="180" fill="url(#blobCore)" />

            {/* Organic blob body (gooey merged circles) */}
            <g filter="url(#goo)">
              <circle cx="200" cy="200" r="95" fill="#ccff33" fillOpacity="0.15" />
              <circle cx="155" cy="175" r="50" fill="#ccff33" fillOpacity="0.12" />
              <circle cx="245" cy="180" r="55" fill="#ccff33" fillOpacity="0.12" />
              <circle cx="220" cy="240" r="48" fill="#ccff33" fillOpacity="0.10" />
              <circle cx="170" cy="230" r="42" fill="#ccff33" fillOpacity="0.10" />
              <circle cx="195" cy="150" r="38" fill="#ccff33" fillOpacity="0.08" />
              <circle cx="240" cy="220" r="32" fill="#ccff33" fillOpacity="0.08" />
            </g>

            {/* Inner crisp organic outline */}
            <path 
              d="M 200,90 C 260,82 310,120 325,170 C 340,220 318,275 270,300 C 220,325 155,315 115,280 C 75,245 70,185 95,140 C 120,95 165,88 200,90 Z" 
              fill="url(#blobInner)" 
              stroke="rgba(204,255,51,0.45)"
              strokeWidth="1.2" 
            />

            {/* Inner highlight ring */}
            <path 
              d="M 200,110 C 250,103 290,135 305,175 C 320,215 305,260 265,285 C 220,310 165,300 130,270 C 95,240 90,190 110,155 C 130,120 170,108 200,110 Z" 
              fill="none" 
              stroke="rgba(204,255,51,0.18)" 
              strokeWidth="0.8"
              strokeDasharray="1 3" 
            />
          </svg>
        </div>
        <div className={`central-word ${isTransitioning ? 'fade-out' : ''}`}>
          <span className="word">{currentWord}</span>
        </div>
      </div>

      {/* Cluster words - exactly 20 */}
      <div className={`cluster-container ${hoveredWord ? 'has-hover' : ''}`}>
        {related_words.map((word, index) => (
          <div
            key={index}
            className={`cluster-word clickable ${index < 7 ? 'near' : index < 14 ? 'medium' : 'far'} ${animatingWord === word ? 'animating-to-center' : ''} ${hoveredWord && hoveredWord !== word ? 'blurred' : ''} ${hoveredWord === word ? 'active-hover' : ''}`}
            style={positionWord(index, related_words.length)}
            onClick={(e) => handleWordClick(word, e)}
            onMouseEnter={() => setHoveredWord(word)}
            onMouseLeave={() => setHoveredWord(null)}
          >
            {word}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Canvas

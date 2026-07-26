import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Canvas.css'

function Canvas({ wordData, currentWord, isFading }) {
  const navigate = useNavigate()
  const [animatingWord, setAnimatingWord] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredWord, setHoveredWord] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const containerRef = useRef(null)
  
  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      // Check if device has coarse pointer (touch) as primary input
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
      // Check if device doesn't support hover
      const noHover = window.matchMedia('(hover: none)').matches
      setIsTouchDevice(hasCoarsePointer || noHover)
    }
    
    checkTouchDevice()
  }, [])
  
  // ResizeObserver to track container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return
    
    // Set initial dimensions immediately
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height })
    }
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
      }
    })
    
    resizeObserver.observe(containerRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [])
  
  // Calculate scale factor based on container size
  const getScaleFactor = () => {
    const baseSize = 800 // Design baseline
    const size = Math.min(dimensions.width, dimensions.height)
    return size / baseSize
  }
  
  // Calculate font sizes with minimum floor
  const getFontSize = (baseSize) => {
    const scaleFactor = getScaleFactor()
    const scaled = baseSize * scaleFactor
    const minSize = baseSize <= 14 ? 11 : 12 // Different floors for different base sizes
    return Math.max(scaled, minSize)
  }
  
  // Detect collision between labels
  const detectCollision = (positions, newPos, wordLength, fontSize) => {
    // Approximate label width based on character count and font size
    const labelWidth = wordLength * fontSize * 0.6
    const labelHeight = fontSize * 1.5
    
    for (const pos of positions) {
      const dx = Math.abs(newPos.x - pos.x)
      const dy = Math.abs(newPos.y - pos.y)
      
      // Check if bounding boxes overlap with some padding
      if (dx < (labelWidth + pos.width) / 2 + 10 && 
          dy < (labelHeight + pos.height) / 2 + 10) {
        return true
      }
    }
    return false
  }
  
  // Position words in a circular pattern with collision avoidance and safe boundaries
  const positionWords = (words) => {
    const total = words.length
    const positions = []
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.28
    
    // Calculate safe margins - 12% from each edge to prevent overflow
    // Increased from 8% to ensure words never go outside at any screen size
    const safeMarginX = dimensions.width * 0.12
    const safeMarginY = dimensions.height * 0.12
    const minX = safeMarginX
    const maxX = dimensions.width - safeMarginX
    const minY = safeMarginY
    const maxY = dimensions.height - safeMarginY
    
    words.forEach((word, index) => {
      let angle = (index / total) * Math.PI * 2
      let attempts = 0
      let positioned = false
      
      // Determine tier and radius
      const tier = index % 3
      let radiusMultiplier = 1 + (tier * 0.18)
      
      // Calculate font size based on tier
      const baseFontSize = tier === 0 ? 16 : tier === 1 ? 14 : 12
      const fontSize = getFontSize(baseFontSize)
      
      while (!positioned && attempts < 20) {
        const radius = baseRadius * radiusMultiplier
        let x = centerX + Math.cos(angle) * radius
        let y = centerY + Math.sin(angle) * radius
        
        const wordLength = word.length
        const labelWidth = wordLength * fontSize * 0.6
        const labelHeight = fontSize * 1.5
        
        // Clamp positions to stay within safe boundaries
        // Account for label dimensions when clamping
        x = Math.max(minX + labelWidth / 2, Math.min(x, maxX - labelWidth / 2))
        y = Math.max(minY + labelHeight / 2, Math.min(y, maxY - labelHeight / 2))
        
        const newPos = { 
          x, 
          y, 
          width: labelWidth, 
          height: labelHeight,
          angle,
          radius
        }
        
        // Check collision
        if (!detectCollision(positions, newPos, wordLength, fontSize)) {
          positions.push(newPos)
          positioned = true
        } else {
          // Adjust angle slightly or increase radius
          if (attempts < 10) {
            angle += (Math.PI * 2) / (total * 2) // Fine-tune angle
          } else {
            radiusMultiplier += 0.05 // Push out slightly
          }
          attempts++
        }
      }
      
      // Fallback if collision detection fails
      if (!positioned) {
        const radius = baseRadius * radiusMultiplier
        let x = centerX + Math.cos(angle) * radius
        let y = centerY + Math.sin(angle) * radius
        
        const labelWidth = word.length * fontSize * 0.6
        const labelHeight = fontSize * 1.5
        
        // Apply safe boundary clamping to fallback position too
        x = Math.max(minX + labelWidth / 2, Math.min(x, maxX - labelWidth / 2))
        y = Math.max(minY + labelHeight / 2, Math.min(y, maxY - labelHeight / 2))
        
        positions.push({ 
          x, 
          y, 
          width: labelWidth, 
          height: labelHeight,
          angle,
          radius
        })
      }
    })
    
    return positions
  }
  
  // Show loading state when data is being fetched
  if (!wordData || !wordData.related_words) {
    return (
      <div className="canvas" ref={containerRef}>
        <div className="canvas-overlay">
          <div className="canvas-label">
            <span className="live-dot"></span>
            <span>LOADING SEMANTIC FIELD</span>
          </div>
        </div>
        
        {/* Loading state - show "Meaning..." text */}
        <div className="central-node loading-state">
          <div className="blob-wrapper-loading">
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

              <circle cx="200" cy="200" r="180" fill="url(#blobCore)" />

              <g filter="url(#goo)">
                <circle cx="200" cy="200" r="95" fill="#ccff33" fillOpacity="0.15" />
                <circle cx="155" cy="175" r="50" fill="#ccff33" fillOpacity="0.12" />
                <circle cx="245" cy="180" r="55" fill="#ccff33" fillOpacity="0.12" />
                <circle cx="220" cy="240" r="48" fill="#ccff33" fillOpacity="0.10" />
                <circle cx="170" cy="230" r="42" fill="#ccff33" fillOpacity="0.10" />
                <circle cx="195" cy="150" r="38" fill="#ccff33" fillOpacity="0.08" />
                <circle cx="240" cy="220" r="32" fill="#ccff33" fillOpacity="0.08" />
              </g>

              <path 
                d="M 200,90 C 260,82 310,120 325,170 C 340,220 318,275 270,300 C 220,325 155,315 115,280 C 75,245 70,185 95,140 C 120,95 165,88 200,90 Z" 
                fill="url(#blobInner)" 
                stroke="rgba(204,255,51,0.45)"
                strokeWidth="1.2" 
              />

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
            <span 
              className="word loading-text"
            >
              Meaning...
            </span>
          </div>
        </div>
      </div>
    )
  }

  const { related_words } = wordData
  const wordPositions = positionWords(related_words)

  const handleWordClick = (word, event) => {
    const clickedElement = event.currentTarget
    setAnimatingWord(word)
    setIsTransitioning(true)
    
    const container = clickedElement.parentElement
    if (container) {
      container.style.pointerEvents = 'none'
    }

    setTimeout(() => {
      navigate(`/exploration?word=${encodeURIComponent(word)}`)
      setIsTransitioning(false)
      setAnimatingWord(null)
      if (container) {
        container.style.pointerEvents = 'auto'
      }
    }, 600)
  }
  
  // Calculate blob edge radius for connection lines
  const blobRadius = Math.min(dimensions.width, dimensions.height) * 0.18

  return (
    <div className={`canvas ${isFading ? 'fading' : ''}`} ref={containerRef}>
      <div className="canvas-overlay">
        <div className="canvas-label">
          <span className="live-dot"></span>
          <span>LIVE SEMANTIC FIELD</span>
        </div>
      </div>

      {/* Concentric guide rings - dynamically sized */}
      <svg 
        className="concentric-rings" 
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <circle 
          cx={dimensions.width / 2} 
          cy={dimensions.height / 2} 
          r={Math.min(dimensions.width, dimensions.height) * 0.18} 
        />
        <circle 
          cx={dimensions.width / 2} 
          cy={dimensions.height / 2} 
          r={Math.min(dimensions.width, dimensions.height) * 0.27} 
          className="dashed" 
        />
        <circle 
          cx={dimensions.width / 2} 
          cy={dimensions.height / 2} 
          r={Math.min(dimensions.width, dimensions.height) * 0.36} 
        />
        <circle 
          cx={dimensions.width / 2} 
          cy={dimensions.height / 2} 
          r={Math.min(dimensions.width, dimensions.height) * 0.46} 
          className="dashed" 
        />
      </svg>

      {/* Connection lines SVG - dynamically calculated */}
      <svg className="connection-lines" width="100%" height="100%">
        {wordPositions.map((pos, index) => {
          const centerX = dimensions.width / 2
          const centerY = dimensions.height / 2
          
          // Blob edge (start point)
          const x1 = centerX + Math.cos(pos.angle) * blobRadius
          const y1 = centerY + Math.sin(pos.angle) * blobRadius
          
          // Word position (end point)
          const x2 = pos.x
          const y2 = pos.y
          
          return (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
            />
          )
        })}
      </svg>

      {/* Central node with organic blob - dynamically sized */}
      <div className="central-node">
        <div 
          className="blob-wrapper"
          style={{
            width: `${Math.min(dimensions.width, dimensions.height) * 0.45}px`,
            height: `${Math.min(dimensions.width, dimensions.height) * 0.45}px`
          }}
        >
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

            <circle cx="200" cy="200" r="180" fill="url(#blobCore)" />

            <g filter="url(#goo)">
              <circle cx="200" cy="200" r="95" fill="#ccff33" fillOpacity="0.15" />
              <circle cx="155" cy="175" r="50" fill="#ccff33" fillOpacity="0.12" />
              <circle cx="245" cy="180" r="55" fill="#ccff33" fillOpacity="0.12" />
              <circle cx="220" cy="240" r="48" fill="#ccff33" fillOpacity="0.10" />
              <circle cx="170" cy="230" r="42" fill="#ccff33" fillOpacity="0.10" />
              <circle cx="195" cy="150" r="38" fill="#ccff33" fillOpacity="0.08" />
              <circle cx="240" cy="220" r="32" fill="#ccff33" fillOpacity="0.08" />
            </g>

            <path 
              d="M 200,90 C 260,82 310,120 325,170 C 340,220 318,275 270,300 C 220,325 155,315 115,280 C 75,245 70,185 95,140 C 120,95 165,88 200,90 Z" 
              fill="url(#blobInner)" 
              stroke="rgba(204,255,51,0.45)"
              strokeWidth="1.2" 
            />

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
          <span 
            className="word"
            style={{ fontSize: `${getFontSize(32)}px` }}
          >
            {currentWord}
          </span>
        </div>
      </div>

      {/* Cluster words - dynamically positioned with collision avoidance */}
      <div className={`cluster-container ${hoveredWord ? 'has-hover' : ''}`}>
        {related_words.map((word, index) => {
          const pos = wordPositions[index]
          const tier = index % 3
          const baseFontSize = tier === 0 ? 16 : tier === 1 ? 14 : 12
          const fontSize = getFontSize(baseFontSize)
          
          return (
            <div
              key={index}
              className={`cluster-word clickable ${tier === 0 ? 'near' : tier === 1 ? 'medium' : 'far'} ${animatingWord === word ? 'animating-to-center' : ''} ${hoveredWord && hoveredWord !== word ? 'blurred' : ''} ${hoveredWord === word ? 'active-hover' : ''}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                fontSize: `${fontSize}px`,
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={(e) => handleWordClick(word, e)}
              onMouseEnter={() => !isTouchDevice && setHoveredWord(word)}
              onMouseLeave={() => !isTouchDevice && setHoveredWord(null)}
            >
              {word}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Canvas

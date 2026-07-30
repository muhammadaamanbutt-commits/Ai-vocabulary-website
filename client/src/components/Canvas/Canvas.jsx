import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Canvas.css'

function Canvas({ wordData, currentWord, isFading, clickedWord, onWordClick }) {
  const navigate = useNavigate()
  const [animatingWord, setAnimatingWord] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredWord, setHoveredWord] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const containerRef = useRef(null)

  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
      const noHover = window.matchMedia('(hover: none)').matches
      setIsTouchDevice(hasCoarsePointer || noHover)
    }

    checkTouchDevice()
  }, [])

  // ResizeObserver to track container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height })
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Get the effective radius for layout — use both axes to form an ellipse
  const getLayoutMetrics = useCallback(() => {
    const w = dimensions.width
    const h = dimensions.height
    const minDim = Math.min(w, h)
    const maxDim = Math.max(w, h)

    // Use area as primary sizing metric — handles narrow-but-tall or wide-but-short
    const area = w * h

    // Determine if we're on a small canvas
    const isSmall = area < 200000   // ~450x450 or ~400x500
    const isMedium = area < 350000  // ~600x600 or ~500x700

    return { w, h, minDim, maxDim, area, isSmall, isMedium }
  }, [dimensions])

  // Calculate font sizes based on available canvas area
  const getFontSize = useCallback((tier) => {
    const { area, isSmall, isMedium } = getLayoutMetrics()

    // Reference area: 800*700 = 560000
    const refArea = 560000
    // Scale factor based on area, with a floor
    const scale = Math.max(0.55, Math.sqrt(area / refArea))

    // Base sizes per tier at reference area
    const idealSizes = [17, 14.5, 12.5]   // near, medium, far
    const minSizes = [11, 10.5, 10]      // absolute minimums — tight but readable

    let size = idealSizes[tier] * scale

    // On very small canvases, allow smaller fonts to fit all words
    if (isSmall) {
      size = Math.max(size, minSizes[tier])
    } else if (isMedium) {
      size = Math.max(size, minSizes[tier] + 1)
    } else {
      // Large canvases: enforce comfortable minimums
      size = Math.max(size, 12)
    }

    // Cap maximum to avoid absurdly large text on huge screens
    const maxSizes = [22, 18, 16]
    return Math.min(Math.max(size, minSizes[tier]), maxSizes[tier])
  }, [getLayoutMetrics])

  // Get central word font size - dynamically scales to fit inside the blob
  const getCentralFontSize = useCallback((word) => {
    if (!word) return 24
    
    const minDim = Math.min(dimensions.width, dimensions.height)
    // The blob visual size is 0.42 of minDim, but text should fit in ~60% of blob diameter
    const maxTextWidth = minDim * 0.42 * 0.6
    
    // Estimate character width (0.6 is average ratio for most fonts)
    const charCount = word.length
    
    // Calculate font size that fits the word within maxTextWidth
    // Average char width is ~0.6em, so total width ≈ fontSize * charCount * 0.6
    let fontSize = maxTextWidth / (charCount * 0.6)
    
    // Apply min/max bounds based on screen size
    const { area } = getLayoutMetrics()
    const minSize = area < 200000 ? 16 : area < 350000 ? 18 : 20
    const maxSize = area < 200000 ? 28 : area < 350000 ? 36 : 44
    
    fontSize = Math.max(minSize, Math.min(fontSize, maxSize))
    
    return fontSize
  }, [dimensions, getLayoutMetrics])

  // Detect collision between labels with area-adaptive padding
  const detectCollision = useCallback((positions, newPos, tight) => {
    // Use tighter padding on small canvases
    const padX = tight ? 2 : 6
    const padY = tight ? 1 : 3

    for (const pos of positions) {
      const dx = Math.abs(newPos.x - pos.x)
      const dy = Math.abs(newPos.y - pos.y)

      const overlapX = (newPos.width + pos.width) / 2 + padX
      const overlapY = (newPos.height + pos.height) / 2 + padY

      if (dx < overlapX && dy < overlapY) {
        return true
      }
    }
    return false
  }, [])

  // Position words using elliptical distribution adapted to container shape
  const positionWords = useCallback((words) => {
    const total = words.length
    const positions = []
    const { w, h, area, isSmall } = getLayoutMetrics()
    const centerX = w / 2
    const centerY = h / 2

    // Adapt radius fraction to available space
    // On small canvases, use more of the space
    const radiusFraction = isSmall ? 0.38 : 0.34
    const radiusX = w * radiusFraction
    const radiusY = h * radiusFraction

    // Tighter margins on small canvases
    const marginFrac = isSmall ? 0.03 : 0.06
    const marginX = Math.max(20, w * marginFrac)
    const marginY = Math.max(15, h * marginFrac)

    // Golden angle for better distribution
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    words.forEach((word, index) => {
      const tier = index % 3
      const fontSize = getFontSize(tier)

      // Approximate label dimensions
      const labelWidth = word.length * fontSize * 0.55 + 8
      const labelHeight = fontSize * 1.4

      // Tier-based radius multiplier
      const tierMultiplier = 0.7 + (tier * 0.2)

      let baseAngle = index * goldenAngle
      let placed = false
      let bestPos = null
      let bestCollisions = Infinity

      // Phase 1: Try with normal collision detection (60 attempts)
      for (let attempt = 0; attempt < 60 && !placed; attempt++) {
        const angleStep = (Math.PI * 2) / 20  // finer angle steps
        const angleOffset = attempt * angleStep * 0.3
        const radiusBoost = 1 + (Math.floor(attempt / 15) * 0.06)

        const angle = baseAngle + angleOffset * (attempt % 2 === 0 ? 1 : -1)
        const rx = radiusX * tierMultiplier * radiusBoost
        const ry = radiusY * tierMultiplier * radiusBoost

        let x = centerX + Math.cos(angle) * rx
        let y = centerY + Math.sin(angle) * ry

        // Clamp within boundaries
        const halfW = labelWidth / 2
        const halfH = labelHeight / 2
        x = Math.max(marginX + halfW, Math.min(x, w - marginX - halfW))
        y = Math.max(marginY + halfH, Math.min(y, h - marginY - halfH))

        const newPos = {
          x, y,
          width: labelWidth,
          height: labelHeight,
          angle,
          radius: Math.sqrt(rx * rx + ry * ry)
        }

        if (!detectCollision(positions, newPos, isSmall)) {
          positions.push(newPos)
          placed = true
        } else {
          // Track the position with fewest collisions as fallback
          let collisions = 0
          for (const pos of positions) {
            const dx = Math.abs(newPos.x - pos.x)
            const dy = Math.abs(newPos.y - pos.y)
            if (dx < (newPos.width + pos.width) / 2 && dy < (newPos.height + pos.height) / 2) {
              collisions++
            }
          }
          if (collisions < bestCollisions) {
            bestCollisions = collisions
            bestPos = { ...newPos }
          }
        }
      }

      // Phase 2: Spiral outward with tight collision detection
      if (!placed) {
        for (let spiral = 0; spiral < 48 && !placed; spiral++) {
          const sAngle = baseAngle + spiral * (Math.PI / 8)
          const sRadius = 0.6 + (spiral * 0.04)

          let x = centerX + Math.cos(sAngle) * radiusX * sRadius
          let y = centerY + Math.sin(sAngle) * radiusY * sRadius

          const halfW = labelWidth / 2
          const halfH = labelHeight / 2
          x = Math.max(marginX + halfW, Math.min(x, w - marginX - halfW))
          y = Math.max(marginY + halfH, Math.min(y, h - marginY - halfH))

          const newPos = {
            x, y,
            width: labelWidth,
            height: labelHeight,
            angle: sAngle,
            radius: Math.sqrt(radiusX * radiusX + radiusY * radiusY) * sRadius
          }

          // Use tight collision detection
          if (!detectCollision(positions, newPos, true)) {
            positions.push(newPos)
            placed = true
          }
        }
      }

      // Phase 3: ALWAYS place the word — use best found position
      if (!placed) {
        if (bestPos) {
          positions.push(bestPos)
        } else {
          // Absolute last resort
          const angle = baseAngle
          let x = centerX + Math.cos(angle) * radiusX * tierMultiplier
          let y = centerY + Math.sin(angle) * radiusY * tierMultiplier
          const halfW = labelWidth / 2
          const halfH = labelHeight / 2
          x = Math.max(marginX + halfW, Math.min(x, w - marginX - halfW))
          y = Math.max(marginY + halfH, Math.min(y, h - marginY - halfH))
          positions.push({
            x, y,
            width: labelWidth,
            height: labelHeight,
            angle,
            radius: Math.sqrt(radiusX * radiusX + radiusY * radiusY) * tierMultiplier
          })
        }
      }
    })

    return positions
  }, [getLayoutMetrics, getFontSize, detectCollision])

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
              {clickedWord || currentWord}...
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
    const rect = clickedElement.getBoundingClientRect()
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }

    // Notify parent component if callback is provided
    if (onWordClick) {
      onWordClick(word, position)
    }

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

  // Calculate blob size based on smaller dimension
  const minDim = Math.min(dimensions.width, dimensions.height)
  const blobSize = minDim * 0.42
  const blobRadius = minDim * 0.15

  // Ring radii — use elliptical if container is non-square
  const ringRx = dimensions.width * 0.18
  const ringRy = dimensions.height * 0.18

  return (
    <div className={`canvas ${isFading ? 'fading' : ''}`} ref={containerRef}>
      <div className="canvas-overlay">
        <div className="canvas-label">
          <span className="live-dot"></span>
          <span>LIVE SEMANTIC FIELD</span>
        </div>
      </div>

      {/* Concentric guide rings - elliptical to match container shape */}
      <svg
        className="concentric-rings"
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <ellipse
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          rx={ringRx}
          ry={ringRy}
        />
        <ellipse
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          rx={ringRx * 1.5}
          ry={ringRy * 1.5}
          className="dashed"
        />
        <ellipse
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          rx={ringRx * 2}
          ry={ringRy * 2}
        />
        <ellipse
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          rx={ringRx * 2.55}
          ry={ringRy * 2.55}
          className="dashed"
        />
      </svg>

      {/* Connection lines SVG - dynamically calculated */}
      <svg className="connection-lines" width="100%" height="100%">
        {wordPositions.map((pos, index) => {
          const centerX = dimensions.width / 1.988
          const centerY = dimensions.height / 2

          // Blob edge (start point) — use angle to blob edge
          const angle = Math.atan2(pos.y - centerY, pos.x - centerX)
          const x1 = centerX + Math.cos(angle) * blobRadius
          const y1 = centerY + Math.sin(angle) * blobRadius

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
            width: `${blobSize}px`,
            height: `${blobSize}px`
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
            style={{ fontSize: `${getCentralFontSize(currentWord)}px` }}
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
          const fontSize = getFontSize(tier)

          return (
            <div
              key={index}
              className={`cluster-word clickable ${tier === 0 ? 'near' : tier === 1 ? 'medium' : 'far'} ${animatingWord === word ? 'animating-to-center' : ''} ${animatingWord && animatingWord !== word ? 'fade-sibling' : ''} ${hoveredWord && hoveredWord !== word ? 'blurred' : ''} ${hoveredWord === word ? 'active-hover' : ''}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                fontSize: `${fontSize}px`,
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '--index': index
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

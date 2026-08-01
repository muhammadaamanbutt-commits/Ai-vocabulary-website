import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation/Navigation'
import SearchBox from '../components/SearchBox/SearchBox'
import './Landing.css'

function useTypewriter(words, typingSpeed = 120, deletingSpeed = 80, pauseAfterTyping = 2000, pauseAfterDeleting = 500) {
  const [displayText, setDisplayText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const currentWord = words[wordIndex]

    if (isPaused) {
      return
    }

    const handleTyping = () => {
      if (!isDeleting) {
        // Typing forward
        if (charIndex < currentWord.length) {
          setDisplayText(currentWord.substring(0, charIndex + 1))
          setCharIndex(charIndex + 1)
        } else {
          // Finished typing, pause before deleting
          setIsPaused(true)
          setTimeout(() => {
            setIsPaused(false)
            setIsDeleting(true)
          }, pauseAfterTyping)
        }
      } else {
        // Deleting backward
        if (charIndex > 0) {
          setDisplayText(currentWord.substring(0, charIndex - 1))
          setCharIndex(charIndex - 1)
        } else {
          // Finished deleting, pause before next word
          setIsPaused(true)
          setTimeout(() => {
            setIsPaused(false)
            setIsDeleting(false)
            setWordIndex((prev) => (prev + 1) % words.length)
            setCharIndex(0)
            setDisplayText('')
          }, pauseAfterDeleting)
        }
      }
    }

    const timeout = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed)
    return () => clearTimeout(timeout)
  }, [charIndex, wordIndex, isDeleting, isPaused, words, typingSpeed, deletingSpeed, pauseAfterTyping, pauseAfterDeleting])

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(cursorInterval)
  }, [])

  return { text: displayText, showCursor }
}

function Landing() {
  const words = ['Hidden', 'Secret', 'Deeper', 'Unseen', 'Unknown', 'Underlying', 'Core']
  const { text, showCursor } = useTypewriter(words)

  return (
    <>
      <Navigation />
      <section className="landing">
        <div className="landing-bg"></div>

        {/* Floating decorative words */}
        <div className="float-node" style={{ top: '18%', left: '8%', animationDelay: '0s' }}>meaning</div>
        <div className="float-node" style={{ top: '25%', right: '10%', animationDelay: '2s' }}>context</div>
        <div className="float-node" style={{ bottom: '30%', left: '12%', animationDelay: '4s' }}>relation</div>
        <div className="float-node" style={{ bottom: '22%', right: '14%', animationDelay: '6s' }}>topology</div>
        <div className="float-node" style={{ top: '45%', left: '5%', animationDelay: '3s' }}>vector</div>
        <div className="float-node" style={{ top: '60%', right: '6%', animationDelay: '5s' }}>field</div>

        <div className="landing-content">
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            <span>SEMANTIC CARTOGRAPHY ENGINE · v0.4</span>
          </div>
          <h1>
            <i>Explore</i> Any Word's <br />
            <span className="accent-word">
              {text}
              <span className="typewriter-cursor" style={{ opacity: showCursor ? 1 : 0 }}>|</span>
            </span>  Connection
          </h1>
          <p className="subhead">Type any word to explore its meaning, its synonyms, and the ideas that surround it — mapped as a living, explorable network.</p>

          <SearchBox />
        </div>

        <div className="landing-footer">
          <div className="footer-meta">
            <span>© 2026 SEMANTIC COMPASS</span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span>CONCEPT LAB</span>
          </div>
          <div className="footer-links">
            <span>Privacy</span>
            <span>Terms</span>
            <span>API</span>
            <span>Docs</span>
            <span>Contact</span>
          </div>
        </div>
      </section>
    </>
  )
}

export default Landing

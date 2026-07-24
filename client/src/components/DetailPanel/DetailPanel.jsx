import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './DetailPanel.css'

function DetailPanel({ wordData, currentWord, isFading }) {
  const navigate = useNavigate()
  const [selectedField, setSelectedField] = useState(null)

  if (!wordData) {
    return (
      <aside className="detail-panel loading-state">
        <div className="detail-head">
          <div className="detail-breadcrumb">
            <span>ROOT</span>
            <span className="sep">/</span>
            <span>CONCEPT</span>
            <span className="sep">/</span>
            <span className="current">LOADING...</span>
          </div>
        </div>
        <div className="detail-body">
          <div className="loading-placeholder">
            <div className="loading-text">Fetching meaning...</div>
          </div>
        </div>
      </aside>
    )
  }

  const { definition, related_words, field_definitions } = wordData

  return (
    <aside className={`detail-panel ${isFading ? 'fading' : ''}`}>
      <div className="detail-head">
        <div className="detail-breadcrumb">
          <span>ROOT</span>
          <span className="sep">/</span>
          <span>CONCEPT</span>
          <span className="sep">/</span>
          <span className="current">{currentWord.toUpperCase()}</span>
        </div>
        <div className="detail-title-row">
          <div>
            <span className="detail-title">{currentWord}</span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-divider"></div>

        <div className="section-label">MAIN DEFINITION</div>
        <div className="detail-definition">{definition}</div>

        <div className="detail-divider"></div>

        <div className="section-label">RELATED WORDS ({related_words?.length || 0})</div>
        <div className="detail-synonyms">
          {related_words?.map((word, index) => (
            <span 
              key={index} 
              className={word === currentWord ? 'syn-chip live' : 'syn-chip'}
              onClick={() => navigate(`/exploration?word=${encodeURIComponent(word)}`)}
            >
              {word}
            </span>
          ))}
        </div>

        <div className="detail-divider"></div>

        <div className="section-label">FIELD DEFINITIONS</div>
        <div className="field-definitions-container">
          <div className="field-buttons">
            {field_definitions?.map((field, index) => (
              <button
                key={index}
                className={`field-btn ${selectedField === index ? 'active' : ''}`}
                onClick={() => setSelectedField(selectedField === index ? null : index)}
              >
                {field.field}
              </button>
            ))}
          </div>

          {selectedField !== null && field_definitions?.[selectedField] && (
            <div className="field-definition-display">
              <div className="field-def-header">{field_definitions[selectedField].field}</div>
              <div className="field-def-text">{field_definitions[selectedField].definition}</div>
            </div>
          )}
        </div>
      </div>

      <div className="detail-foot">
        <div className="ai-tag">
          <div className="ai-tag-left">
            <span className="ai-dot"></span>
            <span>AI-GENERATED CONTENT · GROQ LLAMA</span>
          </div>
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  )
}

export default DetailPanel

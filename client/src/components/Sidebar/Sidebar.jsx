import './Sidebar.css'

function Sidebar({ trailHistory, currentWord, onTrailClick }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-label">
          <span>TRAIL LOG</span>
          <span className="live-pip"></span>
        </div>
        <div className="session-tree">
          <svg className="tree-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="2" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="12" cy="18" r="2" />
            <line x1="7.5" y1="7.5" x2="10.5" y2="16.5" />
            <line x1="16.5" y1="7.5" x2="13.5" y2="16.5" />
          </svg>
          Active Session Tree
        </div>
      </div>
      <div className="sidebar-body">
        <div className="trail-list">
          {trailHistory.map((word, index) => (
            <div 
              key={index} 
              className={word === currentWord ? 'trail-item active' : 'trail-item'}
              onClick={() => onTrailClick(word)}
            >
              <div className="trail-word">{word}</div>
              <div className="trail-meta">
                <span>depth: {index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="sidebar-foot">
        <div className="stat-row">
          <span>Nodes visited</span>
          <span className="value accent">{trailHistory.length}</span>
        </div>
        <div className="stat-row">
          <span>Depth</span>
          <span className="value">{trailHistory.length}</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

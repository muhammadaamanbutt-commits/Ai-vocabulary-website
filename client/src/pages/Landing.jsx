import Navigation from '../components/Navigation/Navigation'
import SearchBox from '../components/SearchBox/SearchBox'
import './Landing.css'

function Landing() {
  return (
    <>
      <Navigation />
      <section className="landing">
        <div className="landing-bg"></div>

        {/* Floating decorative words */}
        <div className="float-node" style={{top: '18%', left: '8%', animationDelay: '0s'}}>meaning</div>
        <div className="float-node" style={{top: '25%', right: '10%', animationDelay: '2s'}}>context</div>
        <div className="float-node" style={{bottom: '30%', left: '12%', animationDelay: '4s'}}>relation</div>
        <div className="float-node" style={{bottom: '22%', right: '14%', animationDelay: '6s'}}>topology</div>
        <div className="float-node" style={{top: '45%', left: '5%', animationDelay: '3s'}}>vector</div>
        <div className="float-node" style={{top: '60%', right: '6%', animationDelay: '5s'}}>field</div>

        <div className="landing-content">
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            <span>SEMANTIC CARTOGRAPHY ENGINE · v0.4</span>
          </div>
          <h1>Navigate the<br/><span className="accent-word">Conceptual</span> Landscape</h1>
          <p className="subhead">A spatial interface for exploring the relationships between words, meanings, and the territories they define. Type any concept to map its semantic neighborhood.</p>

          <SearchBox />
        </div>

        <div className="landing-footer">
          <div className="footer-meta">
            <span>© 2026 SEMANTIC COMPASS</span>
            <span style={{opacity: 0.5}}>/</span>
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

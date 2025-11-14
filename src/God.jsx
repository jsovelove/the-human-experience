import './App.css'
import { Link } from 'react-router-dom'

function God() {
  return (
    <div className="app" style={{ backgroundColor: 'black' }}>
      <div className="content">
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '2rem' }}>GOD</h1>
          <p style={{ fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto 3rem' }}>
            Content about God will go here...
          </p>
          <Link 
            to="/explore" 
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontSize: '1.2rem',
              border: '1px solid white',
              padding: '1rem 2rem',
              borderRadius: '4px',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Diagram
          </Link>
        </div>
      </div>
    </div>
  )
}

export default God


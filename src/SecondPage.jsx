import { Link } from 'react-router-dom'
import './App.css'
import diagramImage from './assets/diagram.jpg'

function SecondPage() {
  const swatchStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '8px',
    display: 'inline-block',
    margin: '0 1rem'
  }

  return (
    <div className="app" style={{ backgroundColor: 'black' }}>
      <div className="content">
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', marginBottom: '2rem' }}>Here is what you need to know:</h1>
          
          <img 
            src={diagramImage} 
            alt="Diagram" 
            style={{ 
              maxWidth: '35%', 
              height: 'auto', 
              marginBottom: '2rem',
              borderRadius: '8px'
            }} 
          />
          
          <p style={{ color: 'white', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
            This diagram illustrates the key concepts and relationships that form the foundation of our understanding.
          </p>
          
          <Link to="/" style={{ color: 'white', textDecoration: 'underline' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SecondPage


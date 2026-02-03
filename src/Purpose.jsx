import './App.css'
import { Link } from 'react-router-dom'

function Purpose() {
  return (
    <div className="app" style={{ 
      backgroundColor: 'black', 
      minHeight: '100vh', 
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <div style={{ 
        padding: '3rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '3rem' }}>PURPOSE</h1>
          
          {/* First Image */}
          <div style={{ marginBottom: '3rem' }}>
            <img 
              src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1770093878/unnamed_illewb.png"
              alt="Purpose Image 1"
              style={{
                width: '80%',
                maxWidth: '800px',
                height: 'auto',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
          
          {/* Second Image */}
          <div style={{ marginBottom: '3rem' }}>
            <img 
              src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1770093947/January_30th_Minutes-1_ytzjys.png"
              alt="Purpose Image 2"
              style={{
                width: '80%',
                maxWidth: '800px',
                height: 'auto',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
          
          {/* Third Image */}
          <div style={{ marginBottom: '3rem' }}>
            <img 
              src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1770093947/January_30th_Minutes-2_uefdew.png"
              alt="Purpose Image 3"
              style={{
                width: '80%',
                maxWidth: '800px',
                height: 'auto',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>

          {/* Answers section */}
          <div style={{ 
            marginTop: '6rem',
            marginBottom: '4rem',
            maxWidth: '900px',
            margin: '6rem auto 4rem'
          }}>
            <h2 style={{
              fontFamily: 'monospace',
              fontSize: '2rem',
              color: 'white',
              marginBottom: '3rem',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              what are you meant to learn in this lifetime?
            </h2>

            <div style={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              color: 'white',
              lineHeight: '1.8',
              textAlign: 'left',
              padding: '0 2rem'
            }}>
              <p style={{ marginBottom: '2rem' }}>
                How much time to wait before asking if a table needs a top up on coffee.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                How to just be and become.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                I'll get back to you.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                I don't know yet.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                Find fulfillment outside of skating.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                To be brave.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                How to channel my love correctly. How to not let it get me in trouble.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                Nothing.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                Woman.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                How to play piano.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                Saturation + dissolution.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                To love myself.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                How to live for others.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                Nothing.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                I'm not completely certain.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                To have ease in resistance.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                Learning. Remembering. Cool riffs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Back button - fixed position */}
      <Link 
        to="/explore" 
        style={{ 
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          zIndex: 10,
          color: 'white', 
          textDecoration: 'none', 
          fontSize: '0.8rem',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '0.6rem 1.2rem',
          borderRadius: '4px',
          transition: 'all 0.3s ease',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'white'
          e.target.style.color = 'black'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(0,0,0,0.5)'
          e.target.style.color = 'white'
        }}
      >
        ← Back
      </Link>
    </div>
  )
}

export default Purpose


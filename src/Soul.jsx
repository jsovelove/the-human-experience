import './App.css'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'

function Soul() {
  // Enable scrolling by overriding body overflow
  useEffect(() => {
    document.body.style.overflowY = 'auto'
    document.body.style.overflowX = 'hidden'
    document.documentElement.style.overflowY = 'auto'
    document.documentElement.style.overflowX = 'hidden'
    const root = document.getElementById('root')
    if (root) {
      root.style.overflowY = 'auto'
      root.style.overflowX = 'hidden'
      root.style.height = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      if (root) {
        root.style.overflow = ''
        root.style.height = ''
      }
    }
  }, [])

  // Cloudinary image IDs
  const imageIds = [
    'soul17_xzycho',
    'soul16_krs78i',
    'soul15_whnwwg',
    'soul14_sii3a3',
    'soul10_zmmhq7',
    'soul13_vxxlen',
    'soul12_oif5tw',
    'soul11_zphb7k',
    'soul9_rlk43c',
    'soul8_yqgf3r',
    'soul7_lqmts9',
    'soul6_kqsbzv',
    'soul5_wyvcjp',
    'soul4_wzzogk',
    'soul3_ivuzbz',
    'soul1_wjjjri',
    'soul2_f7kf9t'
  ]

  const cloudinaryBaseUrl = 'https://res.cloudinary.com/dgbrj4suu/image/upload'

  return (
    <div style={{ 
      backgroundColor: 'black', 
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden'
    }}>
      {/* Hero image at top */}
      <div style={{
        width: '100%',
        padding: '1rem',
        paddingBottom: '2rem',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <img
          src={`${cloudinaryBaseUrl}/2900f905202497bee2deff0b64b6cd8d_zn1emu`}
          alt="Soul Hero"
          style={{
            width: '100%',
            maxWidth: '600px',
            height: 'auto',
            display: 'block'
          }}
          loading="eager"
        />
      </div>

      {/* Image grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '1rem',
        width: '100%',
        padding: '1rem',
        paddingBottom: '5rem',
        boxSizing: 'border-box'
      }}>
        {imageIds.map((imageId, index) => (
          <div
            key={imageId}
            style={{
              overflow: 'hidden',
              position: 'relative',
              maxWidth: '100%'
            }}
          >
            <img
              src={`${cloudinaryBaseUrl}/${imageId}`}
              alt={`Soul ${index + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxWidth: '100%'
              }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Back button */}
      <Link 
        to="/explore" 
        style={{ 
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          zIndex: 10,
          color: 'white', 
          textDecoration: 'none', 
          fontSize: '1rem',
          border: '1px solid rgba(255,255,255,0.5)',
          padding: '0.8rem 1.6rem',
          borderRadius: '4px',
          display: 'inline-block',
          transition: 'all 0.3s ease',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          textShadow: '0 0 10px rgba(0,0,0,0.8)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'white'
          e.target.style.color = 'black'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(0,0,0,0.7)'
          e.target.style.color = 'white'
        }}
      >
        ← Back to Diagram
      </Link>
    </div>
  )
}

export default Soul


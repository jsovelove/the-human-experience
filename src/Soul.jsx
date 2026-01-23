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
    
    // Add font-face for custom font and noise texture styles
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'SoulFont';
        src: url('/fonts/FA_KVVPUFNXWX.ttf') format('truetype');
      }
      
      .noise-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0.15;
        z-index: 1000;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        mix-blend-mode: overlay;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      if (root) {
        root.style.overflow = ''
        root.style.height = ''
      }
      document.head.removeChild(style)
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

  // Scattered positioning for images with fixed pixel values - no overlap
  const imagePositions = [
    { top: '150px', left: '5%', width: '22%' },       // 01
    { top: '100px', left: '60%', width: '25%' },      // 02
    { top: '600px', left: '30%', width: '28%' },      // 03
    { top: '550px', left: '8%', width: '20%' },       // 04
    { top: '1050px', left: '65%', width: '22%' },     // 05
    { top: '1500px', left: '10%', width: '24%' },     // 06
    { top: '1450px', left: '50%', width: '22%' },     // 07
    { top: '1950px', left: '5%', width: '20%' },      // 08
    { top: '1900px', left: '60%', width: '26%' },     // 09
    { top: '2400px', left: '35%', width: '24%' },     // 10
    { top: '2850px', left: '8%', width: '20%' },      // 11
    { top: '2800px', left: '65%', width: '26%' },     // 12
    { top: '3300px', left: '30%', width: '22%' },     // 13
    { top: '3750px', left: '10%', width: '25%' },     // 14
    { top: '3700px', left: '60%', width: '24%' },     // 15
    { top: '4200px', left: '5%', width: '28%' },      // 16
    { top: '4650px', left: '50%', width: '26%' }      // 17
  ]

  return (
    <div style={{ 
      backgroundColor: 'black', 
      minHeight: '5200px',
      width: '100%',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Noise/Paper Texture Overlay */}
      <div className="noise-overlay"></div>
      
      {/* Title */}
      <h1 style={{
        fontFamily: 'SoulFont, serif',
        fontSize: '12rem',
        color: 'white',
        textAlign: 'center',
        padding: '1rem 0 0 0',
        margin: 0,
        fontWeight: 'normal',
        lineHeight: '0.9'
      }}>
        soul
      </h1>

      {/* Scattered images with numbering */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '5000px',
        paddingBottom: '5rem'
      }}>
        {imageIds.map((imageId, index) => (
          <div
            key={imageId}
            style={{
              position: 'absolute',
              ...imagePositions[index]
            }}
          >
            <img
              src={`${cloudinaryBaseUrl}/${imageId}`}
              alt={`Soul ${index + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
              loading="lazy"
            />
            {/* Numbering below image */}
            <div style={{
              fontSize: '0.75rem',
              color: 'white',
              fontFamily: 'monospace',
              marginTop: '0.5rem',
              textAlign: 'right'
            }}>
              ({String(index + 1).padStart(2, '0')})
            </div>
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


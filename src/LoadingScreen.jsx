import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

function LoadingScreen() {
  const { active, progress, errors, item, loaded, total } = useProgress()
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!active && progress === 100) {
      // Delay hiding to ensure smooth transition
      const timer = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timer)
    }
  }, [active, progress])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'black',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      transition: 'opacity 0.5s ease',
      opacity: active ? 1 : 0
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '2rem',
          fontWeight: 300,
          letterSpacing: '2px'
        }}>
          Loading...
        </h2>
        
        {/* Progress Bar Container */}
        <div style={{
          width: '300px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          {/* Progress Fill */}
          <div style={{
            height: '100%',
            backgroundColor: 'white',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
            borderRadius: '2px'
          }} />
        </div>
        
        {/* Progress Percentage */}
        <p style={{
          marginTop: '1rem',
          fontSize: '0.9rem',
          fontWeight: 300,
          opacity: 0.7
        }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen


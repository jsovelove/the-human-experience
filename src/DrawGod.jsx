import './App.css'
import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'

function DrawGod() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState(null)
  const brushSize = 3
  const brushColor = '#000000'

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      setContext(ctx)
      
      // Set canvas size to window size
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Fill with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    const handleResize = () => {
      if (canvas && context) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.putImageData(imageData, 0, 0)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const startDrawing = (e) => {
    if (!context) return
    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing || !context) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    context.strokeStyle = brushColor
    context.lineWidth = brushSize
    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    if (!context) return
    setIsDrawing(false)
    context.closePath()
  }

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  const downloadDrawing = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'my-drawing-of-god.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div 
      className="app" 
      style={{ 
        backgroundColor: '#f5f5f5', 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Title */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        color: '#333',
        fontSize: '2rem',
        fontWeight: '200',
        letterSpacing: '0.3em',
        textAlign: 'center',
        pointerEvents: 'none',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        DRAW GOD
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          cursor: 'crosshair',
          display: 'block',
          backgroundColor: '#ffffff'
        }}
      />

      {/* Tools Panel */}
      <div style={{
        position: 'fixed',
        top: '50%',
        right: '2rem',
        transform: 'translateY(-50%)',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minWidth: '150px'
      }}>
        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          style={{
            background: '#fff',
            border: '1px solid rgba(0, 0, 0, 0.2)',
            color: '#333',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: '0.7rem 1rem',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            letterSpacing: '0.1em',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#ff4444'
            e.target.style.color = 'white'
            e.target.style.borderColor = '#ff4444'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#fff'
            e.target.style.color = '#333'
            e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)'
          }}
        >
          CLEAR
        </button>

        {/* Download Button */}
        <button
          onClick={downloadDrawing}
          style={{
            background: '#333',
            border: '1px solid #333',
            color: 'white',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: '0.7rem 1rem',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            letterSpacing: '0.1em',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#000'
            e.target.style.borderColor = '#000'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#333'
            e.target.style.borderColor = '#333'
          }}
        >
          DOWNLOAD
        </button>
      </div>

      {/* Back button */}
      <Link 
        to="/god" 
        style={{ 
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          zIndex: 10,
          color: '#333',
          textDecoration: 'none', 
          fontSize: '0.9rem',
          border: '1px solid rgba(0, 0, 0, 0.2)',
          padding: '0.8rem 1.5rem',
          borderRadius: '4px',
          transition: 'all 0.3s ease',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          letterSpacing: '0.1em',
          fontWeight: '400',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#333'
          e.target.style.color = 'white'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
          e.target.style.color = '#333'
        }}
      >
        ← BACK
      </Link>
    </div>
  )
}

export default DrawGod

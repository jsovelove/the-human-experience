import './App.css'
import { useEffect, useRef, useState } from 'react'
import baseImage from './assets/diagram/base.png'
import godImage from './assets/diagram/god.png'
import loveImage from './assets/diagram/love.png'
import purposeImage from './assets/diagram/purpose.png'
import selfImage from './assets/diagram/self.png'
import soulImage from './assets/diagram/soul.png'

function SecondPage() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hoveredLayer, setHoveredLayer] = useState(null)
  const [loadedImages, setLoadedImages] = useState([])
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const layers = [
    { src: baseImage, name: 'base', link: null },
    { src: godImage, name: 'god', link: '#god' },
    { src: loveImage, name: 'love', link: '#love' },
    { src: purposeImage, name: 'purpose', link: '#purpose' },
    { src: selfImage, name: 'self', link: '#self' },
    { src: soulImage, name: 'soul', link: '#soul' },
  ]

  // Load all images
  useEffect(() => {
    const promises = layers.map((layer) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ ...layer, image: img })
        img.src = layer.src
      })
    })

    Promise.all(promises).then((images) => {
      setLoadedImages(images)
      if (images[0]?.image) {
        const img = images[0].image
        const maxWidth = window.innerWidth * 0.9
        const maxHeight = window.innerHeight * 0.9
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
        setCanvasSize({
          width: img.width * scale,
          height: img.height * scale
        })
      }
    })
  }, [])

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || loadedImages.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all layers slightly dimmed so the hovered one pops consistently
    if (hoveredLayer) {
      ctx.save()
      ctx.globalAlpha = 0.4
    }

    loadedImages.forEach((layer) => {
      ctx.drawImage(layer.image, 0, 0, canvas.width, canvas.height)
    })

    if (hoveredLayer) {
      ctx.restore()
    }

    // If there's a hovered layer, draw it again with a strong glow on top
    if (hoveredLayer) {
      const hoveredLayerObj = loadedImages.find(l => l.name === hoveredLayer)
      if (hoveredLayerObj) {
        ctx.save()

        // Inner bright glow
        ctx.shadowColor = 'rgba(255, 255, 255, 1)'
        ctx.shadowBlur = 40
        ctx.drawImage(hoveredLayerObj.image, 0, 0, canvas.width, canvas.height)

        // Middle softer glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)'
        ctx.shadowBlur = 80
        ctx.drawImage(hoveredLayerObj.image, 0, 0, canvas.width, canvas.height)

        // Outer wide glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)'
        ctx.shadowBlur = 120
        ctx.drawImage(hoveredLayerObj.image, 0, 0, canvas.width, canvas.height)

        ctx.restore()
      }
    }
  }, [loadedImages, hoveredLayer, canvasSize])

  const handleMouseMove = (e) => {
    if (!canvasRef.current || loadedImages.length === 0) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    // Check layers from top to bottom
    for (let i = loadedImages.length - 1; i >= 0; i--) {
      const layer = loadedImages[i]
      if (!layer.link) continue // Skip base layer

      // Create a temporary canvas to check a small area around the cursor
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(layer.image, 0, 0, canvas.width, canvas.height)

      // Define a square region around the cursor to make the hit area more generous
      const radius = 25
      const startX = Math.max(0, Math.floor(x - radius))
      const startY = Math.max(0, Math.floor(y - radius))
      const width = Math.min(canvas.width - startX, radius * 2 + 1)
      const height = Math.min(canvas.height - startY, radius * 2 + 1)

      const pixelData = tempCtx.getImageData(startX, startY, width, height).data

      // Look for any non-transparent pixel in this region
      for (let p = 3; p < pixelData.length; p += 4) {
        const alpha = pixelData[p]
        if (alpha > 10) {
          setHoveredLayer(layer.name)
          return
        }
      }
    }

    setHoveredLayer(null)
  }

  const handleClick = (e) => {
    if (hoveredLayer) {
      const layer = loadedImages.find(l => l.name === hoveredLayer)
      if (layer?.link) {
        window.location.href = layer.link
      }
    }
  }

  return (
    <div className="app" style={{ backgroundColor: 'black' }}>
      <div className="content">
        <div ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredLayer(null)}
            onClick={handleClick}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              cursor: hoveredLayer ? 'pointer' : 'default'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default SecondPage


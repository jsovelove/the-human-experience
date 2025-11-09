import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import './App.css'

// Import videos
import backgroundVideo from './assets/videos/humanExperienceVideoCollage.mp4'
import diagramImage from './assets/diagram.jpg'
import spriteSheet from './assets/title-sprite-sheet.png'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const totalAssets = 3 // sprite sheet + video + diagram
        let loadedAssets = 0

        // Preload sprite sheet
        const spritePromise = new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            loadedAssets++
            setLoadProgress(Math.round((loadedAssets / totalAssets) * 100))
            resolve()
          }
          img.onerror = reject
          img.src = spriteSheet
        })

        // Preload diagram image
        const diagramPromise = new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            loadedAssets++
            setLoadProgress(Math.round((loadedAssets / totalAssets) * 100))
            resolve()
          }
          img.onerror = reject
          img.src = diagramImage
        })

        await Promise.all([spritePromise, diagramPromise])

        // Preload video
        if (videoRef.current) {
          await new Promise((resolve) => {
            const video = videoRef.current
            const onCanPlay = () => {
              loadedAssets++
              setLoadProgress(100)
              video.removeEventListener('canplaythrough', onCanPlay)
              resolve()
            }
            video.addEventListener('canplaythrough', onCanPlay)
            video.load()
          })
        }

        // Small delay to ensure smooth transition
        setTimeout(() => {
          setIsLoading(false)
        }, 300)
      } catch (error) {
        console.error('Error preloading assets:', error)
        setIsLoading(false)
      }
    }

    preloadAssets()
  }, [])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>Loading Experience...</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${loadProgress}%` }}></div>
          </div>
          <p>{loadProgress}%</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <video 
        ref={videoRef}
        className="background-video" 
        autoPlay 
        loop 
        muted 
        playsInline
        preload="auto"
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className="content">
        <Link to="/explore" className="frame-link">
          <div className="sprite-animation-container"></div>
        </Link>
      </div>
    </div>
  )
}

export default App

import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import './App.css'

// Import videos
import backgroundVideo from './assets/videos/humanExperienceVideoCollage.mp4'
import diagramImage from './assets/diagram.jpg'

// Import frames
import frame1 from './assets/title-frames-transparent/frame1.png'
import frame2 from './assets/title-frames-transparent/frame2.png'
import frame3 from './assets/title-frames-transparent/frame3.png'
import frame4 from './assets/title-frames-transparent/frame4.png'
import frame5 from './assets/title-frames-transparent/frame5.png'
import frame6 from './assets/title-frames-transparent/frame6.png'
import frame7 from './assets/title-frames-transparent/frame7.png'
import frame8 from './assets/title-frames-transparent/frame8.png'
import frame9 from './assets/title-frames-transparent/frame9.png'
import frame10 from './assets/title-frames-transparent/frame10.png'
import frame11 from './assets/title-frames-transparent/frame11.png'
import frame12 from './assets/title-frames-transparent/frame12.png'

const frames = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8, frame9, frame10, frame11, frame12]

function App() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const totalAssets = frames.length + 2 // frames + video + diagram
        let loadedAssets = 0

        // Preload all PNG frames
        const imagePromises = frames.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
              loadedAssets++
              setLoadProgress(Math.round((loadedAssets / totalAssets) * 100))
              resolve()
            }
            img.onerror = reject
            img.src = src
          })
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

        await Promise.all([...imagePromises, diagramPromise])

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

  useEffect(() => {
    if (isLoading) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length)
    }, 100) // 100ms per frame = 10 fps

    return () => clearInterval(interval)
  }, [isLoading])

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
          <img 
            src={frames[currentFrame]} 
            alt="The Human Experience"
            className="frame-animation"
          />
        </Link>
      </div>
    </div>
  )
}

export default App

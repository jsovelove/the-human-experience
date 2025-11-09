import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

// Import video
import backgroundVideo from './assets/videos/humanExperienceVideoCollage.mp4'

// Import all frames (transparent versions)
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

const frames = [
  frame1, frame2, frame3, frame4, frame5, frame6,
  frame7, frame8, frame9, frame10, frame11, frame12
]

function App() {
  const [currentFrame, setCurrentFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length)
    }, 100) // Change frame every 100ms (adjust for desired speed)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className="content">
        <Link to="/explore" className="frame-link">
          <img 
            src={frames[currentFrame]} 
            alt="Handdrawn text animation" 
            className="frame-animation"
          />
        </Link>
      </div>
    </div>
  )
}

export default App

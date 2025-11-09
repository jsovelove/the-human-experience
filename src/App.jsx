import { Link } from 'react-router-dom'
import './App.css'

// Import videos
import backgroundVideo from './assets/videos/humanExperienceVideoCollage.mp4'
import titleAnimation from './assets/title-animation.webm'

function App() {

  return (
    <div className="app">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className="content">
        <Link to="/explore" className="frame-link">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="frame-animation"
          >
            <source src={titleAnimation} type="video/webm" />
          </video>
        </Link>
      </div>
    </div>
  )
}

export default App

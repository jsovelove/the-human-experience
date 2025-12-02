import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import ModelParticles from './ModelParticles'
import ImagePlane from './ImagePlane'
import ParticleAura from './SpiralEmitter'
import LikertScale from './LikertScale'
import IntroImage from './IntroImage'
import * as THREE from 'three'

// Camera controller that animates to target positions
function CameraController({ targetPosition, isZoomedIn, defaultPosition, controlsRef }) {
  const { camera } = useThree()
  const smoothedPosition = useRef(new THREE.Vector3(...defaultPosition))
  const smoothedLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const wasZoomedIn = useRef(false)
  
  useFrame(() => {
    if (isZoomedIn && targetPosition) {
      // Zoomed into an image - animate to photo
      wasZoomedIn.current = true
      
      const photoPos = new THREE.Vector3(...targetPosition)
      const defaultPos = new THREE.Vector3(...defaultPosition)
      
      // Direction from photo to default camera position
      const dir = defaultPos.clone().sub(photoPos)
      const distance = Math.max(dir.length(), 1)
      dir.normalize()
      
      // Keep camera slightly away from photo along this direction
      const viewDistance = Math.min(distance, 2.5)
      const goalPosition = photoPos.clone().add(dir.multiplyScalar(viewDistance))
      const goalLookAt = photoPos.clone()
      
      smoothedPosition.current.lerp(goalPosition, 0.05)
      smoothedLookAt.current.lerp(goalLookAt, 0.05)
      
      camera.position.copy(smoothedPosition.current)
      camera.lookAt(smoothedLookAt.current)
      
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.copy(smoothedLookAt.current)
        controlsRef.current.update()
      }
    } else if (wasZoomedIn.current) {
      // Just exited zoom mode - animate back to default position
      const goalPosition = new THREE.Vector3(...defaultPosition)
      const goalLookAt = new THREE.Vector3(0, 0, 0)
      
      smoothedPosition.current.lerp(goalPosition, 0.05)
      smoothedLookAt.current.lerp(goalLookAt, 0.05)
      
      camera.position.copy(smoothedPosition.current)
      camera.lookAt(smoothedLookAt.current)
      
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.copy(smoothedLookAt.current)
        controlsRef.current.update()
      }
      
      // Check if we're close enough to default position to stop animating
      const distanceToDefault = camera.position.distanceTo(goalPosition)
      if (distanceToDefault < 0.1) {
        wasZoomedIn.current = false
      }
    }
    // Otherwise, let OrbitControls handle everything
  })
  
  return null
}

// Generate consistent image positions
function getImagePositions(count) {
  const seededRandom = (seed) => {
    const x = Math.sin(seed * 9999) * 10000
    return x - Math.floor(x)
  }
  
  const positions = []
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5
    const theta = seededRandom(seed) * Math.PI * 2
    const phi = Math.acos(2 * seededRandom(seed + 1) - 1)
    const r = 12 + seededRandom(seed + 2) * 16
    
    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = (r * Math.cos(phi)) * 0.5
    const z = r * Math.sin(phi) * Math.sin(theta) * 0.3 - 8
    
    positions.push([x, y, z])
  }
  return positions
}

// Scene content with tiny photo particles floating in the aura
function SceneContent({ imageUrls, onImageClick, selectedIndex, isZoomedIn, imagePositions, showIntro, onIntroComplete, cloudName, isTransitioning }) {
  const imageData = useMemo(() => {
    return imageUrls.map((url, i) => ({
      url,
      position: imagePositions[i],
      scale: 0.08
    }))
  }, [imageUrls, imagePositions])
  
  return (
    <>
      {/* Intro image that dissolves */}
      {showIntro && (
        <IntroImage 
          imageUrl={`https://res.cloudinary.com/${cloudName}/image/upload/d12105f5-62db-469d-be53-26b48fe0aaf4_j88lw8.png`}
          onDismiss={onIntroComplete}
        />
      )}
      
      {/* Scene lighting */}
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#4466ff" intensity={0.3} />
      <pointLight position={[0, 5, 0]} color="#ffffff" intensity={0.5} />
      
      {/* Three particle models side by side - all white, very gentle buzzing, stretched on z-axis */}
      <group position={[0, 0, 0]}>
        {/* Left model */}
        <ModelParticles 
          modelPath="/low_poly_dummy__human_figure.glb"
          color="#ffffff"
          size={0.04}
          density={0.5}
          autoRotate={false}
          noiseStrength={0.1}
          noiseSpeed={1.0}
          violent={true}
          position={[-8, 0, 0]}
          scale={[1.3, 1.3, 2.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          isTransitioning={isTransitioning}
        />
        
        {/* Center model */}
        <ModelParticles 
          modelPath="/low_poly_dummy__human_figure.glb"
          color="#ffffff"
          size={0.04}
          density={0.5}
          autoRotate={false}
          noiseStrength={0.1}
          noiseSpeed={1.0}
          violent={true}
          position={[0, 0, 0]}
          scale={[1.3, 1.3, 2.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          isTransitioning={isTransitioning}
        />
        
        {/* Right model */}
        <ModelParticles 
          modelPath="/low_poly_dummy__human_figure.glb"
          color="#ffffff"
          size={0.04}
          density={0.5}
          autoRotate={false}
          noiseStrength={0.1}
          noiseSpeed={1.0}
          violent={true}
          position={[8, 0, 0]}
          scale={[1.3, 1.3, 2.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          isTransitioning={isTransitioning}
        />
      </group>
      
      {/* Energetic particle aura surrounding the figures */}
      <ParticleAura 
        count={3000}
        color="#aabbcc"
        size={0.03}
        spread={24}
        height={16}
        driftSpeed={0.8}
        isTransitioning={isTransitioning}
      />
      
      {/* Tiny photo particles floating in the aura */}
      {imageData.map((img, index) => (
        <Suspense key={index} fallback={null}>
          <ImagePlane
            url={img.url}
            position={img.position}
            scale={img.scale}
            index={index}
            isSelected={index === selectedIndex}
            isZoomedIn={isZoomedIn && index === selectedIndex}
            onClick={() => onImageClick(index)}
          />
        </Suspense>
      ))}
      
      {/* Post-processing effects - Lo-fi aesthetic */}
      <EffectComposer>
        <Bloom 
          intensity={0.3} 
          luminanceThreshold={0.3} 
          luminanceSmoothing={0.2} 
          height={300} 
        />
        <Noise opacity={0.08} />
        <Vignette eskil={false} offset={0.15} darkness={1.2} />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </>
  )
}

function God() {
  const navigate = useNavigate()
  
  // Cloudinary configuration
  const cloudName = 'dgbrj4suu'
  
  const imageIds = [
    '7_page4_ncqs7w',
    '15_page4_lcicci',
    '17_page4_ixthmq',
    '14_page4_xvwgby',
    '16_page4_qviww4',
    '13_page4_r5ptw6',
    '12_page4_uer6lc',
    '11_page4_stnplx',
    '8_page4_t5ms6w',
    '4_page4_qoxte7',
    '10_page4_eccsha',
    '9_page4_fdyfhv',
    '2_page4_n4wti4',
    '3_page4_sfajxx',
    '6_page4_gavj8x',
    '1_page4_wf3q9j',
    '5_page4_ojdw6u'
  ]
  
  // Generate Cloudinary URLs
  const getCloudinaryUrl = (imageId) => {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${imageId}.png`
  }
  
  const imageUrls = imageIds.map(id => getCloudinaryUrl(id))

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [isZoomedIn, setIsZoomedIn] = useState(false)
  const [showData, setShowData] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [likertData, setLikertData] = useState([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [fadeOverlay, setFadeOverlay] = useState(0)
  const controlsRef = useRef(null)
  
  // Pre-calculate image positions
  const imagePositions = useMemo(() => getImagePositions(imageIds.length), [imageIds.length])
  const defaultCameraPosition = [0, 0, 35]

  // Navigation functions
  const goToPrevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + imageIds.length) % imageIds.length)
  }
  
  const goToNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % imageIds.length)
  }
  
  const toggleZoom = () => {
    setIsZoomedIn(!isZoomedIn)
  }
  
  const zoomOut = () => {
    setIsZoomedIn(false)
  }
  
  // Handle transition to Questions for God page
  const handleTransitionToQuestions = (e) => {
    e.preventDefault()
    setIsTransitioning(true)
    
    // Start particle dispersion and fade overlay after particles have dispersed a bit
    setTimeout(() => {
      let fadeProgress = 0
      const fadeInterval = setInterval(() => {
        // Smooth ease-in fade
        fadeProgress += 0.012 // Slightly slower fade
        const easedFade = fadeProgress < 0.5 
          ? 2 * fadeProgress * fadeProgress 
          : 1 - Math.pow(-2 * fadeProgress + 2, 2) / 2
        
        setFadeOverlay(easedFade)
        
        if (fadeProgress >= 1) {
          clearInterval(fadeInterval)
          // Navigate to questions page
          navigate('/questions-for-god')
        }
      }, 16) // ~60fps
    }, 1800) // Wait for particles to disperse more
  }

  // Helper to parse CSV respecting quoted commas
  const parseCsvLine = (line) => {
    const values = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    if (current.length > 0 || line.endsWith(',')) {
      values.push(current.trim())
    }

    return values
  }

  // Load and parse CSV data
  useEffect(() => {
    fetch('/likert-scale-data.csv')
      .then(response => response.text())
      .then(csvText => {
        const lines = csvText.trim().split('\n').filter(Boolean)
        if (lines.length === 0) return

        const headers = parseCsvLine(lines[0]).map(h => h.trim().replace(/^["']|["']$/g, ''))

        const data = lines.slice(1)
          .map(line => parseCsvLine(line))
          .filter(row => row.length > 0)
          .map(row => {
            const normalizedRow = headers.map((_, idx) => row[idx] ?? '')
            return normalizedRow.map(value => parseFloat(value) || 0)
          })
        
        const processedData = headers.map((question, qIndex) => {
          const validValues = data.map(row => row[qIndex]).filter(v => v > 0 && v <= 5)
          
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          
          validValues.forEach(value => {
            const roundedValue = Math.round(value)
            if (roundedValue >= 1 && roundedValue <= 5) {
              distribution[roundedValue]++
            }
          })
          
          const avg = validValues.reduce((sum, val) => sum + val, 0) / (validValues.length || 1)
          
          return {
            question: question,
            average: validValues.length ? avg.toFixed(2) : '0.00',
            distribution: distribution,
            total: validValues.length
          }
        })
        
        setLikertData(processedData)
      })
      .catch(err => console.error('Error loading CSV:', err))
  }, [])  

  return (
    <div className="app" style={{ backgroundColor: 'black', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Full-screen Three.js Scene */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 35], fov: 55 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black'
        }}
      >
        <Suspense fallback={null}>
          <SceneContent 
            imageUrls={imageUrls} 
            selectedIndex={selectedPhotoIndex}
            isZoomedIn={isZoomedIn}
            imagePositions={imagePositions}
            showIntro={showIntro}
            onIntroComplete={() => setShowIntro(false)}
            cloudName={cloudName}
            isTransitioning={isTransitioning}
            onImageClick={(index) => {
              setSelectedPhotoIndex(index)
              setIsZoomedIn(true)
            }}
          />
          
          {/* Camera controller for zooming into photos */}
          <CameraController 
            targetPosition={imagePositions[selectedPhotoIndex]}
            isZoomedIn={isZoomedIn}
            defaultPosition={defaultCameraPosition}
            controlsRef={controlsRef}
          />
          
          {/* Orbit controls for looking around - disabled when viewing a specific image */}
          <OrbitControls 
            ref={controlsRef}
            enabled={!isZoomedIn}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            autoRotate={false}
            minDistance={5}
            maxDistance={60}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
      
      {/* Navigation controls - centered at bottom */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        opacity: showIntro ? 0 : 1,
        transition: 'opacity 1s ease',
        pointerEvents: showIntro ? 'none' : 'auto'
      }}>
        <button
          onClick={() => {
            setIsZoomedIn(true)
            setShowData(false)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease',
            opacity: isZoomedIn && !showData ? 1 : 0.5,
            padding: 0,
            outline: 'none',
            letterSpacing: '0.05em',
            fontWeight: isZoomedIn && !showData ? '600' : '400'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = isZoomedIn && !showData ? '1' : '0.5'}
        >
          DRAWINGS
        </button>
        
        <button
          onClick={() => {
            setShowData(true)
            setIsZoomedIn(false)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease',
            opacity: showData ? 1 : 0.5,
            padding: 0,
            outline: 'none',
            letterSpacing: '0.05em',
            fontWeight: showData ? '600' : '400'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = showData ? '1' : '0.5'}
        >
          DATA
        </button>
        
        <Link 
          to="/draw-god" 
          style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '0.8rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease',
            opacity: 0.5,
            padding: 0,
            outline: 'none',
            letterSpacing: '0.05em',
            fontWeight: '400',
            background: 'transparent'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.5'}
        >
          PLEASE DRAW GOD
        </Link>
        
        <a 
          href="/questions-for-god"
          onClick={handleTransitionToQuestions}
          style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '0.8rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease',
            opacity: 0.5,
            padding: 0,
            outline: 'none',
            letterSpacing: '0.05em',
            fontWeight: '400',
            background: 'transparent'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.5'}
        >
          QUESTIONS FOR GOD
        </a>
      </div>

      {/* Photo navigation arrows - only show when viewing images */}
      {isZoomedIn && !showData && (
        <div style={{
          position: 'fixed',
          bottom: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          opacity: showIntro ? 0 : 1,
          transition: 'opacity 1s ease',
          pointerEvents: showIntro ? 'none' : 'auto'
        }}>
          <button
            onClick={goToPrevPhoto}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease',
              opacity: 0.7,
              padding: 0,
              outline: 'none'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            ←
          </button>
          
          <button
            onClick={() => setIsZoomedIn(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease',
              opacity: 0.7,
              padding: 0,
              outline: 'none'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            ✕
          </button>
          
          <button
            onClick={goToNextPhoto}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease',
              opacity: 0.7,
              padding: 0,
              outline: 'none'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            →
          </button>
        </div>
      )}

      {/* Data overlay - show Likert scale data */}
      {showData && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          padding: '3rem',
          borderRadius: '12px',
          width: '90vw',
          maxWidth: '1400px',
          height: '85vh',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setShowData(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                opacity: 0.7,
                padding: 0,
                outline: 'none'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
              ✕
            </button>
          </div>
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {likertData.length > 0 ? (
              <LikertScale data={likertData} />
            ) : (
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                padding: '2rem',
                fontSize: '1.1rem'
              }}>
                Loading data...
              </div>
            )}
          </div>
        </div>
      )}

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
          fontSize: '0.8rem',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '0.6rem 1.2rem',
          borderRadius: '4px',
          transition: 'all 0.3s ease, opacity 1s ease',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          opacity: showIntro ? 0 : 1,
          pointerEvents: showIntro ? 'none' : 'auto'
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

      {/* Fade to black overlay for transition */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity: fadeOverlay,
        pointerEvents: 'none',
        zIndex: 100,
        transition: 'opacity 0.1s linear'
      }} />

    </div>
  )
}

export default God

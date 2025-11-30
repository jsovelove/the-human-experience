import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, useTexture } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'

// Initial single image plane that morphs into grid
function IntroPlane({ imageUrl }) {
  const meshRef = useRef()
  const texture = useTexture(imageUrl, (loadedTexture) => {
    loadedTexture.minFilter = THREE.LinearFilter
    loadedTexture.generateMipmaps = false
  })
  
  const aspect = texture.image ? texture.image.width / texture.image.height : 16/9
  const height = 10 // Increased from 6 to 10 for bigger size
  const width = height * aspect
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      const fadeOutStart = 3.5 // Increased from 2 to 3.5 seconds
      const fadeOutDuration = 1.5 // Increased from 1 to 1.5 for smoother fade
      
      if (time > fadeOutStart) {
        const fadeProgress = Math.min((time - fadeOutStart) / fadeOutDuration, 1)
        // Smooth ease-out fade
        const easedFade = 1 - Math.pow(1 - fadeProgress, 3)
        meshRef.current.material.opacity = 1 - easedFade
      }
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, -8]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial 
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={1}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

// Photo plane component with intro animation and floating
function PhotoPlane({ imageUrl, position, index, gridPosition, totalImages, hasAnimated, selectedIndex, onSelect, isQuestionInput, onQuestionInputClick }) {
  const meshRef = useRef()
  const { camera } = useThree()
  const [localAnimated, setLocalAnimated] = useState(false)
  const [hovered, setHovered] = useState(false)
  const texture = useTexture(imageUrl, (loadedTexture) => {
    // Optimize texture settings for better performance
    loadedTexture.minFilter = THREE.LinearFilter
    loadedTexture.generateMipmaps = false
  })
  
  const isSelected = selectedIndex === index
  
  // Calculate aspect ratio - make question input image bigger
  const aspect = texture.image ? texture.image.width / texture.image.height : 16/9
  const height = isQuestionInput ? 2.5 : 1.5
  const width = height * aspect
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      
      // Phase 1: Hidden (0-3.5s)
      // Phase 2: Fade in at grid position (3.5-4.5s)
      // Phase 3: Hold at grid (4.5-6s)
      // Phase 4: Fly to final position (6-9s)
      
      const fadeInStart = 3.5 // Delayed to match intro image fade out
      const fadeInDuration = 1
      const gridHoldEnd = 6
      const flyDuration = 3
      const flyStart = gridHoldEnd + (index * 0.1)
      
      // Opacity control
      if (time < fadeInStart) {
        meshRef.current.material.opacity = 0
      } else if (time < fadeInStart + fadeInDuration) {
        const fadeProgress = (time - fadeInStart) / fadeInDuration
        meshRef.current.material.opacity = fadeProgress * 0.7
      } else {
        meshRef.current.material.opacity = 0.7
      }
      
      // Position control
      const flyProgress = Math.min(Math.max((time - flyStart) / flyDuration, 0), 1)
      
      if (flyProgress >= 1 && !localAnimated) {
        setLocalAnimated(true)
      }
      
      // Calculate floating offsets (always calculated for smooth transition)
      const floatY = Math.sin(time * 0.3 + index * 0.5) * 0.3
      const floatX = Math.cos(time * 0.2 + index * 0.7) * 0.2
      const floatZ = Math.sin(time * 0.25 + index * 0.3) * 0.2
      
      let currentX, currentY, currentZ
      
      // If selected, bring to front of camera in the direction it's facing
      if (isSelected) {
        // Get camera's forward direction
        const cameraDirection = new THREE.Vector3()
        camera.getWorldDirection(cameraDirection)
        
        // Position the drawing 7 units in front of the camera
        const selectedPos = camera.position.clone().add(cameraDirection.multiplyScalar(7))
        
        const currentPos = meshRef.current.position
        currentX = THREE.MathUtils.lerp(currentPos.x, selectedPos.x, 0.1)
        currentY = THREE.MathUtils.lerp(currentPos.y, selectedPos.y, 0.1)
        currentZ = THREE.MathUtils.lerp(currentPos.z, selectedPos.z, 0.1)
      } else if (flyProgress < 1) {
        // Animate from grid position to final position with easing
        const eased = 1 - Math.pow(1 - flyProgress, 3) // Ease out cubic
        
        // Blend in floating animation towards the end of the fly animation
        const floatBlend = Math.pow(flyProgress, 2) // Start blending in float at the end
        
        const targetX = position[0] + (floatX * floatBlend)
        const targetY = position[1] + (floatY * floatBlend)
        const targetZ = position[2] + (floatZ * floatBlend)
        
        currentX = THREE.MathUtils.lerp(gridPosition[0], targetX, eased)
        currentY = THREE.MathUtils.lerp(gridPosition[1], targetY, eased)
        currentZ = THREE.MathUtils.lerp(gridPosition[2], targetZ, eased)
      } else {
        // Full floating animation after intro
        currentX = position[0] + floatX
        currentY = position[1] + floatY
        currentZ = position[2] + floatZ
      }
      
      meshRef.current.position.set(currentX, currentY, currentZ)
      
      // Rotate to face camera
      if (isSelected) {
        // When selected, face the camera directly
        meshRef.current.lookAt(camera.position)
      } else {
        // When not selected, face origin
        meshRef.current.lookAt(0, 0, 0)
      }
      
      // Hover and selection effects - smooth transitions
      const targetScale = isSelected ? 1.75 : (hovered ? 1.3 : 1)
      const currentScale = meshRef.current.scale.x
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
      meshRef.current.scale.set(newScale, newScale, newScale)
      
      // Opacity changes
      if (time > fadeInStart + fadeInDuration) {
        const targetOpacity = isSelected ? 1 : (hovered ? 1 : 0.7)
        const currentOpacity = meshRef.current.material.opacity
        meshRef.current.material.opacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.1)
      }
    }
  })
  
  return (
    <mesh 
      ref={meshRef} 
      position={gridPosition}
      onClick={(e) => {
        e.stopPropagation()
        if (isQuestionInput) {
          onQuestionInputClick()
        } else {
          onSelect(isSelected ? null : index)
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial 
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={0}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

// Generate grid positions for initial collage layout
function getGridPositions(count) {
  const positions = []
  const cols = 4 // 4 columns
  const rows = Math.ceil(count / cols)
  const spacing = 2
  const startX = -(cols - 1) * spacing / 2
  const startY = (rows - 1) * spacing / 2
  const zPosition = -8 // In front of camera
  
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    
    const x = startX + col * spacing
    const y = startY - row * spacing
    const z = zPosition
    
    positions.push([x, y, z])
  }
  
  return positions
}

// Generate final positions for photos in 3D space around the camera
function getPhotoPositions(count) {
  const positions = []
  const radius = 15
  
  // Seeded random for consistent positions
  const seededRandom = (seed) => {
    const x = Math.sin(seed * 9999) * 10000
    return x - Math.floor(x)
  }
  
  for (let i = 0; i < count; i++) {
    // Distribute photos in a sphere around the camera
    const phi = Math.acos(-1 + (2 * i) / count)
    const theta = Math.sqrt(count * Math.PI) * phi
    
    // Add random offset to prevent overlapping
    const offsetAmount = 0.5
    const radiusVariation = 3
    
    const offsetPhi = phi + (seededRandom(i * 2) - 0.5) * offsetAmount
    const offsetTheta = theta + (seededRandom(i * 2 + 1) - 0.5) * offsetAmount
    const offsetRadius = radius + (seededRandom(i * 3) - 0.5) * radiusVariation
    
    const x = offsetRadius * Math.cos(offsetTheta) * Math.sin(offsetPhi)
    const y = offsetRadius * Math.sin(offsetTheta) * Math.sin(offsetPhi)
    const z = offsetRadius * Math.cos(offsetPhi)
    
    positions.push([x, y, z])
  }
  
  return positions
}

// Bloom controller for submit animation and entry animation
function BloomController({ isSubmitting, isEntering }) {
  const bloomRef = useRef()
  const submitStartTime = useRef(null)
  const entryStartTime = useRef(null)
  const hasEntered = useRef(false)
  
  useFrame((state) => {
    if (!bloomRef.current) return
    
    // Smooth easing function (ease-out cubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
    
    if (isSubmitting) {
      // Submit animation - bloom increases
      if (!submitStartTime.current) {
        submitStartTime.current = state.clock.elapsedTime
      }
      
      const elapsed = state.clock.elapsedTime - submitStartTime.current
      const duration = 3 // 3 seconds to full bloom
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth exponential increase in bloom intensity
      const easedProgress = easeOutCubic(progress)
      const intensity = 0.3 + (easedProgress * easedProgress * 15)
      bloomRef.current.intensity = intensity
    } else if (isEntering && !hasEntered.current) {
      // Entry animation - start high and decrease
      if (!entryStartTime.current) {
        entryStartTime.current = state.clock.elapsedTime
      }
      
      const elapsed = state.clock.elapsedTime - entryStartTime.current
      const duration = 3.0 // 3 seconds to normalize (extended for smoothness)
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth ease-out curve
      const easedProgress = easeOutCubic(progress)
      
      // Start at high bloom (8) and decrease to normal (0.3)
      const startBloom = 8
      const endBloom = 0.3
      const intensity = startBloom - (startBloom - endBloom) * easedProgress
      bloomRef.current.intensity = intensity
      
      // Mark as complete
      if (progress >= 1) {
        hasEntered.current = true
      }
    } else {
      submitStartTime.current = null
      bloomRef.current.intensity = 0.3
    }
  })
  
  return (
    <Bloom 
      ref={bloomRef}
      intensity={0.3} 
      luminanceThreshold={0.3} 
      luminanceSmoothing={0.2} 
      height={300} 
    />
  )
}

// Scene content with HDRI environment and photos positioned around camera
function SceneContent({ imageUrls, cloudName, onQuestionInputClick, isSubmitting, isEntering }) {
  const photoPositions = getPhotoPositions(imageUrls.length)
  const gridPositions = getGridPositions(imageUrls.length)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  
  const introImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_800,q_auto,f_auto/Screenshot_2025-11-29_162404_bbba8k.png`
  
  useEffect(() => {
    // Trigger animation after intro image is well displayed
    const timer = setTimeout(() => setHasAnimated(true), 1000)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <>
      {/* HDRI Environment - optimized 2K HDR */}
      <Environment 
        files="assets/hdr/plains_sunset_2k.hdr"
        background
        resolution={512}
      />
      
      {/* Additional lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      
      {/* Initial single image that fades out */}
      <Suspense fallback={null}>
        <IntroPlane imageUrl={introImageUrl} />
      </Suspense>
      
      {/* Photo planes with intro animation */}
      {imageUrls.map((url, index) => (
        <Suspense key={index} fallback={null}>
          <PhotoPlane
            imageUrl={url}
            position={photoPositions[index]}
            gridPosition={gridPositions[index]}
            index={index}
            totalImages={imageUrls.length}
            hasAnimated={hasAnimated}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            isQuestionInput={index === 0}
            onQuestionInputClick={onQuestionInputClick}
          />
        </Suspense>
      ))}
      
      {/* Orbit controls to look around */}
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        target={[0, 0, -5]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.75}
      />
      
      {/* Post-processing effects - Lo-fi aesthetic */}
      <EffectComposer>
        <BloomController isSubmitting={isSubmitting} isEntering={isEntering} />
        <Noise opacity={0.08} />
        <Vignette eskil={false} offset={0.15} darkness={1.2} />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </>
  )
}

function QuestionsForGod() {
  const navigate = useNavigate()
  const cloudName = 'dgbrj4suu'
  
  const imageIds = [
    'Screenshot_2025-11-29_162404_bbba8k', // Special question input image
    'Screenshot_2025-11-29_164232_uaio5h',
    'Screenshot_2025-11-29_164446_ljurzj',
    'Screenshot_2025-11-29_164502_kz9bd5',
    'Screenshot_2025-11-29_164434_s9fqyx',
    'Screenshot_2025-11-29_164346_wctgvq',
    'Screenshot_2025-11-29_164417_hukh6h',
    'Screenshot_2025-11-29_164515_kavxea',
    'Screenshot_2025-11-29_164359_ic27t9',
    'Screenshot_2025-11-29_164528_fqutjz',
    'Screenshot_2025-11-29_164539_cmpb3h',
    'Screenshot_2025-11-29_164550_dmgndt',
    'Screenshot_2025-11-29_164608_gsyyja',
    'Screenshot_2025-11-29_164627_csbqde',
    'Screenshot_2025-11-29_164600_lnufge',
    'Screenshot_2025-11-29_164642_d6vsa3',
    'Screenshot_2025-11-29_164714_gtvv1y'
  ]
  
  // Use smaller, optimized versions of images for better performance
  const imageUrls = imageIds.map(id => 
    `https://res.cloudinary.com/${cloudName}/image/upload/w_800,q_auto,f_auto/${id}.png`
  )
  
  const [showQuestionInput, setShowQuestionInput] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fadeOverlay, setFadeOverlay] = useState(0)
  const [isEntering, setIsEntering] = useState(true)
  const [entryFadeIn, setEntryFadeIn] = useState(1) // Start at full black
  
  // Entry fade-in animation - smooth and gentle
  useEffect(() => {
    let progress = 0
    const duration = 2000 // 2 seconds
    const startTime = Date.now()
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      progress = Math.min(elapsed / duration, 1)
      
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setEntryFadeIn(1 - eased)
      
      if (progress >= 1) {
        clearInterval(fadeInterval)
      }
    }, 16) // ~60fps
    
    return () => clearInterval(fadeInterval)
  }, [])
  
  // Disable entry bloom animation after initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 3500) // Extended to 3.5s for smoother finish
    return () => clearTimeout(timer)
  }, [])
  
  // Handle submit animation
  const handleSubmit = () => {
    console.log('Question submitted:', questionText)
    setIsSubmitting(true)
    setShowQuestionInput(false)
    
    // Start fade to black after bloom peaks
    setTimeout(() => {
      const fadeInterval = setInterval(() => {
        setFadeOverlay(prev => {
          const next = prev + 0.01
          if (next >= 1) {
            clearInterval(fadeInterval)
            // Navigate to TV scene after fade completes
            setTimeout(() => {
              navigate('/tv-scene')
            }, 500)
          }
          return next
        })
      }, 16) // ~60fps
    }, 2500) // Start fade after 2.5s of bloom
  }
  
  return (
    <div className="app" style={{ backgroundColor: 'black', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Full-screen Three.js Scene */}
      <Canvas
        shadows
        camera={{ 
          position: [0, 0, 0], 
          fov: 75,
          rotation: [0, 0, 0],
          near: 0.1,
          far: 100
        }}
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
            cloudName={cloudName}
            onQuestionInputClick={() => setShowQuestionInput(true)}
            isSubmitting={isSubmitting}
            isEntering={isEntering}
          />
        </Suspense>
      </Canvas>
      
      {/* Question input modal - minimal and elegant */}
      {showQuestionInput && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div 
            style={{
              textAlign: 'center',
              maxWidth: '800px',
              padding: '4rem',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.45) 20%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 65%, rgba(0,0,0,0.05) 80%, transparent 100%)',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.2rem',
              fontWeight: '200',
              letterSpacing: '0.1em',
              marginBottom: '2rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              what will you ask god?
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && questionText.trim()) {
                    handleSubmit()
                  } else if (e.key === 'Escape') {
                    setQuestionText('')
                    setShowQuestionInput(false)
                  }
                }}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '200',
                  letterSpacing: '0.05em',
                  outline: 'none',
                  textAlign: 'center',
                  width: '100%',
                  caretColor: 'white',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                }}
              />
            </div>
            
            <div style={{
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.8rem',
              marginTop: '3rem',
              letterSpacing: '0.1em',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              press enter to submit • esc to close
            </div>
          </div>
          
        </div>
      )}

      {/* Entry fade-in overlay - starts black and fades out */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity: entryFadeIn,
        pointerEvents: 'none',
        zIndex: 50,
        transition: 'opacity 0.1s linear'
      }} />

      {/* Fade to black overlay for submit */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity: fadeOverlay,
        pointerEvents: 'none',
        zIndex: 51,
        transition: 'opacity 0.1s linear'
      }} />

      {/* Back button */}
      <Link 
        to="/god" 
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
          transition: 'all 0.3s ease',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
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
        ← BACK
      </Link>
    </div>
  )
}

export default QuestionsForGod


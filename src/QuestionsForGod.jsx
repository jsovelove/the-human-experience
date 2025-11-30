import './App.css'
import { Link } from 'react-router-dom'
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
  const height = 6
  const width = height * aspect
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      const fadeOutStart = 2
      const fadeOutDuration = 1
      
      if (time > fadeOutStart) {
        const fadeProgress = Math.min((time - fadeOutStart) / fadeOutDuration, 1)
        meshRef.current.material.opacity = 1 - fadeProgress
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
function PhotoPlane({ imageUrl, position, index, gridPosition, totalImages, hasAnimated }) {
  const meshRef = useRef()
  const [localAnimated, setLocalAnimated] = useState(false)
  const texture = useTexture(imageUrl, (loadedTexture) => {
    // Optimize texture settings for better performance
    loadedTexture.minFilter = THREE.LinearFilter
    loadedTexture.generateMipmaps = false
  })
  
  // Calculate aspect ratio - smaller size
  const aspect = texture.image ? texture.image.width / texture.image.height : 16/9
  const height = 1.5
  const width = height * aspect
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      
      // Phase 1: Hidden (0-2s)
      // Phase 2: Fade in at grid position (2-3s)
      // Phase 3: Hold at grid (3-5s)
      // Phase 4: Fly to final position (5-8s)
      
      const fadeInStart = 2
      const fadeInDuration = 1
      const gridHoldEnd = 5
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
      
      let currentX, currentY, currentZ
      
      if (flyProgress < 1) {
        // Animate from grid position to final position
        const eased = 1 - Math.pow(1 - flyProgress, 3) // Ease out cubic
        
        currentX = THREE.MathUtils.lerp(gridPosition[0], position[0], eased)
        currentY = THREE.MathUtils.lerp(gridPosition[1], position[1], eased)
        currentZ = THREE.MathUtils.lerp(gridPosition[2], position[2], eased)
      } else {
        // Floating animation after intro
        const floatY = Math.sin(time * 0.3 + index * 0.5) * 0.3
        const floatX = Math.cos(time * 0.2 + index * 0.7) * 0.2
        const floatZ = Math.sin(time * 0.25 + index * 0.3) * 0.2
        
        currentX = position[0] + floatX
        currentY = position[1] + floatY
        currentZ = position[2] + floatZ
      }
      
      meshRef.current.position.set(currentX, currentY, currentZ)
      
      // Rotate to face camera (origin)
      meshRef.current.lookAt(0, 0, 0)
    }
  })
  
  return (
    <mesh ref={meshRef} position={gridPosition}>
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
  const radius = 12
  
  for (let i = 0; i < count; i++) {
    // Distribute photos in a sphere around the camera
    const phi = Math.acos(-1 + (2 * i) / count)
    const theta = Math.sqrt(count * Math.PI) * phi
    
    const x = radius * Math.cos(theta) * Math.sin(phi)
    const y = radius * Math.sin(theta) * Math.sin(phi)
    const z = radius * Math.cos(phi)
    
    positions.push([x, y, z])
  }
  
  return positions
}

// Scene content with HDRI environment and photos positioned around camera
function SceneContent({ imageUrls, cloudName }) {
  const photoPositions = getPhotoPositions(imageUrls.length)
  const gridPositions = getGridPositions(imageUrls.length)
  const [hasAnimated, setHasAnimated] = useState(false)
  
  const introImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_800,q_auto,f_auto/Screenshot_2025-11-29_162404_bbba8k.png`
  
  useEffect(() => {
    // Trigger animation after a short delay
    const timer = setTimeout(() => setHasAnimated(true), 500)
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

function QuestionsForGod() {
  const cloudName = 'dgbrj4suu'
  
  const imageIds = [
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
  
  return (
    <div className="app" style={{ backgroundColor: 'black', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Full-screen Three.js Scene */}
      <Canvas
        shadows
        camera={{ 
          position: [0, 0, 0], 
          fov: 75,
          rotation: [0, 0, 0]
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
          <SceneContent imageUrls={imageUrls} cloudName={cloudName} />
        </Suspense>
      </Canvas>
      
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


import './App.css'
import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, useTexture } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'

// Photo plane component positioned in 3D space with floating animation
function PhotoPlane({ imageUrl, position, index }) {
  const meshRef = useRef()
  const texture = useTexture(imageUrl)
  
  // Calculate aspect ratio - smaller size
  const aspect = texture.image ? texture.image.width / texture.image.height : 16/9
  const height = 1.5
  const width = height * aspect
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      
      // Floating animation - each photo has slightly different timing
      const floatY = Math.sin(time * 0.3 + index * 0.5) * 0.3
      const floatX = Math.cos(time * 0.2 + index * 0.7) * 0.2
      const floatZ = Math.sin(time * 0.25 + index * 0.3) * 0.2
      
      meshRef.current.position.set(
        position[0] + floatX,
        position[1] + floatY,
        position[2] + floatZ
      )
      
      // Rotate to face camera (origin)
      meshRef.current.lookAt(0, 0, 0)
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial 
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.7}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

// Generate positions for photos in 3D space around the camera
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
function SceneContent({ imageUrls }) {
  const photoPositions = getPhotoPositions(imageUrls.length)
  
  return (
    <>
      {/* HDRI Environment */}
      <Environment 
        files="assets/hdr/rural_evening_road_4k.hdr"
        background
      />
      
      {/* Additional lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      
      {/* Photo planes positioned around the camera */}
      {imageUrls.map((url, index) => (
        <Suspense key={index} fallback={null}>
          <PhotoPlane
            imageUrl={url}
            position={photoPositions[index]}
            index={index}
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
  
  const imageUrls = imageIds.map(id => `https://res.cloudinary.com/${cloudName}/image/upload/${id}.png`)
  
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
          <SceneContent imageUrls={imageUrls} />
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


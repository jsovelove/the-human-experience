import './App.css'
import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, useGLTF, useVideoTexture } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import LoadingScreen from './LoadingScreen'
import * as THREE from 'three'

// Cloudinary video URL
const cloudName = 'dgbrj4suu'
const videoId = 'IMG_4512_small_kmtcre'
const videoSrc = `https://res.cloudinary.com/${cloudName}/video/upload/${videoId}.mp4`

// TV Model component with video screen
function OldTV({ position = [0, 0, 0], scale = 1, videoSrc = null, groupRef }) {
  const { scene } = useGLTF('/assets/models/old_tv.glb')
  const screenMeshRef = useRef()
  const [clonedScene, setClonedScene] = useState(null)
  const [videoTexture, setVideoTexture] = useState(null)
  const audioContextRef = useRef(null)
  const videoRef = useRef(null)
  
  // Load video manually with audio control
  useEffect(() => {
    if (!videoSrc) return
    
    const video = document.createElement('video')
    video.src = videoSrc
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.playsInline = true
    video.volume = 1.0
    videoRef.current = video
    
    // Create video texture
    const texture = new THREE.VideoTexture(video)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.format = THREE.RGBAFormat
    
    // Wait for video to load before setting up audio
    video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded, setting up audio...')
      
      // Setup audio with reverb
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      
      // Create audio source from video
      const source = audioContext.createMediaElementSource(video)
    
    // Create convolver for reverb
    const convolver = audioContext.createConvolver()
    
    // Generate impulse response for large space reverb
    const sampleRate = audioContext.sampleRate
    const length = sampleRate * 4 // 4 seconds reverb for bigger space
    const impulse = audioContext.createBuffer(2, length, sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Exponential decay for natural reverb
        const decay = Math.exp(-i / (sampleRate * 1.2))
        channelData[i] = (Math.random() * 2 - 1) * decay
      }
    }
    
      convolver.buffer = impulse
      
      // Create bitcrusher effect using WaveShaper
      const bitcrusher = audioContext.createWaveShaper()
      const bits = 3.8 // Bit depth (lower = more crushed, try 4-8)
      const normfreq = 1 // Sample rate reduction (0-1, lower = more crushed)
      
      // Generate bitcrushing curve
      const samples = 44100
      const curve = new Float32Array(samples)
      const step = Math.pow(0.5, bits)
      
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1
        const y = step * Math.floor(x / step + 0.5)
        curve[i] = y
      }
      
      bitcrusher.curve = curve
      
      // Low-pass filter to simulate sample rate reduction
      const lowpass = audioContext.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 4000 * normfreq // Reduce high frequencies
      
      // Create dry/wet mix
      const dryGain = audioContext.createGain()
      const wetGain = audioContext.createGain()
      const bitcrushGain = audioContext.createGain()
      dryGain.gain.value = 0.5 // 50% dry
      wetGain.gain.value = 1.2 // 120% wet (strong reverb)
      bitcrushGain.gain.value = 0.7 // Bitcrush amount
      
      // Connect the audio graph with bitcrusher
      // Original -> bitcrusher -> lowpass -> split to dry/reverb
      source.connect(bitcrusher)
      bitcrusher.connect(lowpass)
      
      lowpass.connect(dryGain)
      lowpass.connect(convolver)
      convolver.connect(wetGain)
      
      dryGain.connect(audioContext.destination)
      wetGain.connect(audioContext.destination)
      
      console.log('Audio graph connected with reverb!')
      
      // Try to play video after audio setup
      attemptPlay()
    })
    
    // Try to play video (will fail until user interaction)
    const attemptPlay = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('Audio context resumed')
        })
      }
      video.play().then(() => {
        console.log('Video playing with audio!')
      }).catch(e => {
        console.log('Waiting for user interaction to play video...')
      })
    }
    
    // Add click listener to start on user interaction
    const handleInteraction = () => {
      attemptPlay()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
    
    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)
    
    // Try to play immediately (works if user already interacted)
    attemptPlay()
    
    setVideoTexture(texture)
    console.log('Video loaded with reverb audio!')
    
    return () => {
      video.pause()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [videoSrc])
  
  // Clone the scene and optionally apply video texture
  useEffect(() => {
    console.log('=== CLONING TV MODEL ===')
    const clone = scene.clone(true)
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    console.log('Model Size:', size)
    
    // Find and optionally replace the screen material
    clone.traverse((child) => {
      if (child.isMesh) {
        console.log('Mesh found:', child.name)
        
        // If it's the screen mesh
        if (child.name === 'TV003_Glass_0') {
          console.log('✅ Found TV screen mesh!')
          screenMeshRef.current = child
          
          if (videoTexture) {
            // Video is 1280x720 (16:9 landscape)
            // Rotate counter-clockwise 90 degrees
            videoTexture.rotation = Math.PI / 2
            videoTexture.center.set(0.5, 0.5)
            
            // Zoom out to show more content
            videoTexture.wrapS = THREE.ClampToEdgeWrapping
            videoTexture.wrapT = THREE.ClampToEdgeWrapping
            videoTexture.repeat.set(5, 5) // Show more area (zoom out)
            videoTexture.offset.set(-0.6, 0) // Keep centered
            
            // Create new material with video texture
            child.material = new THREE.MeshStandardMaterial({
              map: videoTexture,
              emissive: new THREE.Color('#ffffff'),
              emissiveMap: videoTexture,
              emissiveIntensity: 1.5,
              toneMapped: false,
              side: THREE.DoubleSide
            })
            console.log('Video texture applied - zoomed out to show more content')
          } else {
            // Keep original material but make it slightly emissive (like a turned-off TV)
            child.material = child.material.clone()
            child.material.emissive = new THREE.Color('#111111')
            child.material.emissiveIntensity = 0.1
            console.log('No video provided - using default screen material')
          }
        }
      }
    })
    
    setClonedScene(clone)
  }, [scene, videoTexture])
  
  // Add subtle glow animation to screen if video is playing
  useFrame((state) => {
    if (screenMeshRef.current && videoTexture) {
      // Subtle pulsing effect
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 1.4
      screenMeshRef.current.material.emissiveIntensity = pulse
    }
  })
  
  if (!clonedScene) return null
  
  return (
    <group ref={groupRef} position={position}>
      <primitive 
        object={clonedScene} 
        scale={scale}
      />
    </group>
  )
}

// Intro animation controller - animates both camera and TV
function IntroAnimator({ isAnimating, tvGroupRef }) {
  const { camera } = useThree()
  const startTimeRef = useRef(null)
  const hasSetInitialRef = useRef(false)
  
  useFrame((state) => {
    // Always set initial positions/rotations on first frame
    if (!hasSetInitialRef.current && tvGroupRef.current) {
      camera.position.z = 10 // Start camera far back
      tvGroupRef.current.rotation.y = Math.PI // Start TV rotated 180°
      hasSetInitialRef.current = true
    }
    
    if (!isAnimating) return
    
    if (!startTimeRef.current) {
      startTimeRef.current = state.clock.elapsedTime
    }
    
    const elapsed = state.clock.elapsedTime - startTimeRef.current
    const duration = 3 // 3 seconds for the animation
    const progress = Math.min(elapsed / duration, 1)
    
    // Smooth ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    
    // Animate camera zoom: start from z = 10, end at z = 0
    const startZ = 10
    const endZ = 0
    camera.position.z = THREE.MathUtils.lerp(startZ, endZ, eased)
    
    // Animate TV rotation: start from 180° (Math.PI), end at 0°
    if (tvGroupRef.current) {
      const startRotation = Math.PI
      const endRotation = 0
      tvGroupRef.current.rotation.y = THREE.MathUtils.lerp(startRotation, endRotation, eased)
    }
  })
  
  return null
}

// Slow pullback camera controller - starts after intro animation
function SlowPullback({ isActive }) {
  const { camera } = useThree()
  const startTimeRef = useRef(null)
  const startPositionRef = useRef(null)
  
  useFrame((state) => {
    if (!isActive) return
    
    if (!startTimeRef.current) {
      startTimeRef.current = state.clock.elapsedTime
      startPositionRef.current = camera.position.z
    }
    
    const elapsed = state.clock.elapsedTime - startTimeRef.current
    const duration = 30 // 30 seconds for slow pullback
    const progress = Math.min(elapsed / duration, 1)
    
    // Very gentle ease-in-out
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
    
    // Slowly pull back from z=0 to z=15
    const startZ = startPositionRef.current
    const endZ = 15
    camera.position.z = THREE.MathUtils.lerp(startZ, endZ, eased)
  })
  
  return null
}

// Scene content with lighting and environment
function SceneContent({ isEntering, isAnimating, isPullbackActive }) {
  const tvGroupRef = useRef()
  
  return (
    <>
      {/* Intro animator */}
      <IntroAnimator isAnimating={isAnimating} tvGroupRef={tvGroupRef} />
      
      {/* Slow pullback after intro */}
      <SlowPullback isActive={isPullbackActive} />
      
      {/* Lighting setup */}
      <ambientLight intensity={2.0} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ffaa88" />
      
      {/* TV Model with video - positioned further away and centered */}
      <Suspense fallback={null}>
        <OldTV 
          position={[0, -4, -10]} 
          scale={0.01}
          videoSrc={videoSrc}
          groupRef={tvGroupRef}
        />
      </Suspense>
      
      {/* Post-processing effects */}
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

function TVScene() {
  const [isEntering, setIsEntering] = useState(true)
  const [entryFadeIn, setEntryFadeIn] = useState(1) // Start at full black
  const [isAnimating, setIsAnimating] = useState(true) // Start animation immediately
  const [isPullbackActive, setIsPullbackActive] = useState(false)
  
  // Entry fade-in animation
  useEffect(() => {
    let progress = 0
    const duration = 3000 // 3 seconds - match the spin/zoom animation
    const startTime = Date.now()
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      progress = Math.min(elapsed / duration, 1)
      
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setEntryFadeIn(1 - eased)
      
      if (progress >= 1) {
        clearInterval(fadeInterval)
        setIsEntering(false)
      }
    }, 16) // ~60fps
    
    return () => clearInterval(fadeInterval)
  }, [])
  
  // Stop intro animation after duration, start pullback
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false)
      // Start pullback after a 2 second pause
      setTimeout(() => {
        setIsPullbackActive(true)
      }, 2000)
    }, 3000) // Match the animation duration
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="app" style={{ backgroundColor: 'black', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Full-screen Three.js Scene */}
      <Canvas
        shadows
        camera={{ 
          position: [0, 0, 0], 
          fov: 75,
          near: 0.01,
          far: 1000
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
        <Suspense fallback={<LoadingScreen />}>
          <SceneContent 
            isEntering={isEntering} 
            isAnimating={isAnimating}
            isPullbackActive={isPullbackActive}
          />
        </Suspense>
      </Canvas>
      
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

      {/* Back button */}
      <Link 
        to="/questions-for-god" 
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

// Preload the model
useGLTF.preload('/assets/models/old_tv.glb')

export default TVScene


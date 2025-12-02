import './App.css'
import { Link } from 'react-router-dom'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import ModelParticles from './ModelParticles'
import * as THREE from 'three'

// Camera animation controller
function CameraAnimationController({ animationPhase, onSpinComplete, controlsRef, playingVoicemail, voicemailPositions }) {
  const { camera } = useThree()
  const spinStartTime = useRef(null)
  const currentTargetId = useRef(null)
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const isTransitioning = useRef(false)
  const transitionStartPos = useRef(new THREE.Vector3())
  const transitionStartTarget = useRef(new THREE.Vector3())
  const transitionStartTime = useRef(0)
  
  useFrame((state) => {
    // During intro, camera stays in starting position
    if (animationPhase === 'intro') {
      if (controlsRef.current) {
        controlsRef.current.enabled = false
      }
      camera.position.set(0, 0, -5)
      camera.lookAt(0, 0, 0)
      return
    }
    
    if (animationPhase === 'spinning' || animationPhase === 'scattered') {
      if (controlsRef.current) {
        controlsRef.current.enabled = false
      }
      if (spinStartTime.current === null) {
        spinStartTime.current = state.clock.elapsedTime
      }
      
      const elapsed = state.clock.elapsedTime - spinStartTime.current
      const duration = 25 // 25 seconds total
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth easing
      const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      }
      
      const easedProgress = easeInOutCubic(progress)
      // Start at 180 degrees (Math.PI) and rotate 180 degrees more
      const angle = Math.PI + (easedProgress * Math.PI) // 180 degree rotation
      
      // Keep constant radius - no zoom
      const radius = 5
      
      // Circular camera path
      camera.position.x = Math.sin(angle) * radius
      camera.position.z = Math.cos(angle) * radius
      camera.position.y = 0
      
      camera.lookAt(0, 0, 0)
      
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
      }
      
      // Complete animation
      if (progress >= 1 && onSpinComplete) {
        onSpinComplete()
      }
      return
    }
    
    // Interactive phase - move camera position near playing voicemail with timed transition
    if (animationPhase === 'interactive') {
      // Enable controls when in interactive mode (unless transitioning)
      if (!isTransitioning.current && controlsRef.current && !controlsRef.current.enabled) {
        controlsRef.current.enabled = true
      }
      
      if (playingVoicemail === null) return
      
      const targetVoicemail = voicemailPositions.find(v => v.id === playingVoicemail)
      if (!targetVoicemail) return
      
      // Start new transition when voicemail changes
      if (currentTargetId.current !== playingVoicemail) {
        currentTargetId.current = playingVoicemail
        const pos = new THREE.Vector3(...targetVoicemail.position)
        
        // Calculate ideal camera position (to the right and in front for staggered view)
        const offset = new THREE.Vector3(2, 0.5, 4) // Positioned to the right (X=2)
        targetPosition.current.copy(pos).add(offset)
        targetLookAt.current.copy(pos)
        
        // Start transition and disable controls temporarily
        isTransitioning.current = true
        transitionStartPos.current.copy(camera.position)
        if (controlsRef.current) {
          transitionStartTarget.current.copy(controlsRef.current.target)
        } else {
          transitionStartTarget.current.set(0, 0, 0)
        }
        transitionStartTime.current = state.clock.elapsedTime
        
        if (controlsRef.current) {
          controlsRef.current.enabled = false
        }
      }
      
      // Animate camera during transition period only
      if (isTransitioning.current) {
        const transitionDuration = 2 // 2 seconds
        const elapsed = state.clock.elapsedTime - transitionStartTime.current
        const progress = Math.min(elapsed / transitionDuration, 1)
        
        // Smooth easing
        const easeInOutCubic = (t) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        }
        
        const easedProgress = easeInOutCubic(progress)
        
        // Lerp camera position from start to target
        const newCameraPosition = new THREE.Vector3().lerpVectors(
          transitionStartPos.current,
          targetPosition.current,
          easedProgress
        )
        camera.position.copy(newCameraPosition)
        
        // Lerp controls target so the voicemail stays centered
        if (controlsRef.current) {
          const newTarget = new THREE.Vector3().lerpVectors(
            transitionStartTarget.current,
            targetLookAt.current,
            easedProgress
          )
          controlsRef.current.target.copy(newTarget)
          controlsRef.current.update()
        }
        
        // End transition and re-enable controls
        if (progress >= 1) {
          isTransitioning.current = false
          if (controlsRef.current) {
            controlsRef.current.enabled = true
            controlsRef.current.target.copy(targetLookAt.current)
            controlsRef.current.update()
          }
        }
      }
      // After transition completes, OrbitControls has full control
    }
  })
  
  return null
}

// Voicemail particle component - simple square with audio reactivity and fade in
function VoicemailParticle({ position, voicemailUrl, isSelected, isPlaying, onClick, audioAnalyser, isCenter = false }) {
  const spriteRef = useRef()
  const audioData = useRef(0)
  const fadeStartTime = useRef(null)
  const fadeOpacity = useRef(0)
  
  useFrame((state) => {
    // Fade in animation
    if (fadeStartTime.current === null) {
      fadeStartTime.current = state.clock.elapsedTime
    }
    
    const fadeElapsed = state.clock.elapsedTime - fadeStartTime.current
    const fadeDuration = 2 // 2 seconds fade in
    const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1)
    
    // Smooth ease in
    const easeInCubic = (t) => t * t * t
    fadeOpacity.current = easeInCubic(fadeProgress)
    
    // Get audio reactivity data - only for the playing voicemail
    let audioLevel = 0
    if (isPlaying && audioAnalyser) {
      const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount)
      audioAnalyser.getByteFrequencyData(dataArray)
      
      // Get average volume
      const sum = dataArray.reduce((a, b) => a + b, 0)
      audioLevel = (sum / dataArray.length) / 255 // Normalize to 0-1
      
      // Amplify and smooth the audio data
      const amplified = Math.pow(audioLevel * 1.5, 1.5)
      audioData.current = audioData.current * 0.5 + amplified * 0.5
    } else {
      audioData.current = 0
    }
    
    if (spriteRef.current) {
      // Audio-reactive scale - center star is bigger
      const baseScale = isCenter ? 0.5 : 0.35
      const audioScale = isPlaying ? (1 + audioData.current * 2.5) : 1
      const finalScale = baseScale * audioScale
      spriteRef.current.scale.set(finalScale, finalScale, finalScale)
      
      // Audio-reactive brightness through opacity - pulses dramatically, multiplied by fade
      if (spriteRef.current.material) {
        const baseOpacity = isCenter ? 0.7 : 0.5 // Center star is brighter
        const audioBrightness = isPlaying ? audioData.current * 1.0 : 0
        const targetOpacity = Math.min(baseOpacity + audioBrightness, 1)
        spriteRef.current.material.opacity = targetOpacity * fadeOpacity.current
      }
    }
  })
  
  return (
    <group position={position} onClick={onClick}>
      {/* Simple square sprite - always white */}
      <sprite ref={spriteRef} scale={[0.4, 0.4, 0.4]}>
        <spriteMaterial
          color="#ffffff"
          transparent={true}
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      
      {/* Click detection sphere (invisible) */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

// Scene content with animated particles and voicemails
function SceneContent({ animationPhase, onSpinComplete, controlsRef, selectedVoicemail, playingVoicemail, onVoicemailClick, audioAnalyser, onSceneReady }) {
  // Voicemail data - galaxy of voicemails scattered around
  const voicemails = [
    {
      id: 0,
      url: 'https://res.cloudinary.com/dgbrj4suu/video/upload/voicemail-45624325184_z9xtzz.mp3',
      position: [0, 0, 0] // Front-most star
    },
    {
      id: 1,
      url: 'https://res.cloudinary.com/dgbrj4suu/video/upload/voicemail-45627313472_nyrbuj.mp3',
      position: [0, 0.4, -3] // Behind first star
    },
    {
      id: 2,
      url: 'https://res.cloudinary.com/dgbrj4suu/video/upload/voicemail-50393231296_rs2qo2.mp3',
      position: [0, -0.3, -6] // Further back
    },
    {
      id: 3,
      url: 'https://res.cloudinary.com/dgbrj4suu/video/upload/voicemail-45626767616_tqx9df.mp3',
      position: [0, 0.2, -9] // Third in line
    },
    {
      id: 4,
      url: 'https://res.cloudinary.com/dgbrj4suu/video/upload/voicemail-45617701344_nozfjm.mp3',
      position: [0, -0.2, -12] // Farthest back
    }
  ]
  
  const isScattered = animationPhase === 'scattered' || animationPhase === 'interactive'
  
  return (
    <>
      {/* Camera animation controller */}
      <CameraAnimationController 
        animationPhase={animationPhase}
        onSpinComplete={onSpinComplete}
        controlsRef={controlsRef}
        playingVoicemail={playingVoicemail}
        voicemailPositions={voicemails}
      />
      
      {/* Scene lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff6b9d" />
      <pointLight position={[-10, -10, -10]} color="#ff1744" intensity={0.8} />
      <pointLight position={[0, 15, 0]} color="#ffffff" intensity={1} />
      <pointLight position={[0, -10, 5]} color="#ffc0cb" intensity={0.5} />
      
      {/* Model particles - gather together, then scatter after camera animation */}
      <ModelParticles 
        modelPath="/assets/models/12_1_2025.glb"
        color="#ffffff"
        size={0.025}
        density={0.8}
        autoRotate={false}
        noiseStrength={0.02}
        noiseSpeed={0.6}
        violent={false}
        position={[0, 0, 0]}
        scale={[2, 2, 2]}
        isGathering={animationPhase === 'intro'}
        gatheringDuration={6}
        isTransitioning={isScattered}
        transitionDuration={10}
        onReady={onSceneReady}
      />
      
      {/* Voicemail particles - galaxy of voicemails, visible after scattering */}
      {animationPhase === 'interactive' && voicemails.map((voicemail) => (
        <VoicemailParticle
          key={voicemail.id}
          position={voicemail.position}
          voicemailUrl={voicemail.url}
          isSelected={selectedVoicemail === voicemail.id}
          isPlaying={playingVoicemail === voicemail.id}
          onClick={() => onVoicemailClick(voicemail)}
          audioAnalyser={audioAnalyser}
          isCenter={voicemail.id === 0}
        />
      ))}
      
      {/* Post-processing effects - matching God page with heavy bloom for voicemail stars */}
      <EffectComposer>
        <Bloom 
          intensity={animationPhase === 'interactive' ? 1.2 : 0.3}
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

function Love() {
  const audioRef = useRef(null)
  const voicemailAudioRef = useRef(null)
  const controlsRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  
  // Animation phases: 'intro' -> 'spinning' -> 'scattered' -> 'interactive'
  const [animationPhase, setAnimationPhase] = useState('intro')
  const [selectedVoicemail, setSelectedVoicemail] = useState(null)
  const [playingVoicemail, setPlayingVoicemail] = useState(null)
  const [sceneReady, setSceneReady] = useState(false)

  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])
  
  // Play background audio when component mounts
  useEffect(() => {
    if (!sceneReady) return
    
    const audio = new Audio('https://res.cloudinary.com/dgbrj4suu/video/upload/RD_1_fpm4za.mp3')
    audio.loop = true
    audio.volume = 0.5
    audioRef.current = audio
    
    // Play audio (with user interaction fallback)
    const playAudio = () => {
      audio.play().catch(err => {
        console.log('Audio autoplay prevented:', err)
      })
    }
    
    playAudio()
    
    // Intro gathering: 0-6 seconds
    const spinTimer = setTimeout(() => {
      setAnimationPhase('spinning')
    }, 6000) // Start spinning after 6 second intro
    
    // Start particle scatter at 21 seconds (6s intro + 15s into spin)
    const scatterTimer = setTimeout(() => {
      setAnimationPhase('scattered')
    }, 21000)
    
    // Transition to interactive (show voicemail star) at 26 seconds
    const interactiveTimer = setTimeout(() => {
      setAnimationPhase('interactive')
    }, 26000)
    
    // Cleanup on unmount
    return () => {
      clearTimeout(spinTimer)
      clearTimeout(scatterTimer)
      clearTimeout(interactiveTimer)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (voicemailAudioRef.current) {
        voicemailAudioRef.current.pause()
        voicemailAudioRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [sceneReady])
  
  // Handle camera spin completion (at 25 seconds) - transition to interactive
  const handleSpinComplete = () => {
    // Don't wait for spin to complete - transition earlier
    // This gets called at 25s but we already transitioned at 20s via timer
  }
  
  // Auto-play voicemail when entering interactive phase
  useEffect(() => {
    if (!sceneReady) return
    if (animationPhase === 'interactive') {
      // Auto-play the first voicemail
      const firstVoicemail = {
        id: 0,
        url: 'https://res.cloudinary.com/dgbrj4suu/video/upload/voicemail-45624325184_z9xtzz.mp3'
      }
      handleVoicemailClick(firstVoicemail)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationPhase, sceneReady])
  
  // Handle voicemail click
  const handleVoicemailClick = (voicemail) => {
    // If clicking the same voicemail that's playing, stop it
    if (playingVoicemail === voicemail.id && voicemailAudioRef.current) {
      voicemailAudioRef.current.pause()
      setPlayingVoicemail(null)
      setSelectedVoicemail(null)
      return
    }
    
    setSelectedVoicemail(voicemail.id)
    setPlayingVoicemail(voicemail.id)
    
    // Stop previous voicemail if playing
    if (voicemailAudioRef.current) {
      voicemailAudioRef.current.pause()
      voicemailAudioRef.current.src = '' // Clear source
    }
    
    // Create Web Audio API context and analyser if not exists
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 512 // Higher resolution for better voice detection
      analyserRef.current.smoothingTimeConstant = 0.3 // Less smoothing for more responsiveness
      analyserRef.current.minDecibels = -90
      analyserRef.current.maxDecibels = -10
    }
    
    // Create or reuse audio element
    let audio = voicemailAudioRef.current
    let needsSourceCreation = false
    
    if (!audio) {
      audio = new Audio()
      audio.crossOrigin = "anonymous"
      voicemailAudioRef.current = audio
      needsSourceCreation = true
    }
    
    // Set new audio source
    audio.src = voicemail.url
    audio.volume = 0.8
    
    // Connect audio to analyser (only once)
    if (needsSourceCreation) {
      try {
        const source = audioContextRef.current.createMediaElementSource(audio)
        source.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
      } catch (err) {
        console.log('Audio source already created:', err)
      }
    }
    
    audio.play().catch(err => {
      console.log('Voicemail playback error:', err)
    })
    
    // Update playing state when audio ends
    audio.onended = () => {
      setPlayingVoicemail(null)
      setSelectedVoicemail(null)
    }
  }
  
  return (
    <div className="app" style={{ backgroundColor: '#0a0a0a', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Full-screen Three.js Scene */}
      <Canvas
        shadows
        camera={{ position: [0, 0, -5], fov: 60 }}
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
          backgroundColor: '#0a0a0a',
          cursor: sceneReady && animationPhase === 'interactive' ? 'pointer' : 'default'
        }}
      >
        <Suspense fallback={null}>
          <SceneContent 
            animationPhase={animationPhase}
            onSpinComplete={handleSpinComplete}
            controlsRef={controlsRef}
            selectedVoicemail={selectedVoicemail}
            playingVoicemail={playingVoicemail}
            onVoicemailClick={handleVoicemailClick}
            audioAnalyser={analyserRef.current}
            onSceneReady={handleSceneReady}
          />
          
          {/* Orbit controls - enabled during interactive, but temporarily disabled during transitions */}
          <OrbitControls 
            ref={controlsRef}
            enabled={true}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            autoRotate={false}
            minDistance={3}
            maxDistance={20}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.3}
          />
        </Suspense>
      </Canvas>
      
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
        ← Back
      </Link>
    </div>
  )
}

export default Love


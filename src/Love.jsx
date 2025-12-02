import './App.css'
import { Link } from 'react-router-dom'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import ModelParticles from './ModelParticles'
import LoadingScreen from './LoadingScreen'
import * as THREE from 'three'

// Cloudinary video URL for TV
const cloudName = 'dgbrj4suu'
const videoId = 'IMG_4755_jpynfo'
const tvVideoSrc = `https://res.cloudinary.com/${cloudName}/video/upload/${videoId}.mp4`

// Clickable TV in the voicemail chain
function ClickableTV({ position, onClick, isPlaying }) {
  const tvGroupRef = useRef()
  const spriteRef = useRef()
  const scaleRef = useRef(0)
  const startTimeRef = useRef(null)
  const fadeStartTime = useRef(null)
  const fadeOpacity = useRef(0)
  
  useFrame((state) => {
    // Fade in animation for the star (matching VoicemailParticle)
    if (fadeStartTime.current === null) {
      fadeStartTime.current = state.clock.elapsedTime
    }
    
    const fadeElapsed = state.clock.elapsedTime - fadeStartTime.current
    const fadeDuration = 2 // 2 seconds fade in
    const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1)
    
    // Smooth ease in
    const easeInCubic = (t) => t * t * t
    fadeOpacity.current = easeInCubic(fadeProgress)
    
    // Animate TV growing out and star shrinking when playing
    if (isPlaying) {
      if (startTimeRef.current === null) {
        startTimeRef.current = state.clock.elapsedTime
      }
      
      const elapsed = state.clock.elapsedTime - startTimeRef.current
      const duration = 2 // 2 seconds to grow
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      scaleRef.current = eased
      
      // Grow TV
      if (tvGroupRef.current) {
        const targetScale = 0.04
        tvGroupRef.current.scale.set(
          targetScale * eased,
          targetScale * eased,
          targetScale * eased
        )
      }
      
      // Shrink star
      if (spriteRef.current && spriteRef.current.material) {
        const starScale = 0.35 * (1 - eased) // Shrink from 0.35 to 0
        spriteRef.current.scale.set(starScale, starScale, starScale)
        spriteRef.current.material.opacity = 0.5 * fadeOpacity.current * (1 - eased)
      }
    } else {
      // Reset for next time
      startTimeRef.current = null
      scaleRef.current = 0
      
      // Show star at full size when not playing
      if (spriteRef.current && spriteRef.current.material) {
        spriteRef.current.material.opacity = 0.5 * fadeOpacity.current
        spriteRef.current.scale.set(0.35, 0.35, 0.35)
      }
    }
  })
  
  const handleClick = (e) => {
    e.stopPropagation()
    onClick(e)
  }
  
  return (
    <group position={position} onClick={handleClick}>
      {/* Always show the star */}
      <sprite ref={spriteRef} scale={[0.35, 0.35, 0.35]}>
        <spriteMaterial
          color="#ffffff"
          transparent={true}
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      
      {/* TV grows out when playing */}
      {isPlaying && (
        <OldTV 
          position={[0, 0, 0]} 
          scale={0.04}
          videoSrc={tvVideoSrc}
          groupRef={tvGroupRef}
        />
      )}
      
      {/* Click detection sphere (invisible) */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

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

// Camera animation controller
function CameraAnimationController({ animationPhase, onSpinComplete, controlsRef, playingVoicemail, voicemailPositions, isTVPlaying, tvPosition }) {
  const { camera } = useThree()
  const spinStartTime = useRef(null)
  const currentTargetId = useRef(null)
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const isTransitioning = useRef(false)
  const transitionStartPos = useRef(new THREE.Vector3())
  const transitionStartTarget = useRef(new THREE.Vector3())
  const transitionStartTime = useRef(0)
  const tvTransitionStarted = useRef(false)
  
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
    
    // TV camera focus - move camera to focus on TV when playing (PRIORITY OVER VOICEMAIL)
    if (isTVPlaying && animationPhase === 'interactive') {
      // Start new transition when TV starts playing
      if (!tvTransitionStarted.current) {
        tvTransitionStarted.current = true
        transitionStartPos.current.copy(camera.position)
        if (controlsRef.current) {
          transitionStartTarget.current.copy(controlsRef.current.target)
        } else {
          transitionStartTarget.current.set(0, 0, 0)
        }
        transitionStartTime.current = state.clock.elapsedTime
        
        // Disable controls during transition
        if (controlsRef.current) {
          controlsRef.current.enabled = false
        }
      }
      
      const elapsed = state.clock.elapsedTime - transitionStartTime.current
      const duration = 2 // 2 seconds transition
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth ease-in-out
      const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      }
      
      const easedProgress = easeInOutCubic(progress)
      
      // Target: camera positioned in front of TV and above, looking at TV
      const targetPos = new THREE.Vector3(tvPosition[0], tvPosition[1] + 2, tvPosition[2] + 3) // 3 units in front, 2 units up
      const targetLook = new THREE.Vector3(tvPosition[0], tvPosition[1], tvPosition[2])
      
      // Lerp camera position
      const newCameraPosition = new THREE.Vector3().lerpVectors(
        transitionStartPos.current,
        targetPos,
        easedProgress
      )
      camera.position.copy(newCameraPosition)
      
      // Lerp controls target
      if (controlsRef.current) {
        const newTarget = new THREE.Vector3().lerpVectors(
          transitionStartTarget.current,
          targetLook,
          easedProgress
        )
        controlsRef.current.target.copy(newTarget)
        controlsRef.current.update()
      }
      
      // Re-enable controls after transition
      if (progress >= 1 && controlsRef.current) {
        controlsRef.current.enabled = true
      }
      
      // Return early to prevent voicemail camera logic from running
      return
    } else if (!isTVPlaying && tvTransitionStarted.current) {
      // Reset when TV stops playing
      tvTransitionStarted.current = false
      if (controlsRef.current) {
        controlsRef.current.enabled = true
      }
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
function SceneContent({ animationPhase, onSpinComplete, controlsRef, selectedVoicemail, playingVoicemail, onVoicemailClick, audioAnalyser, onSceneReady, onTVClick, isTVPlaying }) {
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
  
  // TV position at the end of the chain
  const tvPosition = [0, 0, -15]
  
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
        isTVPlaying={isTVPlaying}
        tvPosition={tvPosition}
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
      
      {/* TV star - always visible at end of voicemail chain during interactive */}
      {animationPhase === 'interactive' && (
        <ClickableTV
          position={tvPosition}
          onClick={onTVClick}
          isPlaying={isTVPlaying}
        />
      )}
      
      {/* Voicemail particles - galaxy of voicemails, visible only during interactive */}
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
  const [isTVPlaying, setIsTVPlaying] = useState(false)

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
  
  // Handle TV click - stop any playing voicemail and start TV
  const handleTVClick = useCallback((e) => {
    if (e) e.stopPropagation()
    
    // Stop any playing voicemail
    if (voicemailAudioRef.current && playingVoicemail !== null) {
      voicemailAudioRef.current.pause()
      setPlayingVoicemail(null)
      setSelectedVoicemail(null)
    }
    
    // Toggle TV play/pause
    setIsTVPlaying(prev => !prev)
  }, [playingVoicemail, isTVPlaying])
  
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
            cursor: sceneReady && animationPhase === 'interactive' ? 'pointer' : 'default',
            pointerEvents: animationPhase === 'interactive' ? 'auto' : 'none'
          }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <SceneContent 
            animationPhase={animationPhase}
            onSpinComplete={handleSpinComplete}
            controlsRef={controlsRef}
            selectedVoicemail={selectedVoicemail}
            playingVoicemail={playingVoicemail}
            onVoicemailClick={handleVoicemailClick}
            audioAnalyser={analyserRef.current}
            onSceneReady={handleSceneReady}
            onTVClick={handleTVClick}
            isTVPlaying={isTVPlaying}
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

// Preload the TV model
useGLTF.preload('/assets/models/old_tv.glb')

export default Love



import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function ParticleAura({ 
  count = 2000,
  color = '#ffffff',
  size = 0.03,
  spread = 15,        // How far particles spread
  height = 12,        // Vertical spread
  driftSpeed = 0.3,   // How fast particles drift
  isTransitioning = false  // Transition animation
}) {
  const points = useRef()
  const transitionStartTime = useRef(null)
  
  // Create particles with flowing spiral energy patterns
  const { positions, colors, particleData } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const particleData = []
    
    for (let i = 0; i < count; i++) {
      // Create flowing spiral streams
      const streamIndex = Math.floor(Math.random() * 8) // 8 energy streams
      const streamProgress = Math.random()
      const streamRadius = 4 + Math.random() * (spread - 4)
      
      // Spiral parameters
      const spiralTurns = 3
      const theta = streamProgress * Math.PI * 2 * spiralTurns + (streamIndex * Math.PI / 4)
      const heightPos = (streamProgress - 0.5) * height
      
      const x = streamRadius * Math.cos(theta)
      const y = heightPos
      const z = streamRadius * Math.sin(theta) * 0.4
      
      // Add some randomness to break perfect spirals
      const randomOffset = 0.5 + Math.random() * 1.5
      
      // Flowing parameters for dynamic movement
      const flowSpeed = 0.8 + Math.random() * 1.2
      const flowPhase = Math.random() * Math.PI * 2
      const orbitRadius = streamRadius
      const orbitSpeed = 0.3 + Math.random() * 0.4
      
      // Color variation - blue to cyan to white energy
      const colorVariation = Math.random()
      let r, g, b
      if (colorVariation < 0.3) {
        // Bright cyan-blue
        r = 0.3 + Math.random() * 0.3
        g = 0.7 + Math.random() * 0.3
        b = 1.0
      } else if (colorVariation < 0.6) {
        // Bright white-blue
        r = 0.7 + Math.random() * 0.3
        g = 0.8 + Math.random() * 0.2
        b = 1.0
      } else {
        // Pure bright white
        r = 0.9 + Math.random() * 0.1
        g = 0.9 + Math.random() * 0.1
        b = 1.0
      }
      
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
      
      particleData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        flowSpeed,
        flowPhase,
        orbitRadius,
        orbitSpeed,
        streamIndex,
        randomOffset,
        heightBase: heightPos,
        // Transition velocities - radial outward dispersal
        transitionVelX: x / streamRadius + (Math.random() - 0.5) * 0.5,
        transitionVelY: (Math.random() - 0.3) * 2,
        transitionVelZ: z / (streamRadius * 0.4) + (Math.random() - 0.5) * 0.5
      })
      
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }
    
    return { positions, colors, particleData }
  }, [count, spread, height])
  
  // Create geometry with colors
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])
  
  // Animate particles with energetic flowing motion or transition dispersal
  useFrame((state) => {
    if (!points.current) return
    
    const posArray = points.current.geometry.attributes.position.array
    const time = state.clock.elapsedTime * driftSpeed * 2
    
    // Initialize transition timing
    if (isTransitioning && transitionStartTime.current === null) {
      transitionStartTime.current = state.clock.elapsedTime;
    }
    
    for (let i = 0; i < count; i++) {
      const p = particleData[i]
      
      if (isTransitioning) {
        // TRANSITION MODE - disperse outward like a cloud
        const transitionTime = state.clock.elapsedTime - transitionStartTime.current;
        
        // Smooth easing function (ease-in-out cubic)
        const easeInOutCubic = (t) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        // Gentle acceleration curve
        const normalizedTime = Math.min(transitionTime / 2.5, 1); // 2.5 second dispersal
        const easedProgress = easeInOutCubic(normalizedTime);
        const dispersionSpeed = easedProgress * 12; // Max distance multiplier
        
        // Smooth swirling turbulence with lower frequency
        const turbulence = Math.sin(state.clock.elapsedTime * 1.2 + i * 0.3) * 0.3 * easedProgress;
        
        const x = p.baseX + p.transitionVelX * dispersionSpeed + turbulence;
        const y = p.baseY + p.transitionVelY * dispersionSpeed;
        const z = p.baseZ + p.transitionVelZ * dispersionSpeed + turbulence * 0.3;
        
        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;
        
        // Smooth fade out with delay
        if (points.current.material) {
          const fadeStart = 0.3; // Start fading after 30% of animation
          const fadeProgress = Math.max(0, (normalizedTime - fadeStart) / (1 - fadeStart));
          const easedFade = easeInOutCubic(fadeProgress);
          points.current.material.opacity = 0.6 * (1 - easedFade);
        }
      } else {
        // Normal flowing spiral motion with energy
        const flowTime = time * p.flowSpeed + p.flowPhase
        const orbitAngle = time * p.orbitSpeed + (p.streamIndex * Math.PI / 4)
        
        // Spiral flow with dynamic radius pulsing
        const radiusPulse = 1 + Math.sin(flowTime * 0.5) * 0.2
        const currentRadius = p.orbitRadius * radiusPulse
        
        // Orbiting motion
        const x = currentRadius * Math.cos(orbitAngle) + Math.sin(flowTime * 1.5) * p.randomOffset
        const z = currentRadius * Math.sin(orbitAngle) * 0.4 + Math.cos(flowTime * 1.2) * p.randomOffset * 0.3
        
        // Vertical flow with wave motion
        const verticalFlow = Math.sin(flowTime + p.streamIndex) * 2
        const y = p.heightBase + verticalFlow + Math.cos(flowTime * 0.8) * 1.5
        
        posArray[i * 3] = x
        posArray[i * 3 + 1] = y
        posArray[i * 3 + 2] = z
      }
    }
    
    points.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={points}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        size={size * 1.5}
        vertexColors={true}
        transparent={true}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  )
}

export default ParticleAura

import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

function ModelParticles({ 
  modelPath, 
  color = '#ffffff', 
  size = 0.02, 
  density = 0.2,
  autoRotate = false,
  noiseStrength = 0.05,
  noiseSpeed = 0.8,
  violent = false,  // New prop for buzzing violent mode
  isTransitioning = false,  // New prop for transition animation
  transitionDuration = 2.5,  // Duration of scatter animation in seconds
  ...props 
}) {
  const points = useRef();
  const gltf = useLoader(GLTFLoader, modelPath);
  
  // Store random offsets for each particle for chaotic motion
  const randomOffsets = useRef(null);
  const transitionStartTime = useRef(null);
  const transitionVelocities = useRef(null);
  const gentleModeOffsets = useRef(null); // Store gentle mode offsets at transition start
  
  // Extract vertices from the model to create particles
  const { particles, originalPositions } = useMemo(() => {
    const vertices = [];
    const origPositions = [];
    
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.updateMatrixWorld(true);
        
        const positions = child.geometry.attributes.position.array;
        const worldMatrix = child.matrixWorld;
        
        for (let i = 0; i < positions.length; i += 3) {
          if (Math.random() <= density) {
            const localVertex = new THREE.Vector3(
              positions[i],
              positions[i + 1],
              positions[i + 2]
            );
            
            const worldVertex = localVertex.applyMatrix4(worldMatrix);
            
            vertices.push(worldVertex);
            origPositions.push({ 
              x: worldVertex.x, 
              y: worldVertex.y, 
              z: worldVertex.z 
            });
          }
        }
      }
    });
    
    // Generate random offsets for violent mode
    randomOffsets.current = origPositions.map(() => ({
      phase1: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      phase3: Math.random() * Math.PI * 2,
      freq1: 0.5 + Math.random() * 2,
      freq2: 0.5 + Math.random() * 2,
      freq3: 0.5 + Math.random() * 2,
      amp: 0.5 + Math.random() * 1.5
    }));
    
    // Generate random velocities for transition dispersal
    transitionVelocities.current = origPositions.map(() => ({
      x: (Math.random() - 0.5) * 2,
      y: 1 + Math.random() * 2, // Mostly upward
      z: (Math.random() - 0.5) * 2
    }));
    
    console.log(`Created ${vertices.length} particles from model`);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    
    return { particles: geometry, originalPositions: origPositions };
  }, [gltf, density]);
  
  // Animation - buzzing violent motion or transition dispersal
  useFrame((state, delta) => {
    if (points.current) {
      if (autoRotate && !isTransitioning) {
        points.current.rotation.y += delta * 0.1;
      }
      
      const positions = points.current.geometry.getAttribute('position');
      const time = state.clock.elapsedTime;
      
      // Initialize transition timing and capture gentle mode offsets
      if (isTransitioning && transitionStartTime.current === null) {
        transitionStartTime.current = time;
        
        // Capture current gentle mode offsets for smooth blending
        if (!gentleModeOffsets.current) {
          gentleModeOffsets.current = [];
          for (let i = 0; i < positions.count; i++) {
            const speed = noiseSpeed;
            gentleModeOffsets.current.push({
              x: Math.sin(time * speed + i * 0.1) * noiseStrength,
              y: Math.cos(time * speed * 0.7 + i * 0.2) * noiseStrength,
              z: Math.sin(time * speed * 0.5 + i * 0.3) * noiseStrength
            });
          }
        }
      }
      
      for (let i = 0; i < positions.count; i++) {
        const origPos = originalPositions[i];
        const offsets = randomOffsets.current[i];
        
        let nx, ny, nz;
        
        if (isTransitioning) {
          // TRANSITION MODE - particles float away like a cloud
          const transitionTime = time - transitionStartTime.current;
          const velocity = transitionVelocities.current[i];
          
          // Smooth easing function (ease-in-out cubic)
          const easeInOutCubic = (t) => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          };
          
          // Gentle acceleration curve
          const normalizedTime = Math.min(transitionTime / transitionDuration, 1);
          const easedProgress = easeInOutCubic(normalizedTime);
          const dispersionSpeed = easedProgress * 8; // Max distance multiplier
          
          // Smooth turbulence with lower frequency
          const turbulence = Math.sin(time * 1.5 + i * 0.5) * 0.2 * easedProgress;
          
          // Get starting gentle mode offset for smooth blend
          const gentleOffset = gentleModeOffsets.current[i];
          
          // Blend from gentle mode offset to dispersion
          const blendFactor = Math.min(normalizedTime * 2, 1); // Blend over first 50% of transition
          
          nx = gentleOffset.x * (1 - blendFactor) + (velocity.x * dispersionSpeed + turbulence) * blendFactor;
          ny = gentleOffset.y * (1 - blendFactor) + (velocity.y * dispersionSpeed) * blendFactor;
          nz = gentleOffset.z * (1 - blendFactor) + (velocity.z * dispersionSpeed + turbulence * 0.5) * blendFactor;
          
          // Smooth fade opacity with delay
          if (points.current.material) {
            const fadeStart = 0.3; // Start fading after 30% of animation
            const fadeProgress = Math.max(0, (normalizedTime - fadeStart) / (1 - fadeStart));
            const easedFade = easeInOutCubic(fadeProgress);
            points.current.material.opacity = 1 - easedFade;
          }
        } else if (violent) {
          // VIOLENT BUZZING MODE
          const speed = noiseSpeed * 8; // Much faster
          const strength = noiseStrength * 3; // Stronger displacement
          
          // Multiple overlapping high-frequency oscillations
          const buzz1 = Math.sin(time * speed * offsets.freq1 + offsets.phase1) * strength * offsets.amp;
          const buzz2 = Math.cos(time * speed * offsets.freq2 + offsets.phase2) * strength * offsets.amp;
          const buzz3 = Math.sin(time * speed * offsets.freq3 + offsets.phase3) * strength * offsets.amp;
          
          // Add rapid jitter
          const jitter = Math.sin(time * 50 + i) * strength * 0.3;
          
          // Chaotic layered noise
          const chaos1 = Math.sin(time * 15 + i * 0.5) * strength * 0.5;
          const chaos2 = Math.cos(time * 12 + i * 0.3) * strength * 0.4;
          const chaos3 = Math.sin(time * 18 + i * 0.7) * strength * 0.6;
          
          nx = buzz1 + chaos1 + jitter;
          ny = buzz2 + chaos2 + jitter * 0.7;
          nz = buzz3 + chaos3 + jitter * 0.5;
        } else {
          // Normal gentle mode
          const speed = noiseSpeed;
          nx = Math.sin(time * speed + i * 0.1) * noiseStrength;
          ny = Math.cos(time * speed * 0.7 + i * 0.2) * noiseStrength;
          nz = Math.sin(time * speed * 0.5 + i * 0.3) * noiseStrength;
        }
        
        positions.setXYZ(
          i,
          origPos.x + nx,
          origPos.y + ny,
          origPos.z + nz
        );
      }
      
      positions.needsUpdate = true;
    }
  });
  
  return (
    <points ref={points} {...props}>
      <primitive object={particles} attach="geometry" />
      <pointsMaterial 
        size={size} 
        color={color} 
        sizeAttenuation={true} 
        transparent={true}
        alphaTest={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default ModelParticles;

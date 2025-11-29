import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Billboard } from '@react-three/drei'
import * as THREE from 'three'

function ImagePlane({ 
  url, 
  position = [0, 0, 0], 
  scale = 1,
  onClick,
  index,
  isSelected = false,
  isZoomedIn = false
}) {
  const billboardRef = useRef()
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  // Load texture
  const texture = useTexture(url)
  
  // Calculate aspect ratio from texture
  const aspect = texture.image ? texture.image.width / texture.image.height : 4/3
  const planeWidth = 2 * scale
  const planeHeight = planeWidth / aspect
  
  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (billboardRef.current) {
      if (!isZoomedIn) {
        const floatY = Math.sin(time * 0.3 + index * 0.5) * 0.15
        const floatX = Math.cos(time * 0.2 + index * 0.7) * 0.12
        billboardRef.current.position.lerp(
          new THREE.Vector3(position[0] + floatX, position[1] + floatY, position[2]),
          0.1
        )
      } else {
        billboardRef.current.position.lerp(
          new THREE.Vector3(...position),
          0.2
        )
      }
    }
    
    if (meshRef.current) {
      let targetScale = 1
      if (isZoomedIn) {
        targetScale = 28 // Much larger when viewing
      } else if (isSelected) {
        targetScale = 3
      } else if (hovered) {
        targetScale = 1.6
      }
      
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale), 
        0.08
      )
    }
  })
  
  return (
    <Billboard
      ref={billboardRef}
      position={position}
      follow
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial 
          map={texture} 
          side={THREE.DoubleSide}
          transparent={true}
          opacity={isZoomedIn ? 1 : (isSelected ? 0.95 : (hovered ? 0.85 : 0.7))}
        />
      </mesh>
      
      {/* Glow ring for selected (when not zoomed) */}
      {isSelected && !isZoomedIn && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[planeWidth * 0.6, planeWidth * 0.7, 32]} />
          <meshBasicMaterial 
            color="#ffffff"
            transparent={true}
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </Billboard>
  )
}

export default ImagePlane

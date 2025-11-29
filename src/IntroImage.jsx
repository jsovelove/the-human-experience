import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

function IntroImage({ imageUrl, onDismiss }) {
  const meshRef = useRef()
  const [isDissolving, setIsDissolving] = useState(false)
  const dissolveProgress = useRef(0)
  
  // Load texture
  const texture = useTexture(imageUrl)
  
  // Custom shader material for dissolve effect
  const shaderMaterial = useRef(
    new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        dissolve: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float dissolve;
        varying vec2 vUv;
        
        // Simple noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec4 texColor = texture2D(map, vUv);
          float noise = random(vUv * 10.0);
          
          // Dissolve effect
          if (noise < dissolve) {
            discard;
          }
          
          // Fade out as well
          float alpha = texColor.a * (1.0 - dissolve);
          gl_FragColor = vec4(texColor.rgb, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })
  )
  
  // Update dissolve animation
  useFrame((state, delta) => {
    if (isDissolving && meshRef.current) {
      dissolveProgress.current += delta * 1.5 // Speed of dissolve
      shaderMaterial.current.uniforms.dissolve.value = dissolveProgress.current
      
      // When fully dissolved, notify parent
      if (dissolveProgress.current >= 1.0) {
        onDismiss()
      }
    }
  })
  
  const handleClick = (e) => {
    e.stopPropagation()
    setIsDissolving(true)
  }
  
  // Calculate plane size to fill camera view
  // Assuming camera FOV of 55 degrees and distance
  const aspect = texture.image ? texture.image.width / texture.image.height : 16/9
  const height = 20
  const width = height * aspect
  
  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 10]}
      onClick={handleClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <planeGeometry args={[width, height]} />
      <primitive object={shaderMaterial.current} attach="material" />
    </mesh>
  )
}

export default IntroImage


import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, DotScreen } from '@react-three/postprocessing'
import ModelParticles from './ModelParticles'
import ParticleAura from './SpiralEmitter'
import LikertScale from './LikertScale'
import * as THREE from 'three'

// Scene content - just the particle figures and aura
function SceneContent({ isTransitioning, scrollSpread }) {
  return (
    <>
      {/* Scene lighting */}
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#4466ff" intensity={0.3} />
      <pointLight position={[0, 5, 0]} color="#ffffff" intensity={0.5} />
      
      {/* Three particle models side by side - all white, very gentle buzzing, stretched on z-axis */}
      <group position={[0, -8, 0]}>
        {/* Particle cloud aura surrounding the models */}
        <ParticleAura 
          position={[0, 0, 0]}
          particleCount={2000}
          radius={15}
          color="#ffffff"
          opacity={0.3}
          size={0.08}
          scrollSpread={scrollSpread}
        />
        
        {/* Left model */}
        <ModelParticles 
          modelPath="/low_poly_dummy__human_figure.glb"
          color="#ffffff"
          size={0.14}
          density={20}
          autoRotate={false}
          noiseStrength={0.1}
          noiseSpeed={0.01}
          violent={true}
          position={[-8, 0, 0]}
          scale={[1.3, 1.3, 2.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          isTransitioning={isTransitioning}
          scrollSpread={scrollSpread}
        />
        
        {/* Center model */}
        <ModelParticles 
          modelPath="/low_poly_dummy__human_figure.glb"
          color="#ffffff"
          size={0.14}
          density={10}
          autoRotate={false}
          noiseStrength={0.1}
          noiseSpeed={0.01}
          violent={true}
          position={[0, 0, 0]}
          scale={[1.3, 1.3, 2.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          isTransitioning={isTransitioning}
          scrollSpread={scrollSpread}
        />
        
        {/* Right model */}
        <ModelParticles 
          modelPath="/low_poly_dummy__human_figure.glb"
          color="#ffffff"
          size={0.14}
          density={10}
          autoRotate={false}
          noiseStrength={0.1}
          noiseSpeed={0.01}
          violent={true}
          position={[8, 0, 0]}
          scale={[1.3, 1.3, 2.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          isTransitioning={isTransitioning}
          scrollSpread={scrollSpread}
        />
      </group>
      
      {/* Post-processing effects - Lo-fi aesthetic */}
      <EffectComposer>
        
        <DotScreen 
          angle={Math.PI * 0.5}
          scale={0.9}
          opacity={0.1}
        />
        <Noise opacity={0.08} />
        
      </EffectComposer>
    </>
  )
}

function God() {
  const navigate = useNavigate()
  
  // Cloudinary configuration
  const cloudName = 'dgbrj4suu'
  
  // Generate Cloudinary URLs
  const getCloudinaryUrl = (imageId) => {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${imageId}.png`
  }
  
  // Image and text pairs - each image has associated text and positioning
  const imageTextPairs = [
    {
      imageId: '10_page4_eccsha',
      text: 'Everything is god, god is a rock, god is a dog, god is a xylophone, god is your grandma.',
      textPosition: { top: '200px', left: '70%', width: '25%' },
      imagePosition: { top: '200px', left: '8%', width: '45%' }
    },
    {
      imageId: '7_page4_ncqs7w',
      text: 'Love and yummy food, and friendship and identity, sexuality?',
      imagePosition: { top: '830px', left: '60%', width: '34%' }
    },
    {
      imageId: '15_page4_lcicci',
      text: '.........................',
      imagePosition: { top: '3000px', left: '10%', width: '14%' },
    },
    {
      imageId: '17_page4_ixthmq',
      text: "What isn't?",
      imagePosition: { top: '1000px', left: '30%', width: '24%' }
    },
    {
      imageId: '14_page4_xvwgby',
      text: '.......',
      imagePosition: { top: '950px', left: '8%', width: '24%' },
      textPosition: { top: '1000px', left: '40%', width: '25%' }
    },
    {
      imageId: '16_page4_qviww4',
      text: 'Water.',
      imagePosition: { top: '1550px', left: '65%', width: '24%' },
      textPosition: { top: '1550px', left: '35%', width: '30%' }
    },
    {
      imageId: '13_page4_r5ptw6',
      text: '..........................',
      imagePosition: { top: '2100px', left: '10%', width: '24%' },
      textPosition: { top: '2150px', left: '32%', width: '26%' }
    },
    {
      imageId: '12_page4_uer6lc',
      text: '..............',
      imagePosition: { top: '2050px', left: '50%', width: '24%' }
    },
    {
      imageId: '11_page4_stnplx',
      text: 'The river.',
      imagePosition: { top: '2700px', left: '5%', width: '24%' },
      textPosition: { top: '2750px', left: '8%', width: '27%' }
    },
    {
      imageId: '8_page4_t5ms6w',
      text: "I don't know, but I know what a cave is.",
      imagePosition: { top: '2650px', left: '60%', width: '24%' }
    },
    {
      imageId: '4_page4_qoxte7',
      text: 'The maker of many linked chain.',
      imagePosition: { top: '3300px', left: '35%', width: '24%' },
      textPosition: { top: '3350px', left: '10%', width: '25%' }
    },
    {
      imageId: '9_page4_fdyfhv',
      text: '........................',
      imagePosition: { top: '3850px', left: '65%', width: '24%' },
      textPosition: { top: '3950px', left: '50%', width: '28%' }
    },
    {
      imageId: '2_page4_n4wti4',
      text: 'The spirit of the universe, fate, time, being, becoming, loving, creating, living!',
      imagePosition: { top: '4500px', left: '30%', width: '24%' },
      textPosition: { top: '4550px', left: '35%', width: '30%' }
    },
    {
      imageId: '3_page4_sfajxx',
      text: '........................',
      imagePosition: { top: '5100px', left: '10%', width: '24%' },
      textPosition: { top: '5150px', left: '32%', width: '25%' }
    },
    {
      imageId: '6_page4_gavj8x',
      text: 'Energy / experience',
      imagePosition: { top: '5050px', left: '60%', width: '24%' },
      textPosition: { top: '5390px', left: '51%', width: '25%' }
    },
    {
      imageId: '1_page4_wf3q9j',
      text: '[God is] carrot cake, the possibilities of drugs at an underground party, job security.',
      imagePosition: { top: '5700px', left: '5%', width: '24%' }
    },
    {
      imageId: '5_page4_ojdw6u',
      text: 'God is love I think and the string between us.',
      imagePosition: { top: '6300px', left: '50%', width: '24%' }
    }
  ]

  const [showData, setShowData] = useState(false)
  const [likertData, setLikertData] = useState([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [fadeOverlay, setFadeOverlay] = useState(0)
  const [scrollSpread, setScrollSpread] = useState(0)
  const controlsRef = useRef(null)
  const scrollContainerRef = useRef(null)
  
  // Handle transition to Questions for God page
  const handleTransitionToQuestions = (e) => {
    e.preventDefault()
    setIsTransitioning(true)
    
    // Start particle dispersion and fade overlay after particles have dispersed a bit
    setTimeout(() => {
      let fadeProgress = 0
      const fadeInterval = setInterval(() => {
        // Smooth ease-in fade
        fadeProgress += 0.012 // Slightly slower fade
        const easedFade = fadeProgress < 0.5 
          ? 2 * fadeProgress * fadeProgress 
          : 1 - Math.pow(-2 * fadeProgress + 2, 2) / 2
        
        setFadeOverlay(easedFade)
        
        if (fadeProgress >= 1) {
          clearInterval(fadeInterval)
          // Navigate to questions page
          navigate('/questions-for-god')
        }
      }, 16) // ~60fps
    }, 1800) // Wait for particles to disperse more
  }

  // Helper to parse CSV respecting quoted commas
  const parseCsvLine = (line) => {
    const values = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    if (current.length > 0 || line.endsWith(',')) {
      values.push(current.trim())
    }

    return values
  }

  // Track scroll position for particle spreading
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const scrollY = scrollContainer.scrollTop
      const maxScroll = 4500 // Scroll distance over which particles spread (fast spread at top)
      // Normalize scroll to 0-1, then apply easing
      const normalized = Math.min(scrollY / maxScroll, 1)
      // Ease-out cubic for smooth spreading
      const eased = 1 - Math.pow(1 - normalized, 3)
      console.log('Scroll Y:', scrollY, 'Spread:', eased) // Debug log
      setScrollSpread(eased)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // Load and parse CSV data
  useEffect(() => {
    fetch('/likert-scale-data.csv')
      .then(response => response.text())
      .then(csvText => {
        const lines = csvText.trim().split('\n').filter(Boolean)
        if (lines.length === 0) return

        const headers = parseCsvLine(lines[0]).map(h => h.trim().replace(/^["']|["']$/g, ''))

        const data = lines.slice(1)
          .map(line => parseCsvLine(line))
          .filter(row => row.length > 0)
          .map(row => {
            const normalizedRow = headers.map((_, idx) => row[idx] ?? '')
            return normalizedRow.map(value => parseFloat(value) || 0)
          })
        
        const processedData = headers.map((question, qIndex) => {
          const validValues = data.map(row => row[qIndex]).filter(v => v > 0 && v <= 5)
          
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          
          validValues.forEach(value => {
            const roundedValue = Math.round(value)
            if (roundedValue >= 1 && roundedValue <= 5) {
              distribution[roundedValue]++
            }
          })
          
          const avg = validValues.reduce((sum, val) => sum + val, 0) / (validValues.length || 1)
          
          return {
            question: question,
            average: validValues.length ? avg.toFixed(2) : '0.00',
            distribution: distribution,
            total: validValues.length
          }
        })
        
        setLikertData(processedData)
      })
      .catch(err => console.error('Error loading CSV:', err))
  }, [])  

  return (
    <div ref={scrollContainerRef} className="app" style={{ backgroundColor: 'black', width: '100%', minHeight: '100vh', overflow: 'auto' }}>
      <style>
        {`
          @font-face {
            font-family: 'GodFont';
            src: url('/fonts/FA_PTGWDOBSHK.ttf') format('truetype');
          }
          
          @font-face {
            font-family: 'QuestionFont';
            src: url('/fonts/FA_MNGEZKQIKB.ttf') format('truetype');
          }
        `}
      </style>
      
      {/* Three.js Scene - Top section */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 60], fov: 55 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ 
          width: '100%',
          height: '150vh',
          backgroundColor: 'transparent',
          display: 'block',
          margin: '-50vh auto 0'
        }}
      >
        <Suspense fallback={null}>
          <SceneContent 
            isTransitioning={isTransitioning}
            scrollSpread={scrollSpread}
          />
          
          {/* Orbit controls for looking around */}
          <OrbitControls 
            ref={controlsRef}
            enableZoom={false}
            enablePan={true}
            enableRotate={true}
            autoRotate={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
      
      {/* Title */}
      <div style={{
        textAlign: 'center',
        paddingTop: '3rem',
        marginBottom: '6rem'
      }}>
        <h1 style={{
          fontFamily: 'GodFont, serif',
          fontSize: '20rem',
          color: 'white',
          margin: 0,
          letterSpacing: '0.2em',
          fontWeight: 'normal'
        }}>
          GOD
        </h1>
      </div>
      
      {/* Diagram Image */}
      <div style={{
        textAlign: 'center',
        marginBottom: '4rem'
      }}>
        <img 
          src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769109607/diagram_idnm6y.png"
          alt="Diagram"
          style={{
            maxWidth: '800px',
            width: '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto'
          }}
        />
      </div>
      
      {/* Collage section */}
      <div style={{
        backgroundColor: 'black',
        padding: '8rem 0',
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          height: '850px'
        }}>
          {/* Image 1 */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769116927/6ef917623042479010aef7cf787a6e8d_cjkngi.jpg"
            alt="Gallery image 1"
            style={{
              position: 'absolute',
              left: '2%',
              top: '20px',
              maxWidth: '200px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 2 */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769116440/ef44033aef54a6c972d96dc42eb81288_h9oy29.jpg"
            alt="Gallery image 2"
            style={{
              position: 'absolute',
              left: '28%',
              top: '80px',
              maxWidth: '180px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 3 */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769116930/dea4d49075588a03ac54245e2d472e08_bl6gtq.jpg"
            alt="Gallery image 3"
            style={{
              position: 'absolute',
              right: '2%',
              top: '30px',
              maxWidth: '180px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 4 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769116932/62158c78d3ea7e328ade330226869c7b_m7lsvf.jpg"
            alt="Gallery image 4"
            style={{
              position: 'absolute',
              left: '5%',
              top: '300px',
              maxWidth: '190px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 5 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769116930/160c1921c6748753bb042dbf46708e9e_zzjlvf.jpg"
            alt="Gallery image 5"
            style={{
              position: 'absolute',
              left: '48%',
              transform: 'translateX(-50%)',
              top: '350px',
              maxWidth: '170px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 6 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769116927/b0935f553b358c2a37c8e403a0d50893_zaxtch.jpg"
            alt="Gallery image 6"
            style={{
              position: 'absolute',
              right: '3%',
              top: '320px',
              maxWidth: '185px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 7 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769116928/61e56b5f25d4e9a07df07ae11a8223b3_vplyfp.jpg"
            alt="Gallery image 7"
            style={{
              position: 'absolute',
              left: '52%',
              top: '150px',
              maxWidth: '165px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 8 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769122644/f94049e7647d4337ea3636ad4b140ba9_joq6g1.jpg"
            alt="Gallery image 8"
            style={{
              position: 'absolute',
              left: '32%',
              top: '240px',
              maxWidth: '175px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 9 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769122725/ac79e0729e3c05fe967d6acd98e2af6e_abzwtg.jpg"
            alt="Gallery image 9"
            style={{
              position: 'absolute',
              left: '65%',
              top: '200px',
              maxWidth: '160px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 10 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769122938/15a46233f9ff53c91588c2618aefc4cd_aaqt3f.jpg"
            alt="Gallery image 10"
            style={{
              position: 'absolute',
              left: '12%',
              top: '450px',
              maxWidth: '170px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 11 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769122940/6ea768de13018412a46a3af8239240e1_r01c6y.jpg"
            alt="Gallery image 11"
            style={{
              position: 'absolute',
              right: '8%',
              top: '480px',
              maxWidth: '165px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 12 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769123205/eeee4114397030e4a582c94fb3f20964_dgiseu.jpg"
            alt="Gallery image 12"
            style={{
              position: 'absolute',
              left: '75%',
              top: '420px',
              maxWidth: '155px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 13 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769123210/5c82c2cd8878e7a8dbcb3da4ce3b9555_bbmvms.jpg"
            alt="Gallery image 13"
            style={{
              position: 'absolute',
              left: '40%',
              top: '520px',
              maxWidth: '160px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 14 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769123476/109db6dbd4e9366cab2d4611ebd0feea_lb3xi8.jpg"
            alt="Gallery image 14"
            style={{
              position: 'absolute',
              left: '58%',
              top: '560px',
              maxWidth: '155px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 15 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769123416/f322d29933724f442545722dfb1c70ee_xpqzni.jpg"
            alt="Gallery image 15"
            style={{
              position: 'absolute',
              left: '22%',
              top: '580px',
              maxWidth: '150px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 16 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769123624/a8e3d15712c1f171c568705516260a85_ywsfaa.jpg"
            alt="Gallery image 16"
            style={{
              position: 'absolute',
              left: '85%',
              top: '650px',
              maxWidth: '145px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Image 17 - new */}
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769123621/b1e543e658dc5d57345a7ec4809ccf60_w5laic.jpg"
            alt="Gallery image 17"
            style={{
              position: 'absolute',
              left: '8%',
              top: '680px',
              maxWidth: '155px',
              width: '100%',
              height: 'auto'
            }}
          />
        </div>
      </div>
      
      {/* Content section - black background */}
      <div style={{
        padding: '3rem 2rem',
        backgroundColor: 'black',
        position: 'relative'
      }}>
        <style>
          {`
            .staggered-gallery {
              max-width: 1200px;
              margin: 0 auto;
              padding-bottom: 5rem;
            }
            
            .staggered-item {
              display: flex;
              align-items: center;
              gap: 3rem;
              margin-bottom: 8rem;
              position: relative;
            }
            
            .staggered-item.left {
              flex-direction: row;
            }
            
            .staggered-item.right {
              flex-direction: row-reverse;
            }
            
            .staggered-image {
              flex: 0 0 500px;    /* Change this value for image width */
              max-width: 500px;   /* Change this to match */
            }
            
            .staggered-image img {
              width: 100%;
              height: auto;
              display: block;
            }
            
            .staggered-text {
              flex: 1;
              color: white;
              font-family: monospace;
              font-size: 1.1rem;
              line-height: 1.6;
              letter-spacing: 0.02em;
            }
            
            .staggered-text.left {
              text-align: left;
            }
            
            .staggered-text.right {
              text-align: right;
            }
            
            @media (max-width: 768px) {
              .staggered-item {
                flex-direction: column !important;
                gap: 1.5rem;
                margin-bottom: 5rem;
              }
              
              .staggered-image {
                flex: 1;
                max-width: 100%;
              }
              
              .staggered-text {
                text-align: left !important;
              }
            }
          `}
        </style>
        
        {/* Staggered left-right gallery with text on opposite sides */}
        <div className="staggered-gallery">
          {imageTextPairs.map((pair, index) => {
            const isLeft = index % 2 === 0
            
            return (
              <div 
                key={index} 
                className={`staggered-item ${isLeft ? 'left' : 'right'}`}
              >
                {/* Image */}
                <div className="staggered-image">
                  <img
                    src={getCloudinaryUrl(pair.imageId)}
                    alt={`Drawing ${index + 1}`}
                    loading="lazy"
                  />
                </div>
                
                {/* Text (if exists) */}
                {pair.text && (
                  <div className={`staggered-text ${isLeft ? 'left' : 'right'}`}>
                    {pair.text}
                  </div>
                )}
                
                {/* Empty space if no text */}
                {!pair.text && <div style={{ flex: '1' }} />}
              </div>
            )
          })}
        </div>

        {/* Mountains image - large separator */}
        <div style={{
          width: '100%',
          marginTop: '8rem',
          marginBottom: '4rem',
          position: 'relative'
        }}>
          
          <img 
            src="https://res.cloudinary.com/dgbrj4suu/image/upload/v1769126796/mountains_hxtaj0.png"
            alt="Mountains"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
           {/* Text above mountains */}
           <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <p style={{
              fontFamily: 'QuestionFont, serif',
              fontSize: '7.5rem',
              color: 'white',
              margin: 0,
              letterSpacing: '0.05em'
            }}>
              what would happen if god died
            </p>
          </div>
        </div>

        {/* Data display section */}
        {showData && likertData.length > 0 && (
          <div style={{
            maxWidth: '1400px',
            margin: '3rem auto 0',
            padding: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <LikertScale data={likertData} />
          </div>
        )}

        {/* Navigation controls at bottom */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          marginTop: '4rem',
          paddingBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowData(!showData)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease',
              opacity: showData ? 1 : 0.5,
              padding: 0,
              outline: 'none',
              letterSpacing: '0.05em',
              fontWeight: showData ? '600' : '400'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = showData ? '1' : '0.5'}
          >
            DATA
          </button>
          
          <Link 
            to="/draw-god" 
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease',
              opacity: 0.5,
              padding: 0,
              outline: 'none',
              letterSpacing: '0.05em',
              fontWeight: '400',
              background: 'transparent'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.5'}
          >
            PLEASE DRAW GOD
          </Link>
          
          <a 
            href="/questions-for-god"
            onClick={handleTransitionToQuestions}
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease',
              opacity: 0.5,
              padding: 0,
              outline: 'none',
              letterSpacing: '0.05em',
              fontWeight: '400',
              background: 'transparent'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.5'}
          >
            QUESTIONS FOR GOD
          </a>
        </div>
      </div>


      {/* Back button */}
      <Link 
        to="/explore" 
        style={{ 
          position: 'fixed',
          top: '2rem',
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

      {/* Fade to black overlay for transition */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity: fadeOverlay,
        pointerEvents: 'none',
        zIndex: 100,
        transition: 'opacity 0.1s linear'
      }} />

    </div>
  )
}

export default God

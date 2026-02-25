import './App.css'
import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

// ─── Cloudinary helpers ────────────────────────────────────────────────────────
const CLOUD = 'https://res.cloudinary.com/dgbrj4suu/image/upload'
// w_1200 keeps GPU memory reasonable; q_auto/f_auto = smart compression + format
const imgUrl = (path) => `${CLOUD}/w_1200,q_auto,f_auto/${path}`

// ─── Layer speeds (parallax multipliers) ──────────────────────────────────────
// 0 = far background (moves barely), 1.0 = foreground (moves at full drag speed)
const LAYER_SPEEDS  = [0.12, 0.38, 0.70, 1.0]
const LAYER_ALPHAS  = [0.70, 0.82, 0.92, 0.96]

// ─── Asset manifest ───────────────────────────────────────────────────────────
// x / y  : world-space offset from viewport centre (px)
// targetH: target height as fraction of viewport height
// num    : sequential label number (matching original ordering); omit for Past Lives
//
// Original imageIds order  →  num
//   soul17  01  soul16  02  soul15  03  soul14  04  soul10  05
//   soul13  06  soul12  07  soul11  08  soul9   09  soul8   10
//   soul7   11  soul6   12  soul5   13  soul4   14  soul3   15
//   soul1   16  soul2   17
const ASSETS = [
  // ── Layer 0 — deep background (slowest) ─────────────────────────────────────
  { path: 'soul17_xzycho', layer: 0, x: -2900, y: -320, targetH: 0.27, num:  1 },
  { path: 'soul5_wyvcjp',  layer: 0, x:  2600, y:  310, targetH: 0.25, num: 13 },
  { path: 'soul9_rlk43c',  layer: 0, x:  -980, y:  680, targetH: 0.29, num:  9 },
  { path: 'soul13_vxxlen', layer: 0, x:  3900, y: -450, targetH: 0.27, num:  6 },
  { path: 'soul1_wjjjri',  layer: 0, x:   820, y: -780, targetH: 0.25, num: 16 },

  // ── Layer 1 — mid background ─────────────────────────────────────────────────
  { path: 'soul3_ivuzbz',  layer: 1, x:  -780, y:  -60, targetH: 0.34, num: 15 },
  { path: 'soul6_kqsbzv',  layer: 1, x:  1380, y:  270, targetH: 0.32, num: 12 },
  { path: 'soul10_zmmhq7', layer: 1, x:  -500, y:  570, targetH: 0.34, num:  5 },
  { path: 'soul14_sii3a3', layer: 1, x:  2450, y: -160, targetH: 0.31, num:  4 },
  { path: 'soul2_f7kf9t',  layer: 1, x:   270, y: -480, targetH: 0.34, num: 17 },
  { path: 'soul8_yqgf3r',  layer: 1, x: -1900, y:  200, targetH: 0.32, num: 10 },

  // ── Layer 2 — mid foreground ─────────────────────────────────────────────────
  { path: 'soul4_wzzogk',  layer: 2, x:  -340, y:  -35, targetH: 0.41, num: 14 },
  { path: 'soul7_lqmts9',  layer: 2, x:   880, y:  145, targetH: 0.39, num: 11 },
  { path: 'soul11_zphb7k', layer: 2, x: -1300, y:  400, targetH: 0.41, num:  8 },
  { path: 'soul15_whnwwg', layer: 2, x:  1950, y: -125, targetH: 0.39, num:  3 },
  { path: 'soul12_oif5tw', layer: 2, x:   320, y:  510, targetH: 0.37, num:  7 },
  { path: 'soul16_krs78i', layer: 2, x:  -840, y: -460, targetH: 0.41, num:  2 },

  // ── Layer 3 — foreground / Past Lives (full speed) ───────────────────────────
  { path: 'v1769404831/Past_Lives_qyr4um.png',  layer: 3, x:  3350, y: -190, targetH: 0.44 },
  { path: 'v1769405868/Past_Lives_1_s0bdi8.png', layer: 3, x:  4150, y:   95, targetH: 0.50 },
  { path: 'v1769405930/Past_Lives_2_dzag5e.png', layer: 3, x:  4920, y:  245, targetH: 0.34 },
  { path: 'v1769405968/Past_Lives_3_iayzuy.png', layer: 3, x:  4920, y: -300, targetH: 0.34 },
  { path: 'v1769795840/12_maagy5.png',           layer: 3, x:  5680, y: -195, targetH: 0.37 },
  { path: 'v1769795594/13_vo83au.png',           layer: 3, x:  5680, y:  295, targetH: 0.37 },
]

// ─────────────────────────────────────────────────────────────────────────────
function Soul() {
  const containerRef = useRef(null)

  useEffect(() => {
    // ── Inject global styles (font + noise) ──────────────────────────────────
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'SoulFont';
        src: url('/fonts/FA_KVVPUFNXWX.ttf') format('truetype');
      }
      body, html {
        overflow: hidden !important;
        height: 100vh;
        width: 100vw;
      }
      * { box-sizing: border-box; }
      .noise-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        opacity: 0.15;
        z-index: 1000;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        mix-blend-mode: overlay;
      }
    `
    document.head.appendChild(style)
    document.body.style.overflow = 'hidden'

    const W = window.innerWidth
    const H = window.innerHeight

    // ── Pixi application ──────────────────────────────────────────────────────
    const app = new PIXI.Application({
      width: W,
      height: H,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false, // off for performance with many sprites
    })

    const el = containerRef.current
    el.appendChild(app.view)
    app.view.style.cursor = 'grab'
    app.view.style.display = 'block'

    // ── Layer containers ──────────────────────────────────────────────────────
    const layerContainers = LAYER_SPEEDS.map(() => {
      const c = new PIXI.Container()
      app.stage.addChild(c)
      return c
    })

    // ── Place all sprites ─────────────────────────────────────────────────────
    ASSETS.forEach((asset) => {
      const lc = layerContainers[asset.layer]
      const targetHeightPx = H * asset.targetH

      const sprite = PIXI.Sprite.from(imgUrl(asset.path))
      sprite.anchor.set(0.5, 0.5)
      sprite.x = W / 2 + asset.x
      sprite.y = H / 2 + asset.y
      sprite.alpha = LAYER_ALPHAS[asset.layer]

      // Resize sprite once its texture is known
      const setSpriteSize = () => {
        const tex = sprite.texture
        if (!tex || tex.height === 0) return
        sprite.height = targetHeightPx
        sprite.scale.x = sprite.scale.y // preserve aspect ratio

        // Attach number label after size is resolved
        if (asset.num !== undefined) {
          const label = new PIXI.Text(
            `(${String(asset.num).padStart(2, '0')})`,
            {
              fontFamily: 'monospace',
              fontSize: 11,
              fill: 0xffffff,
            }
          )
          label.alpha = 0.55
          label.anchor.set(1, 0)
          // Position at bottom-right of the sprite (relative to same container)
          label.x = sprite.x + sprite.width  / 2
          label.y = sprite.y + sprite.height / 2 + 5
          lc.addChild(label)
        }
      }

      if (sprite.texture.baseTexture.valid) {
        setSpriteSize()
      } else {
        sprite.texture.baseTexture.once('loaded', setSpriteSize)
      }

      lc.addChild(sprite)
    })

    // ── Drag + inertia ────────────────────────────────────────────────────────
    let isDragging = false
    let lastX = 0
    let lastY = 0
    let velX  = 0
    let velY  = 0

    const onPointerDown = (e) => {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      velX = 0
      velY = 0
      app.view.style.cursor = 'grabbing'
    }

    const onPointerMove = (e) => {
      if (!isDragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      velX = dx
      velY = dy
      layerContainers.forEach((c, i) => {
        c.x += dx * LAYER_SPEEDS[i]
        c.y += dy * LAYER_SPEEDS[i]
      })
    }

    const onPointerUp = () => {
      isDragging = false
      app.view.style.cursor = 'grab'
    }

    app.view.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup',   onPointerUp)

    // Inertia ticker — momentum glide after releasing drag
    app.ticker.add(() => {
      if (isDragging) return
      if (Math.abs(velX) < 0.05 && Math.abs(velY) < 0.05) return
      velX *= 0.90
      velY *= 0.90
      layerContainers.forEach((c, i) => {
        c.x += velX * LAYER_SPEEDS[i]
        c.y += velY * LAYER_SPEEDS[i]
      })
    })

    // ── Resize handler ────────────────────────────────────────────────────────
    const onResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup',   onPointerUp)
      window.removeEventListener('resize',      onResize)
      document.head.removeChild(style)
      document.body.style.overflow = ''
      app.destroy(true, { children: true, texture: true })
    }
  }, [])

  return (
    <>
      {/* Noise / paper texture */}
      <div className="noise-overlay" />

      {/* Back button */}
      <Link
        to="/explore"
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 1100,
          color: 'white',
          textDecoration: 'none',
          fontSize: '1rem',
          border: '1px solid rgba(255,255,255,0.5)',
          padding: '0.8rem 1.6rem',
          borderRadius: '4px',
          transition: 'all 0.3s ease',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          textShadow: '0 0 10px rgba(0,0,0,0.8)',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'white'
          e.target.style.color = 'black'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(0,0,0,0.7)'
          e.target.style.color = 'white'
        }}
      >
        ← Back to Diagram
      </Link>

      {/* Drag hint */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          zIndex: 1100,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        drag to explore
      </div>

      {/* Pixi canvas mount point */}
      <div
        ref={containerRef}
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
      />
    </>
  )
}

export default Soul

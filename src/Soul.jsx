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
const LAYER_SPEEDS  = [0.05, 0.12, 0.38, 0.70, 1.0]
const LAYER_ALPHAS  = [0.45, 0.70, 0.82, 0.92, 0.96]

// ─── Groups ───────────────────────────────────────────────────────────────────
// x / y   : world-space anchor of the group (offset from viewport centre, px)
// layers  : which parallax layers this group uses
//
// To reposition an entire group, change x / y here — all member assets move together.
const GROUPS = {
  background:   { x:    0, y:    0, layers: [0]        }, // deepest layer — barely moves
  soulDiagram:  { x:    0, y:    0, layers: [1, 2, 3]  }, // centred on viewport
  soulDrawings: { x: -980, y:  890, layers: [3]        }, // screenshot cluster (pan down)
  pastLives:    { x: 3350, y: -190, layers: [4]        }, // far-right foreground
  foreground:   { x:    0, y:    0, layers: [4]        }, // centred overlay — full drag speed
}

// ─── Asset manifest ───────────────────────────────────────────────────────────
// group  : key into GROUPS — sets which sub-container this sprite lives in
// dx / dy: offset from the group anchor (px)
// targetH: target height as fraction of viewport height
// num    : sequential label number; omit to skip label
//
// Original imageIds order  →  num
//   soul17  01  soul16  02  soul15  03  soul14  04  soul10  05
//   soul13  06  soul12  07  soul11  08  soul9   09  soul8   10
//   soul7   11  soul6   12  soul5   13  soul4   14  soul3   15
//   soul1   16  soul2   17
const ASSETS = [
  // ── background — Layer 0 (deepest, speed 0.05 — barely drifts) ───────────────
  // Brick layout — 3 rows, rows 1 & 3 have 4 images, row 2 has 3 images staggered
  // by half a column width (275px) so every image fills the gap in the row above/below.
  // targetH 0.65 + 550px spacing = ~35px bleed on all sides → no visible gaps.
  //
  //  Row 1 (dy -560):  [  ]  [  ]  [  ]  [  ]
  //  Row 2 (dy    0):    [  ]  [  ]  [  ]       ← offset 275px right
  //  Row 3 (dy +560):  [  ]  [  ]  [  ]  [  ]
  { group: 'background', layer: 0, path: 'v1772036438/9cd0390853ca36d1286cc4967ee05a41_sutwjd.jpg', dx: -825, dy: -560, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036438/3b42cd9d826e3ecfc9389c2dd9cf6f9d_dz2pyn.jpg', dx: -275, dy: -560, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036439/51b2a05f1f11115489e144a931d5caf1_ozlpew.jpg', dx:  275, dy: -560, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036438/4defa773ed471aca4d2a3945f63bfdd9_c8ztdl.jpg', dx: 1100, dy: -560, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036439/5225d159a639eb7f2773a53ab8473d22_zwyc6g.jpg', dx: -550, dy:    0, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036439/b42ec538689019b9d07c430d17e6c3ea_zz2hsw.jpg', dx:    0, dy:    0, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036439/079859c663b1d61648ce619c3daeba6e_lx0ryt.jpg', dx:  550, dy:    0, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036439/5ad4c0c3e5a177f3a98482cae8c83b31_hoea6e.jpg', dx: -1450, dy:  560, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036439/00305d0250d13cb9381d027a36cd3f5f_oe86qj.jpg', dx: -275, dy:  560, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036440/479364c91549c324e403049852c412e4_ku5xiv.jpg', dx:  275, dy:  560, targetH: 0.65 },
  { group: 'background', layer: 0, path: 'v1772036574/a2e78f2637b50f35aed85951450d939f_tz2vwi.jpg', dx:  825, dy:  560, targetH: 0.65 },

  // Smaller accent images — rendered after the base grid so they sit on top,
  // intentionally overlapping the larger tiles beneath them (targetH ~0.37)
  { group: 'background', layer: 0, path: 'v1772037635/82382fae84cdc95bf4d57241f0e4adfd_mgjti2.jpg', dx: -650, dy: -280, targetH: 0.37 },
  { group: 'background', layer: 0, path: 'v1772037635/5dcf75ad9e2b8feeb22dec07f0adafaf_tmxeqc.jpg', dx:  150, dy: -380, targetH: 0.37 },
  { group: 'background', layer: 0, path: 'v1772037635/2b05ebea87c2397ac6bdb8fb8b171f13_i3avqj.jpg', dx:  680, dy:  180, targetH: 0.37 },
  { group: 'background', layer: 0, path: 'v1772037634/9339046ee36f6c8d7b01ff56bdcee231_ysvkfc.jpg', dx: -180, dy:  400, targetH: 0.37 },
  { group: 'background', layer: 0, path: 'v1772037635/498f79902d0503c09bb35655f1858f91_szli5o.jpg', dx: -1200, dy:  100, targetH: 0.37 },

  // ── soulDiagram — Layer 1 (slow background) ──────────────────────────────────
  { group: 'soulDiagram', layer: 1, path: 'soul17_xzycho', dx: -2900, dy: -320, targetH: 0.27, num:  1 },
  { group: 'soulDiagram', layer: 1, path: 'soul5_wyvcjp',  dx:  2600, dy:  310, targetH: 0.25, num: 13 },
  { group: 'soulDiagram', layer: 1, path: 'soul9_rlk43c',  dx:  -980, dy:  680, targetH: 0.29, num:  9 },
  { group: 'soulDiagram', layer: 1, path: 'soul13_vxxlen', dx:  3900, dy: -450, targetH: 0.27, num:  6 },
  { group: 'soulDiagram', layer: 1, path: 'soul1_wjjjri',  dx:   820, dy: -780, targetH: 0.25, num: 16 },

  // ── soulDiagram — Layer 2 (mid background) ───────────────────────────────────
  { group: 'soulDiagram', layer: 2, path: 'soul3_ivuzbz',  dx:  -780, dy:  -60, targetH: 0.34, num: 15 },
  { group: 'soulDiagram', layer: 2, path: 'soul6_kqsbzv',  dx:  1380, dy:  270, targetH: 0.32, num: 12 },
  { group: 'soulDiagram', layer: 2, path: 'soul10_zmmhq7', dx:  -500, dy:  570, targetH: 0.34, num:  5 },
  { group: 'soulDiagram', layer: 2, path: 'soul14_sii3a3', dx:  2450, dy: -160, targetH: 0.31, num:  4 },
  { group: 'soulDiagram', layer: 2, path: 'soul2_f7kf9t',  dx:   270, dy: -480, targetH: 0.34, num: 17 },
  { group: 'soulDiagram', layer: 2, path: 'soul8_yqgf3r',  dx: -1900, dy:  200, targetH: 0.32, num: 10 },

  // ── soulDiagram — Layer 3 (mid foreground) ───────────────────────────────────
  { group: 'soulDiagram', layer: 3, path: 'soul4_wzzogk',  dx:  -340, dy:  -35, targetH: 0.41, num: 14 },
  { group: 'soulDiagram', layer: 3, path: 'soul7_lqmts9',  dx:   880, dy:  145, targetH: 0.39, num: 11 },
  { group: 'soulDiagram', layer: 3, path: 'soul11_zphb7k', dx: -1300, dy:  400, targetH: 0.41, num:  8 },
  { group: 'soulDiagram', layer: 3, path: 'soul15_whnwwg', dx:  1950, dy: -125, targetH: 0.39, num:  3 },
  { group: 'soulDiagram', layer: 3, path: 'soul12_oif5tw', dx:   320, dy:  510, targetH: 0.37, num:  7 },
  { group: 'soulDiagram', layer: 3, path: 'soul16_krs78i', dx:  -840, dy: -460, targetH: 0.41, num:  2 },
  { group: 'background',  layer: 0, path: 'v1772056574/IMG_5118_inverted_v1m1sv.jpg', dx:  650, dy: -580, targetH: 0.80 },
  { group: 'background',  layer: 0, path: 'v1772056824/IMG_5110_inverted_ohjxhh.jpg',  dx: -950, dy:  380, targetH: 0.80 },

  // ── soulDrawings — Layer 3 (screenshot cluster, pan down to discover) ────────
  // dx / dy are relative to the soulDrawings anchor (-980, 890)
  // Layout is intentionally loose — column widths, row heights, and sizes all vary
  { group: 'soulDrawings', layer: 3, path: 'v1771996789/Screenshot_2026-02-24_205925_b4jzml.png', dx:    0, dy:    0, targetH: 0.32 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996790/Screenshot_2026-02-24_210041_oppyct.png', dx:  720, dy:  100, targetH: 0.34 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996790/Screenshot_2026-02-24_210232_oz4lum.png', dx: 1550, dy:  -40, targetH: 0.30 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996790/Screenshot_2026-02-24_210310_higf9w.png', dx: 2300, dy:   70, targetH: 0.33 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996792/Screenshot_2026-02-24_210337_pzdock.png', dx: -250, dy:  650, targetH: 0.35 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996792/Screenshot_2026-02-24_210418_xzgcsb.png', dx:  490, dy:  580, targetH: 0.29 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996793/Screenshot_2026-02-24_210456_s6uabb.png', dx: 1260, dy:  740, targetH: 0.34 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996794/Screenshot_2026-02-24_210525_kfcz9p.png', dx: 2050, dy:  660, targetH: 0.31 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996794/Screenshot_2026-02-24_210608_ovjgdh.png', dx:   80, dy: 1290, targetH: 0.30 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996796/Screenshot_2026-02-24_210913_nxuykr.png', dx:  850, dy: 1380, targetH: 0.36 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996797/Screenshot_2026-02-24_210934_zbkred.png', dx: 1680, dy: 1240, targetH: 0.31 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996797/Screenshot_2026-02-24_211021_mlscrk.png', dx: 2420, dy: 1360, targetH: 0.33 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996799/Screenshot_2026-02-24_211104_npbvoh.png', dx:  -90, dy: 1960, targetH: 0.33 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996800/Screenshot_2026-02-24_211219_s2wnk7.png', dx:  700, dy: 2040, targetH: 0.30 },
  { group: 'soulDrawings', layer: 3, path: 'v1771996801/Screenshot_2026-02-24_211833_io0tas.png', dx: 1500, dy: 1880, targetH: 0.34 },

  // ── pastLives — Layer 4 (foreground, full speed) ──────────────────────────────
  // dx / dy are relative to the pastLives anchor (3350, -190)
  { group: 'pastLives', layer: 4, path: 'v1769404831/Past_Lives_qyr4um.png',   dx:    0, dy:    0, targetH: 0.44 },
  { group: 'pastLives', layer: 4, path: 'v1769405868/Past_Lives_1_s0bdi8.png', dx:  800, dy:  285, targetH: 0.50 },
  { group: 'pastLives', layer: 4, path: 'v1769405930/Past_Lives_2_dzag5e.png', dx: 1570, dy:  435, targetH: 0.54 },
  { group: 'pastLives', layer: 4, path: 'v1769405968/Past_Lives_3_iayzuy.png', dx: 1570, dy: -110, targetH: 0.54 },
  { group: 'pastLives', layer: 4, path: 'v1769795840/12_maagy5.png',           dx: 2180, dy:  190, targetH: 0.54 },
  { group: 'pastLives', layer: 4, path: 'v1769795594/13_vo83au.png',           dx: 2480, dy:  190, targetH: 0.54 },

  // ── foreground — Layer 4 (centred overlay, drawn last = on top of everything) ─
  // PNG with transparent window-pane cutouts — parallax layers show through the glass
  { group: 'foreground', layer: 4, path: 'v1772041109/a_bb2cri.png',      dx:    0, dy:    0, targetH: 1.0 },
  { group: 'foreground', layer: 4, path: 'v1772041421/window2_uqqqeu.png', dx: 1599, dy:  880, targetH: 1.0 },
  { group: 'foreground', layer: 4, path: 'v1772041719/window3_rqju8h.png', dx: -2000, dy:  550, targetH: 1.0 },
  { group: 'foreground', layer: 4, path: 'v1772042102/window4_zesjs8.png', dx:   800, dy: -1500, targetH: 1.0 },
  { group: 'foreground', layer: 4, path: 'v1772042410/window5_qkby9s.png', dx:  -500, dy:  3000, targetH: 1.0 },
  { group: 'foreground', layer: 4, path: 'v1772042843/window6_pzbo0w.png', dx:  1200, dy:  2200, targetH: 1.0 },
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
    // posScale keeps layout density consistent across screen sizes.
    // All dx/dy offsets were designed at 1080px height — scale them proportionally.
    const posScale = H / 1080

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

    // ── Group sub-containers ──────────────────────────────────────────────────
    // groupContainers[groupName][layerIndex] = PIXI.Container
    // Each sub-container is positioned at its group's world-space anchor.
    // To reposition a group at runtime: groupContainers.soulDrawings[2].x += 100
    const groupContainers = {}
    Object.entries(GROUPS).forEach(([name, g]) => {
      groupContainers[name] = {}
      g.layers.forEach((li) => {
        const gc = new PIXI.Container()
        gc.x = W / 2 + g.x * posScale
        gc.y = H / 2 + g.y * posScale
        layerContainers[li].addChild(gc)
        groupContainers[name][li] = gc
      })
    })

    // ── Place all sprites ─────────────────────────────────────────────────────
    ASSETS.forEach((asset) => {
      const gc = groupContainers[asset.group][asset.layer]
      const targetHeightPx = H * asset.targetH

      const sprite = PIXI.Sprite.from(imgUrl(asset.path))
      sprite.anchor.set(0.5, 0.5)
      sprite.x = asset.dx * posScale   // relative to the group sub-container
      sprite.y = asset.dy * posScale
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
          // Position at bottom-right of the sprite (relative to group container)
          label.x = sprite.x + sprite.width  / 2
          label.y = sprite.y + sprite.height / 2 + 5
          gc.addChild(label)
        }
      }

      if (sprite.texture.baseTexture.valid) {
        setSpriteSize()
      } else {
        sprite.texture.baseTexture.once('loaded', setSpriteSize)
      }

      gc.addChild(sprite)
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

    // ── Trackpad / mouse wheel ────────────────────────────────────────────────
    // deltaMode 0 = pixels (trackpad), 1 = lines (mouse wheel), 2 = page
    const onWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey) return // pinch-to-zoom gesture — ignore

      const mul = e.deltaMode === 0 ? 1 : e.deltaMode === 1 ? 20 : 300
      const dx = -e.deltaX * mul
      const dy = -e.deltaY * mul
      layerContainers.forEach((c, i) => {
        c.x += dx * LAYER_SPEEDS[i]
        c.y += dy * LAYER_SPEEDS[i]
      })
    }
    // passive:false required so preventDefault() actually suppresses page scroll
    app.view.addEventListener('wheel', onWheel, { passive: false })

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
      app.view.removeEventListener('wheel', onWheel)
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

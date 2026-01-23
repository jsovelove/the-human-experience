import { useEffect, useRef, useState } from 'react'

function CellularAutomataText({ answers }) {
  const canvasRef = useRef(null)
  const [grid, setGrid] = useState([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  const cellSize = 8
  const cols = useRef(0)
  const rows = useRef(0)
  const animationFrameId = useRef(null)
  const textBoxRefs = useRef([])

  // Initialize grid
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width
    canvas.height = rect.height
    
    cols.current = Math.floor(canvas.width / cellSize)
    rows.current = Math.floor(canvas.height / cellSize)
    
    setDimensions({ width: canvas.width, height: canvas.height })
    
    // Create initial random grid
    const initialGrid = Array(rows.current)
      .fill(null)
      .map(() =>
        Array(cols.current)
          .fill(null)
          .map(() => (Math.random() > 0.7 ? 1 : 0))
      )
    
    setGrid(initialGrid)
  }, [])

  // Get blocked cells (where text boxes are)
  const getBlockedCells = () => {
    const blocked = new Set()
    
    textBoxRefs.current.forEach(ref => {
      if (!ref || !canvasRef.current) return
      
      const canvas = canvasRef.current
      const canvasRect = canvas.getBoundingClientRect()
      const textRect = ref.getBoundingClientRect()
      
      // Calculate relative position to canvas
      const relX = textRect.left - canvasRect.left
      const relY = textRect.top - canvasRect.top
      
      // Convert to grid coordinates with padding
      const padding = 2
      const startCol = Math.max(0, Math.floor(relX / cellSize) - padding)
      const endCol = Math.min(cols.current - 1, Math.floor((relX + textRect.width) / cellSize) + padding)
      const startRow = Math.max(0, Math.floor(relY / cellSize) - padding)
      const endRow = Math.min(rows.current - 1, Math.floor((relY + textRect.height) / cellSize) + padding)
      
      // Mark all cells in this area as blocked
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          blocked.add(`${row},${col}`)
        }
      }
    })
    
    return blocked
  }

  // Conway's Game of Life rules with text avoidance
  const computeNextGeneration = (currentGrid) => {
    const blockedCells = getBlockedCells()
    
    return currentGrid.map((row, i) =>
      row.map((cell, j) => {
        const key = `${i},${j}`
        
        // If this cell is blocked by text, keep it dead
        if (blockedCells.has(key)) {
          return 0
        }
        
        // Count live neighbors
        let neighbors = 0
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue
            
            const ni = i + di
            const nj = j + dj
            
            if (ni >= 0 && ni < rows.current && nj >= 0 && nj < cols.current) {
              neighbors += currentGrid[ni][nj]
            }
          }
        }
        
        // Conway's rules
        if (cell === 1) {
          // Cell is alive
          return neighbors === 2 || neighbors === 3 ? 1 : 0
        } else {
          // Cell is dead
          return neighbors === 3 ? 1 : 0
        }
      })
    )
  }

  // Animation loop
  useEffect(() => {
    if (grid.length === 0) return

    let frameCount = 0
    const updateInterval = 8 // Update every N frames for slower evolution

    const animate = () => {
      frameCount++
      
      if (frameCount % updateInterval === 0) {
        setGrid(currentGrid => computeNextGeneration(currentGrid))
      }
      
      animationFrameId.current = requestAnimationFrame(animate)
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [grid.length])

  // Render grid to canvas
  useEffect(() => {
    if (!canvasRef.current || grid.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw cells
    ctx.fillStyle = 'white'
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell === 1) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize - 1, cellSize - 1)
        }
      })
    })
  }, [grid])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '3000px',
      backgroundColor: 'black',
      overflow: 'hidden'
    }}>
      {/* Cellular automata canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.4
        }}
      />
      
      {/* Answer images */}
      {answers.map((answer, index) => (
        <div
          key={index}
          ref={el => textBoxRefs.current[index] = el}
          style={{
            position: 'absolute',
            top: answer.position.top,
            left: answer.position.left,
            width: answer.position.width,
            zIndex: 10
          }}
        >
          <img
            src={answer.imageUrl}
            alt={`Handwritten answer ${index + 1}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default CellularAutomataText


import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

function LikertScale({ data }) {
  const svgRef = useRef()
  const containerRef = useRef()

  useEffect(() => {
    if (!data || data.length === 0) return

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    // Get container dimensions
    const container = containerRef.current
    const width = Math.min(container.clientWidth, window.innerWidth - 40)
    const margin = { top: 50, right: 100, bottom: 60, left: 20 }
    const chartWidth = width - margin.left - margin.right
    const barHeight = 40
    const spacing = 100
    const height = data.length * (barHeight + spacing) + margin.top + margin.bottom

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Define Likert categories with grayscale gradient (dark to light)
    const categories = [
      { value: 1, label: 'Strongly Disagree', color: '#2a2a2a' },
      { value: 2, label: 'Disagree', color: '#4a4a4a' },
      { value: 3, label: 'Neutral', color: '#6a6a6a' },
      { value: 4, label: 'Agree', color: '#9a9a9a' },
      { value: 5, label: 'Strongly Agree', color: '#d0d0d0' }
    ]

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'likert-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('border', '1px solid rgba(255, 255, 255, 0.3)')

    // Draw bars for each question
    data.forEach((question, qIndex) => {
      const questionGroup = svg.append('g')
        .attr('transform', `translate(0, ${qIndex * (barHeight + spacing)})`)

      // Question text
      questionGroup.append('text')
        .attr('x', 0)
        .attr('y', -15)
        .attr('fill', 'white')
        .attr('font-size', '16px')
        .attr('font-weight', '400')
        .text(question.question)
        .call(wrap, chartWidth)

      // X scale for this question (0 to total responses)
      const totalResponses = question.total
      const xScale = d3.scaleLinear()
        .domain([0, totalResponses])
        .range([0, chartWidth])

      // Track cumulative position
      let currentX = 0

      // Draw stacked bars from left to right (1 -> 5)
      categories.forEach(category => {
        const count = question.distribution[category.value] || 0
        if (count > 0) {
          const barWidth = xScale(count)

          questionGroup.append('rect')
            .attr('x', currentX)
            .attr('y', 10)
            .attr('width', 0)
            .attr('height', barHeight)
            .attr('fill', category.color)
            .style('stroke', '#000')
            .style('stroke-width', '1px')
            .on('mouseover', function(event) {
              d3.select(this).attr('opacity', 0.7)
              tooltip
                .style('visibility', 'visible')
                .html(`<strong>${category.label}</strong><br/>Count: ${count}<br/>Percentage: ${((count / totalResponses) * 100).toFixed(1)}%`)
            })
            .on('mousemove', function(event) {
              tooltip
                .style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px')
            })
            .on('mouseout', function() {
              d3.select(this).attr('opacity', 1)
              tooltip.style('visibility', 'hidden')
            })
            .transition()
            .duration(800)
            .delay(qIndex * 100 + category.value * 50)
            .attr('width', barWidth)

          // Add count label if bar is wide enough
          if (barWidth > 25) {
            questionGroup.append('text')
              .attr('x', currentX + barWidth / 2)
              .attr('y', 10 + barHeight / 2)
              .attr('dy', '.35em')
              .attr('text-anchor', 'middle')
              .attr('fill', category.value <= 2 ? '#e0e0e0' : '#1a1a1a')
              .attr('font-size', '12px')
              .attr('font-weight', 'bold')
              .attr('opacity', 0)
              .text(count)
              .transition()
              .duration(800)
              .delay(qIndex * 100 + category.value * 50)
              .attr('opacity', 1)
          }

          currentX += barWidth
        }
      })

      // Add average score on the right
      questionGroup.append('text')
        .attr('x', chartWidth + 15)
        .attr('y', 10 + barHeight / 2)
        .attr('dy', '.35em')
        .attr('fill', 'white')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0)
        .text(`μ: ${question.average}`)
        .transition()
        .duration(800)
        .delay(qIndex * 100)
        .attr('opacity', 1)
    })

    // Add legend at bottom
    const legend = svg.append('g')
      .attr('transform', `translate(0, ${data.length * (barHeight + spacing) + 20})`)

    categories.forEach((category, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(${i * (chartWidth / 5)}, 0)`)

      legendItem.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', category.color)
        .style('stroke', '#000')
        .style('stroke-width', '1px')

      legendItem.append('text')
        .attr('x', 24)
        .attr('y', 14)
        .attr('fill', 'white')
        .attr('font-size', '11px')
        .text(category.label)
    })

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove()
    }
  }, [data])

  // Text wrapping function
  function wrap(text, width) {
    text.each(function() {
      const text = d3.select(this)
      const words = text.text().split(/\s+/).reverse()
      let word
      let line = []
      let lineNumber = 0
      const lineHeight = 1.1
      const y = text.attr('y')
      const dy = 0
      let tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em')
      
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(' '))
        if (tspan.node().getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word)
        }
      }
    })
  }

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: '1200px', overflowX: 'hidden', overflowY: 'visible', margin: '0 auto' }}>
      <svg ref={svgRef} style={{ display: 'block', width: '100%', maxWidth: '100%' }}></svg>
    </div>
  )
}

export default LikertScale


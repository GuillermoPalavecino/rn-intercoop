'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { GraphNode, GraphEdge } from '@/types'
import { RUBRO_COLORS, RUBRO_LABELS } from '@/lib/phase'

interface ForceGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  width?: number
  height?: number
}

export default function ForceGraph({ nodes, edges, width = 900, height = 600 }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g')

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(edges)
        .id(d => d.id)
        .distance(d => Math.max(80, 200 / ((d as GraphEdge).weight || 1)))
        .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>(d => nodeRadius(d) + 10))

    // Max weight para escalar grosor
    const maxWeight = Math.max(...edges.map(e => (e as GraphEdge).weight), 1)

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', d => 0.3 + 0.5 * (d.weight / maxWeight))
      .attr('stroke-width', d => 1 + 3 * (d.weight / maxWeight))

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null; d.fy = null
          }) as unknown as (selection: d3.Selection<d3.BaseType | SVGGElement, GraphNode, SVGGElement, unknown>) => void
      )

    node.append('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => RUBRO_COLORS[d.rubro] ?? '#6b7280')
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    node.append('text')
      .text(d => abbreviate(d.name))
      .attr('text-anchor', 'middle')
      .attr('dy', d => nodeRadius(d) + 12)
      .attr('font-size', 10)
      .attr('fill', '#1e293b')
      .attr('font-weight', '600')

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'fixed z-50 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 pointer-events-none opacity-0 transition-opacity max-w-48')

    node.on('mouseover', (event, d) => {
      tooltip
        .style('opacity', '1')
        .style('left', `${event.pageX + 12}px`)
        .style('top', `${event.pageY - 28}px`)
        .html(`<strong>${d.name}</strong><br/>${RUBRO_LABELS[d.rubro]}<br/>${d.offerCount} oferta${d.offerCount !== 1 ? 's' : ''}`)
    }).on('mouseout', () => tooltip.style('opacity', '0'))

    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0)

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => {
      sim.stop()
      tooltip.remove()
    }
  }, [nodes, edges, width, height])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="w-full h-full"
      viewBox={`0 0 ${width} ${height}`}
    />
  )
}

function nodeRadius(d: GraphNode) {
  return Math.max(14, Math.min(30, 12 + d.offerCount * 1.5))
}

function abbreviate(name: string): string {
  if (name.length <= 16) return name
  return name.slice(0, 14) + '…'
}

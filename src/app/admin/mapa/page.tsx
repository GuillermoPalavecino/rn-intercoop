'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import dynamicImport from 'next/dynamic'
import { GraphNode, GraphEdge, Cooperativa, Oferta, Necesidad } from '@/types'
import { RUBRO_COLORS, RUBRO_LABELS, SESSION_ID } from '@/lib/phase'
import LoadingSpinner from '@/components/LoadingSpinner'

const ForceGraph = dynamicImport(() => import('@/components/ForceGraph'), { ssr: false })

export default function AdminMapaPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const [coopsRes, ofertasRes, necesidadesRes] = await Promise.all([
        fetch('/api/cooperativas').then(r => r.json()),
        fetch('/api/ofertas?raw=true').then(r => r.json()),
        fetch('/api/necesidades?raw=true').then(r => r.json()),
      ])

      const coops: Cooperativa[] = coopsRes ?? []
      const todasOfertas: Oferta[] = ofertasRes ?? []
      const todasNecesidades: Necesidad[] = necesidadesRes ?? []

      // Construir mapa de ofertas y necesidades por cooperativa
      const ofertasPorCoop: Record<string, Set<string>> = {}
      const necesidadesPorCoop: Record<string, Set<string>> = {}

      for (const o of todasOfertas) {
        if (!ofertasPorCoop[o.cooperativa_id]) ofertasPorCoop[o.cooperativa_id] = new Set()
        ofertasPorCoop[o.cooperativa_id].add(o.palabra.toLowerCase())
      }
      for (const n of todasNecesidades) {
        if (!necesidadesPorCoop[n.cooperativa_id]) necesidadesPorCoop[n.cooperativa_id] = new Set()
        necesidadesPorCoop[n.cooperativa_id].add(n.palabra.toLowerCase())
      }

      // Nodos
      const graphNodes: GraphNode[] = coops.map(c => ({
        id: c.id,
        name: c.nombre_cooperativa,
        rubro: c.rubro,
        offerCount: ofertasPorCoop[c.id]?.size ?? 0,
      }))

      // Edges: A ofrece algo que B necesita, o B ofrece algo que A necesita
      const graphEdges: GraphEdge[] = []
      let totalMatches = 0

      for (let i = 0; i < coops.length; i++) {
        for (let j = i + 1; j < coops.length; j++) {
          const a = coops[i], b = coops[j]
          const aOfrece = ofertasPorCoop[a.id] ?? new Set()
          const bNecesita = necesidadesPorCoop[b.id] ?? new Set()
          const bOfrece = ofertasPorCoop[b.id] ?? new Set()
          const aNecesita = necesidadesPorCoop[a.id] ?? new Set()

          const shared: string[] = []
          for (const word of aOfrece) { if (bNecesita.has(word)) shared.push(word) }
          for (const word of bOfrece) { if (aNecesita.has(word)) shared.push(word) }

          if (shared.length > 0) {
            graphEdges.push({ source: a.id, target: b.id, weight: shared.length, sharedWords: [...new Set(shared)] })
            totalMatches++
          }
        }
      }

      setNodes(graphNodes)
      setEdges(graphEdges)
      setMatchCount(totalMatches)
      setLoading(false)
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col">
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Mapa de Intercooperación</h1>
          <p className="text-slate-400 text-sm">Relaciones entre cooperativas según ofertas y necesidades</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-green-400 font-bold text-2xl">{nodes.length}</div>
            <div className="text-slate-400 text-xs">cooperativas</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold text-2xl">{matchCount}</div>
            <div className="text-slate-400 text-xs">conexiones</div>
          </div>
        </div>
      </div>

      {/* Leyenda de rubros */}
      <div className="flex flex-wrap gap-3 px-6 py-2 bg-slate-800 border-t border-slate-700">
        {Object.entries(RUBRO_LABELS).map(([rubro, label]) => (
          <div key={rubro} className="flex items-center gap-1.5 text-xs text-slate-300">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RUBRO_COLORS[rubro] }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
          🖱️ Arrastrá los nodos · Hacé scroll para zoom
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner message="Calculando conexiones..." />
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-8">
            <div>
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-slate-400 text-xl">Esperando datos de cooperativas...</p>
            </div>
          </div>
        ) : (
          <ForceGraph nodes={nodes} edges={edges} width={1200} height={700} />
        )}
      </div>

      <div className="text-center pb-3 text-slate-600 text-xs">
        Intercoop FECORN · Grosor de línea = número de intereses compartidos
      </div>
    </main>
  )
}
